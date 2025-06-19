import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Server, 
  Clock,
  ShieldAlert,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

const errorTypes = {
  network: {
    icon: WifiOff,
    title: 'Connection Error',
    description: 'Unable to connect to the server',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  timeout: {
    icon: Clock,
    title: 'Request Timeout',
    description: 'The request took too long to complete',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  server: {
    icon: Server,
    title: 'Server Error',
    description: 'Something went wrong on our end',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  unauthorized: {
    icon: ShieldAlert,
    title: 'Authentication Required',
    description: 'Please check your API keys and permissions',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  notFound: {
    icon: Database,
    title: 'No Data Found',
    description: 'No results match your current criteria',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  general: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    description: 'An unexpected error occurred',
    color: 'text-destructive',
    bgColor: 'bg-destructive/5',
    borderColor: 'border-destructive/20'
  }
}

export function ErrorState({ 
  type = 'general',
  title,
  description,
  error,
  onRetry,
  retryLabel = 'Try Again',
  children,
  className,
  showDetails = false
}) {
  const errorConfig = errorTypes[type] || errorTypes.general
  const Icon = errorConfig.icon

  return (
    <Card className={cn(
      'border-2',
      errorConfig.borderColor,
      errorConfig.bgColor,
      className
    )}>
      <CardHeader className="text-center">
        <div className={cn(
          "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4",
          errorConfig.bgColor
        )}>
          <Icon className={cn("w-6 h-6", errorConfig.color)} />
        </div>
        <CardTitle className={errorConfig.color}>
          {title || errorConfig.title}
        </CardTitle>
        <CardDescription>
          {description || errorConfig.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showDetails && error && process.env.NODE_ENV === 'development' && (
          <details className="text-xs bg-white/50 p-3 rounded border">
            <summary className="cursor-pointer font-medium mb-2">
              Error Details (Development)
            </summary>
            <pre className="whitespace-pre-wrap text-muted-foreground">
              {error.toString()}
            </pre>
          </details>
        )}
        
        {children}
        
        {onRetry && (
          <div className="flex justify-center">
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {retryLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function NetworkErrorState({ onRetry, ...props }) {
  return (
    <ErrorState
      type="network"
      onRetry={onRetry}
      retryLabel="Check Connection"
      {...props}
    >
      <div className="text-center text-sm text-muted-foreground">
        <p>Please check your internet connection and try again.</p>
      </div>
    </ErrorState>
  )
}

export function TimeoutErrorState({ onRetry, ...props }) {
  return (
    <ErrorState
      type="timeout"
      onRetry={onRetry}
      retryLabel="Retry Request"
      {...props}
    >
      <div className="text-center text-sm text-muted-foreground">
        <p>The server is taking longer than expected to respond.</p>
      </div>
    </ErrorState>
  )
}

export function ServerErrorState({ onRetry, ...props }) {
  return (
    <ErrorState
      type="server"
      onRetry={onRetry}
      retryLabel="Retry"
      {...props}
    >
      <div className="text-center text-sm text-muted-foreground">
        <p>Our team has been notified and is working on a fix.</p>
      </div>
    </ErrorState>
  )
}

export function UnauthorizedErrorState({ onRetry, ...props }) {
  return (
    <ErrorState
      type="unauthorized"
      onRetry={onRetry}
      retryLabel="Check Settings"
      {...props}
    >
      <div className="text-center text-sm text-muted-foreground">
        <p>Go to Settings to verify your API keys are correct.</p>
      </div>
    </ErrorState>
  )
}

export function NotFoundErrorState({ onRetry, title, description, ...props }) {
  return (
    <ErrorState
      type="notFound"
      title={title || "No Results Found"}
      description={description || "Try adjusting your search criteria or filters"}
      onRetry={onRetry}
      retryLabel="Clear Filters"
      {...props}
    >
      <div className="text-center text-sm text-muted-foreground">
        <p>• Broaden your search terms</p>
        <p>• Check your filter settings</p>
        <p>• Try different keywords</p>
      </div>
    </ErrorState>
  )
}

// Hook for determining error type from error object
export function useErrorType(error) {
  if (!error) return 'general'
  
  const message = error.message?.toLowerCase() || ''
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'network'
  }
  if (message.includes('timeout') || message.includes('aborted')) {
    return 'timeout'
  }
  if (message.includes('401') || message.includes('unauthorized')) {
    return 'unauthorized'
  }
  if (message.includes('404') || message.includes('not found')) {
    return 'notFound'
  }
  if (message.includes('500') || message.includes('server')) {
    return 'server'
  }
  
  return 'general'
}

// Inline error component for smaller spaces
export function InlineError({ error, onRetry, className }) {
  const errorType = useErrorType(error)
  const config = errorTypes[errorType]
  const Icon = config.icon

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      config.borderColor,
      config.bgColor,
      className
    )}>
      <div className="flex items-center space-x-2">
        <Icon className={cn("w-4 h-4", config.color)} />
        <span className="text-sm font-medium">
          {config.title}
        </span>
      </div>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline">
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  )
}