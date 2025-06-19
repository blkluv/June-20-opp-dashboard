import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  Smartphone, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  Download,
  QrCode,
  Key,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const MFASetupPage = () => {
  const navigate = useNavigate()
  const { user, setupMFA, verifyMFA } = useAuth()
  const [step, setStep] = useState('setup') // setup, verify, complete
  const [isLoading, setIsLoading] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Initialize MFA setup
  useEffect(() => {
    initializeMFASetup()
  }, [])

  const initializeMFASetup = async () => {
    setIsLoading(true)
    try {
      const result = await setupMFA()
      if (result.success) {
        setQrCode(result.qrCode)
        setSecret(result.secret)
        setBackupCodes(result.backupCodes)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await verifyMFA(verificationCode)
      if (result.success && result.enabled) {
        setStep('complete')
      } else {
        setError('Invalid verification code. Please try again.')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mfa-backup-codes.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const authenticatorApps = [
    { name: 'Google Authenticator', platforms: ['iOS', 'Android'] },
    { name: 'Microsoft Authenticator', platforms: ['iOS', 'Android', 'Windows'] },
    { name: 'Authy', platforms: ['iOS', 'Android', 'Desktop'] },
    { name: '1Password', platforms: ['iOS', 'Android', 'Desktop'] }
  ]

  if (!user) {
    return <div>Please log in to set up MFA</div>
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary rounded-xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Set Up Two-Factor Authentication</h1>
          <p className="text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>

        {/* Setup Step */}
        {step === 'setup' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>Step 1: Configure Your Authenticator App</span>
              </CardTitle>
              <CardDescription>
                Scan the QR code or manually enter the secret key into your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Recommended Apps */}
                  <div className="space-y-3">
                    <h3 className="font-medium">Recommended Authenticator Apps</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {authenticatorApps.map((app) => (
                        <div key={app.name} className="p-3 border rounded-lg">
                          <div className="font-medium text-sm">{app.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {app.platforms.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* QR Code */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Scan QR Code</h3>
                    <div className="flex justify-center">
                      {qrCode ? (
                        <div className="p-4 bg-white rounded-lg border">
                          <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                        </div>
                      ) : (
                        <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <QrCode className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Manual Entry */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Or Enter Manually</h3>
                    <div className="space-y-2">
                      <Label>Secret Key</Label>
                      <div className="flex space-x-2">
                        <Input 
                          value={secret} 
                          readOnly 
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(secret)}
                        >
                          {copied ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Account: {user.email}
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setStep('verify')} 
                    className="w-full"
                    disabled={!qrCode}
                  >
                    Continue to Verification
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Verification Step */}
        {step === 'verify' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>Step 2: Verify Your Setup</span>
              </CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app to complete setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="000000"
                    maxLength="6"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="text-center text-lg tracking-widest"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('setup')}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleVerification}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Enable'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion Step */}
        {step === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Two-Factor Authentication Enabled</span>
              </CardTitle>
              <CardDescription>
                Your account is now protected with two-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Backup Codes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Backup Codes</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadBackupCodes}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <Badge key={index} variant="secondary" className="justify-center p-2 font-mono">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Next Steps */}
              <div className="space-y-4">
                <h3 className="font-medium">What's Next?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Two-factor authentication is now required for login</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Keep your backup codes in a safe, secure location</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>You can manage MFA settings in your account preferences</span>
                  </li>
                </ul>
              </div>

              <Button 
                onClick={() => navigate('/settings')} 
                className="w-full"
              >
                Continue to Settings
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Back to Dashboard */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MFASetupPage