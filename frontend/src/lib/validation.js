import { z } from 'zod'

// User Preferences Schema
export const userPreferencesSchema = z.object({
  // Profile
  company: z.string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  
  capabilities: z.string()
    .max(500, 'Capabilities must be less than 500 characters')
    .optional(),
  
  samApiKey: z.string()
    .optional()
    .refine(
      (val) => !val || val.length >= 20,
      'API key must be at least 20 characters if provided'
    ),

  // Keywords & Industries
  keywords: z.array(z.string())
    .min(1, 'Select at least one keyword')
    .max(20, 'Maximum 20 keywords allowed'),
  
  naicsCodes: z.array(z.string())
    .max(10, 'Maximum 10 NAICS codes allowed'),
  
  customKeywords: z.string()
    .max(200, 'Custom keywords must be less than 200 characters')
    .optional(),

  // Contract Preferences
  minValue: z.number()
    .min(0, 'Minimum value must be positive')
    .max(1000000000, 'Minimum value too large'),
  
  maxValue: z.number()
    .min(0, 'Maximum value must be positive')
    .max(1000000000, 'Maximum value too large'),
  
  setAsideTypes: z.array(z.string())
    .max(10, 'Maximum 10 set-aside types allowed'),
  
  agencies: z.array(z.string())
    .max(15, 'Maximum 15 agencies allowed'),

  // Geographic
  statesOfInterest: z.array(z.string())
    .max(50, 'Maximum 50 states allowed'),

  // Notifications
  emailAlerts: z.boolean(),
  
  alertFrequency: z.enum(['immediate', 'daily', 'weekly'], {
    errorMap: () => ({ message: 'Select a valid alert frequency' })
  }),
  
  minScoreThreshold: z.number()
    .min(0, 'Score threshold must be at least 0')
    .max(100, 'Score threshold must be at most 100'),

  // Advanced Filters
  excludeKeywords: z.array(z.string())
    .max(20, 'Maximum 20 exclude keywords allowed'),
  
  competitionLevel: z.enum(['low', 'medium', 'high', 'all'], {
    errorMap: () => ({ message: 'Select a valid competition level' })
  }),
  
  opportunityTypes: z.array(z.enum(['contract', 'grant', 'rfp', 'bpa'], {
    errorMap: () => ({ message: 'Invalid opportunity type' })
  })).min(1, 'Select at least one opportunity type'),

  // Onboarding
  isOnboarded: z.boolean().optional()
}).refine(
  (data) => data.maxValue >= data.minValue,
  {
    message: 'Maximum value must be greater than or equal to minimum value',
    path: ['maxValue']
  }
)

// Search Form Schema
export const searchFormSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must be less than 200 characters'),
  
  filters: z.object({
    minValue: z.number().min(0).optional(),
    maxValue: z.number().min(0).optional(),
    agencies: z.array(z.string()).optional(),
    dateRange: z.object({
      from: z.date().optional(),
      to: z.date().optional()
    }).optional()
  }).optional()
}).refine(
  (data) => {
    if (data.filters?.minValue && data.filters?.maxValue) {
      return data.filters.maxValue >= data.filters.minValue
    }
    return true
  },
  {
    message: 'Maximum value must be greater than minimum value',
    path: ['filters', 'maxValue']
  }
)

// Contact Form Schema
export const contactFormSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  
  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters'),
  
  message: z.string()
    .min(1, 'Message is required')
    .max(1000, 'Message must be less than 1000 characters'),
  
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Select a valid priority' })
  }).optional()
})

// API Key Validation Schema
export const apiKeySchema = z.object({
  samApiKey: z.string()
    .min(20, 'SAM.gov API key must be at least 20 characters')
    .max(100, 'API key too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'API key contains invalid characters'),
  
  firecrawlApiKey: z.string()
    .min(10, 'Firecrawl API key must be at least 10 characters')
    .max(100, 'API key too long')
    .optional(),
  
  perplexityApiKey: z.string()
    .min(10, 'Perplexity API key must be at least 10 characters')
    .max(100, 'API key too long')
    .optional()
})

// Opportunity Filter Schema
export const opportunityFilterSchema = z.object({
  keywords: z.array(z.string()).optional(),
  agencies: z.array(z.string()).optional(),
  valueRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional()
  }).optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional()
  }).optional(),
  scoreThreshold: z.number().min(0).max(100).optional(),
  opportunityTypes: z.array(z.string()).optional(),
  sortBy: z.enum(['score', 'value', 'date', 'deadline'], {
    errorMap: () => ({ message: 'Invalid sort option' })
  }).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

// Validation helper functions
export const validateEmail = (email) => {
  try {
    z.string().email().parse(email)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid email address' }
  }
}

export const validateUrl = (url) => {
  try {
    z.string().url().parse(url)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' }
  }
}

export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  if (!phone || phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    return { valid: true }
  }
  return { valid: false, error: 'Invalid phone number format' }
}

export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return { valid: true }
  }
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' }
  }
  
  return { valid: true }
}

// Custom validation rules
export const customValidationRules = {
  // Minimum score threshold should be reasonable
  minScoreThreshold: (value) => {
    if (value < 50) {
      return 'Score threshold below 50% may return too many irrelevant results'
    }
    return true
  },
  
  // Value range should be reasonable
  valueRange: (min, max) => {
    if (max - min < 10000) {
      return 'Value range too narrow - consider broadening your search'
    }
    if (max / min > 1000) {
      return 'Value range very wide - consider narrowing for better results'
    }
    return true
  },
  
  // Keyword count should be manageable
  keywordCount: (keywords) => {
    if (keywords.length > 10) {
      return 'Too many keywords may dilute search results - consider focusing on the most important ones'
    }
    return true
  }
}

// Schema transformation helpers
export const transformUserPreferences = (formData) => {
  try {
    return userPreferencesSchema.parse(formData)
  } catch (error) {
    throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`)
  }
}

export const getFieldError = (errors, fieldPath) => {
  const pathArray = fieldPath.split('.')
  let current = errors
  
  for (const path of pathArray) {
    if (current?.[path]) {
      current = current[path]
    } else {
      return null
    }
  }
  
  return current?.message || null
}

// Form validation helpers for react-hook-form
export const createFormValidation = (schema) => {
  return {
    resolver: async (data) => {
      try {
        const validData = schema.parse(data)
        return { values: validData, errors: {} }
      } catch (error) {
        const formattedErrors = {}
        
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          formattedErrors[path] = { message: err.message }
        })
        
        return { values: {}, errors: formattedErrors }
      }
    }
  }
}