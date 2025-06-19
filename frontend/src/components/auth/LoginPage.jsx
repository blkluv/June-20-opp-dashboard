import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Shield,
  AlertTriangle,
  Target,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().optional()
})

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [requiresMFA, setRequiresMFA] = useState(false)
  const [mfaMethod, setMfaMethod] = useState('')

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      mfaCode: ''
    }
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await login(data.email, data.password, data.mfaCode)
      
      if (result.requiresMFA) {
        setRequiresMFA(true)
        setMfaMethod(result.mfaMethod)
      } else if (result.success) {
        navigate('/')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Branding */}
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary rounded-xl shadow-lg mb-4">
            <Target className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">OpportunityHub</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Secure access to government contracting opportunities
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              {requiresMFA ? 'Enter Verification Code' : 'Sign In'}
            </CardTitle>
            <CardDescription className="text-center">
              {requiresMFA 
                ? `Enter the 6-digit code from your ${mfaMethod === 'totp' ? 'authenticator app' : 'mobile device'}`
                : 'Enter your credentials to access your account'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!requiresMFA && (
                <>
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        {...form.register('email')}
                        error={form.formState.errors.email?.message}
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        {...form.register('password')}
                        error={form.formState.errors.password?.message}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {form.formState.errors.password && (
                      <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                    )}
                  </div>
                </>
              )}

              {/* MFA Code Field */}
              {requiresMFA && (
                <div className="space-y-2">
                  <Label htmlFor="mfaCode">Verification Code</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="mfaCode"
                      type="text"
                      placeholder="000000"
                      maxLength="6"
                      className="pl-10 text-center text-lg tracking-widest"
                      {...form.register('mfaCode')}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                    />
                  </div>
                  {form.formState.errors.mfaCode && (
                    <p className="text-sm text-red-600">{form.formState.errors.mfaCode.message}</p>
                  )}
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {requiresMFA ? 'Verifying...' : 'Signing In...'}
                  </>
                ) : (
                  requiresMFA ? 'Verify Code' : 'Sign In'
                )}
              </Button>

              {/* Back Button for MFA */}
              {requiresMFA && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setRequiresMFA(false)
                    setMfaMethod('')
                    form.setValue('mfaCode', '')
                  }}
                >
                  Back to Login
                </Button>
              )}
            </form>

            {!requiresMFA && (
              <>
                <Separator />
                
                {/* Additional Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <Link 
                      to="/forgot-password" 
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Forgot password?
                    </Link>
                    <Link 
                      to="/register" 
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Create account
                    </Link>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Your data is encrypted and secure</span>
          </div>
          <p className="text-xs text-gray-400">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage