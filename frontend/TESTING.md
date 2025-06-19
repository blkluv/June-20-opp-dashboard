# Testing & Error Handling Guide

This document outlines the comprehensive testing infrastructure and error handling capabilities implemented in the Opportunity Dashboard frontend.

## 🧪 Testing Infrastructure

### Technology Stack
- **Testing Framework**: Vitest (fast, ESM-native)
- **React Testing**: @testing-library/react
- **User Interactions**: @testing-library/user-event
- **API Mocking**: MSW (Mock Service Worker)
- **Coverage**: @vitest/coverage-v8
- **UI Testing**: @vitest/ui

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
src/
├── test/
│   ├── setup.js              # Global test configuration
│   ├── utils.jsx              # Test utilities and helpers
│   ├── mocks/
│   │   └── server.js          # MSW API mock server
│   └── integration.test.jsx   # Integration tests
├── components/
│   ├── __tests__/
│   │   ├── ErrorBoundary.test.jsx
│   │   └── ...
│   └── ui/
│       └── __tests__/
│           └── error-state.test.jsx
└── lib/
    └── __tests__/
        └── api.test.js
```

### Test Categories

#### 1. **Unit Tests**
- Component rendering
- User interactions
- State management
- Utility functions

#### 2. **Integration Tests**
- API integration
- Component communication
- Navigation flows
- Error scenarios

#### 3. **API Tests**
- Request/response handling
- Error handling
- Data transformation
- Timeout handling

### Mock Service Worker (MSW)

API responses are mocked using MSW for consistent testing:

```javascript
// Example mock endpoint
http.get('/api/opportunities/personalized', () => {
  return HttpResponse.json({
    success: true,
    opportunities: mockOpportunities,
    insights: mockInsights
  })
})
```

**Available Mock Endpoints:**
- `/api/health` - Health check
- `/api/opportunities` - All opportunities
- `/api/opportunities/personalized` - Personalized opportunities
- `/api/user/preferences` - User preferences (GET/POST)
- `/api/analytics/*` - Analytics endpoints
- `/api/test/*` - Error simulation endpoints

### Test Utilities

#### `renderWithProviders()`
Renders components with all necessary providers:
```javascript
import { renderWithProviders } from '../test/utils'

renderWithProviders(<YourComponent />, {
  initialRoute: '/personalized'
})
```

#### Mock Data Factories
```javascript
import { createMockOpportunity, createMockUserPreferences } from '../test/utils'

const opportunity = createMockOpportunity({
  title: 'Custom Title',
  estimated_value: 2000000
})
```

#### Error Testing
```javascript
// Test network errors
server.use(
  http.get('*/api/test/network-error', () => HttpResponse.error())
)
```

## 🛡️ Error Handling System

### Error Boundary Implementation

#### Main Error Boundary
```jsx
<ErrorBoundary fallback={PageErrorFallback}>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Automatic error catching
- Development error details
- Production-friendly UI
- Reset functionality
- Home navigation

#### Specialized Fallbacks
- `PageErrorFallback` - Full page errors
- `ComponentErrorFallback` - Component-level errors
- Custom fallback components

### Error State Components

#### Smart Error States
```jsx
import { ErrorState, NetworkErrorState, TimeoutErrorState } from '@/components/ui/error-state'

// Automatically detects error type
<ErrorState error={error} onRetry={handleRetry} />

// Specific error types
<NetworkErrorState onRetry={checkConnection} />
<TimeoutErrorState onRetry={retryRequest} />
```

**Available Error Types:**
- `network` - Connection issues
- `timeout` - Request timeouts
- `server` - Server errors (5xx)
- `unauthorized` - Authentication errors (401)
- `notFound` - Not found errors (404)
- `general` - Generic errors

#### Inline Error Handling
```jsx
import { InlineError } from '@/components/ui/error-state'

<InlineError error={error} onRetry={handleRetry} />
```

### API Error Handling

#### Automatic Error Detection
```javascript
import { useErrorType } from '@/components/ui/error-state'

const errorType = useErrorType(error) // Returns: 'network', 'timeout', etc.
```

#### API Client Error Handling
```javascript
try {
  const data = await apiClient.request('/endpoint')
} catch (error) {
  // Automatic error classification
  // Proper error messages
  // Timeout handling
  // Network failure detection
}
```

### Form Validation

#### Zod Schema Validation
```javascript
import { userPreferencesSchema } from '@/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm({
  resolver: zodResolver(userPreferencesSchema)
})
```

**Available Schemas:**
- `userPreferencesSchema` - User settings validation
- `searchFormSchema` - Search form validation
- `contactFormSchema` - Contact form validation
- `apiKeySchema` - API key validation

#### Form Error Display
```jsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'

<Form {...form}>
  <FormField
    control={form.control}
    name="company"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Company Name</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage /> {/* Automatic error display */}
      </FormItem>
    )}
  />
</Form>
```

## 🔍 Testing Best Practices

### 1. **Test Structure**
```javascript
describe('Component Name', () => {
  beforeEach(() => {
    // Setup
  })

  it('should render correctly', () => {
    // Test
  })

  it('should handle user interactions', async () => {
    // Test with user events
  })
})
```

### 2. **User-Centric Testing**
```javascript
const user = userEvent.setup()

// Prefer user events over fireEvent
await user.click(button)
await user.type(input, 'text')
```

### 3. **Async Testing**
```javascript
// Wait for elements
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})

// Wait for API calls
await waitFor(() => {
  expect(mockApi).toHaveBeenCalledWith('/endpoint')
})
```

### 4. **Error Testing**
```javascript
// Mock console.error to avoid noise
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

// Test error scenarios
expect(() => {
  render(<ComponentThatThrows />)
}).toThrow()

consoleSpy.mockRestore()
```

## 🚀 Performance & Monitoring

### Test Performance
- Fast test execution with Vitest
- Parallel test running
- Optimized mock server
- Efficient component rendering

### Error Monitoring
- Development error details
- Production error boundaries
- User-friendly error messages
- Automatic error classification

### Coverage Reporting
```bash
npm run test:coverage
```

Generates detailed coverage reports in:
- Terminal output
- HTML report (`coverage/index.html`)
- JSON data (`coverage/coverage.json`)

## 📋 Checklist for New Features

When adding new features, ensure:

### ✅ Testing
- [ ] Unit tests for components
- [ ] Integration tests for flows
- [ ] API mocking for data dependencies
- [ ] Error scenario testing
- [ ] User interaction testing

### ✅ Error Handling
- [ ] Error boundaries for component crashes
- [ ] API error handling with appropriate UI
- [ ] Form validation with clear messages
- [ ] Loading and error states
- [ ] Graceful degradation

### ✅ Validation
- [ ] Zod schemas for data validation
- [ ] Form validation with react-hook-form
- [ ] Input sanitization
- [ ] Error message clarity

## 🔧 Troubleshooting

### Common Issues

#### Tests not running
```bash
# Check Vitest installation
npm list vitest

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Mock server issues
```bash
# Ensure MSW is properly configured
# Check test/mocks/server.js setup
# Verify mock handlers are correct
```

#### Error boundary not catching
```bash
# Ensure Error Boundary wraps components
# Check React.StrictMode compatibility
# Verify error boundary implementation
```

This comprehensive testing and error handling system ensures a robust, production-ready application with excellent user experience and developer productivity.