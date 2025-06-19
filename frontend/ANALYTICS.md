# 📊 Analytics & Monitoring Integration

Complete analytics infrastructure for the Opportunity Dashboard with **PostHog**, **Sentry**, **Mixpanel**, and **Hotjar** integration.

## 🎯 **What's Included**

### **PostHog** - Product Analytics & Feature Flags
- **Event Tracking**: User interactions, feature usage, business metrics
- **Feature Flags**: A/B testing and gradual feature rollouts  
- **Session Recordings**: User behavior analysis
- **Funnels & Cohorts**: Conversion tracking and user retention

### **Sentry** - Error Monitoring & Performance
- **Error Tracking**: JavaScript errors, API failures, component crashes
- **Performance Monitoring**: API response times, web vitals, loading metrics
- **Release Tracking**: Error rates across deployments
- **User Context**: Error attribution and impact analysis

### **Mixpanel** - Advanced User Analytics
- **User Journey**: Registration, onboarding, feature adoption
- **Business Intelligence**: Opportunity views, applications, conversions
- **Cohort Analysis**: User behavior patterns and retention
- **Revenue Attribution**: Contract values and success tracking

### **Hotjar** - User Experience Analytics
- **Heatmaps**: Click patterns and user attention
- **Session Recordings**: Real user interactions
- **Surveys & Feedback**: User satisfaction and feature requests
- **Form Analysis**: Conversion optimization

---

## 🚀 **Quick Setup**

### 1. **Environment Configuration**
Copy `.env.example` to `.env` and add your API keys:

```bash
# PostHog (Required)
VITE_POSTHOG_KEY=phc_your_key_here

# Sentry (Recommended)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project

# Mixpanel (Optional)
VITE_MIXPANEL_TOKEN=your_token_here

# Hotjar (Optional)
VITE_HOTJAR_ID=your_site_id_here
```

### 2. **Install Dependencies** (when packages are available)
```bash
npm install posthog-js @sentry/react @sentry/tracing mixpanel-browser
```

### 3. **Analytics Auto-Initialize**
Analytics start automatically when the app loads. No manual setup required!

---

## 📈 **What Gets Tracked**

### **User Events**
- ✅ **Registration/Login**: User lifecycle and authentication
- ✅ **Page Views**: Navigation patterns and popular sections  
- ✅ **Feature Usage**: Which tools users engage with most
- ✅ **Onboarding**: Completion rates and drop-off points

### **Opportunity Interactions** 
- ✅ **Opportunity Views**: Which opportunities get attention
- ✅ **Saves/Bookmarks**: User intent and interest levels
- ✅ **Applications**: Conversion from view to action
- ✅ **Search Behavior**: Query patterns and result relevance

### **AI & Discovery**
- ✅ **AI Queries**: Perplexity usage patterns and success rates
- ✅ **Search Performance**: Query effectiveness and user satisfaction
- ✅ **Intelligence Views**: Most valuable insights and reports

### **Web Scraping Analytics**
- ✅ **Scraping Sessions**: Source performance and reliability
- ✅ **Source Usage**: Which RFP sources provide best results
- ✅ **Success Rates**: Data quality and scraping efficiency

### **Technical Performance**
- ✅ **API Response Times**: Backend performance monitoring
- ✅ **Error Rates**: System reliability and user experience
- ✅ **Web Vitals**: Core performance metrics (LCP, FID, CLS)
- ✅ **Feature Load Times**: Component rendering performance

---

## 🎛️ **Advanced Features**

### **Feature Flags** (PostHog)
Control feature rollouts and A/B testing:

```javascript
import { analyticsManager } from '@/lib/analytics'

// Check if feature is enabled
if (analyticsManager.featureFlags.isEnabled('new_dashboard_design')) {
  // Show new design
} else {
  // Show current design
}

// Get feature flag value
const dashboardVariant = analyticsManager.featureFlags.getValue('dashboard_variant', 'default')
```

### **Custom Event Tracking**
Track business-specific events:

```javascript
// Opportunity saved
analyticsManager.opportunitySaved(opportunityId, {
  source_type: 'government',
  estimated_value: 500000,
  user_score: 85
})

// Feature usage
analyticsManager.featureUsed('advanced_filtering', {
  filter_count: 3,
  results_found: 42
})

// Custom business events  
analyticsManager.track('contract_won', {
  opportunity_id: 'opp_123',
  contract_value: 250000,
  time_to_close_days: 45
})
```

### **Error Tracking**
Comprehensive error monitoring:

```javascript
// Automatic error capture (already set up)
// Manual error tracking
analyticsManager.trackError(new Error('Custom error'), {
  context: 'user_action',
  feature: 'opportunity_search'
})
```

### **Performance Monitoring**
Track feature performance:

```javascript
// API response time tracking (automatic)
// Custom performance metrics
analyticsManager.performanceMetric('feature_load_time', 1250, {
  feature_name: 'advanced_scraping',
  user_id: 'user_123'
})
```

---

## 📊 **Key Metrics Dashboard**

### **Business Metrics**
- **User Activation**: % completing onboarding
- **Feature Adoption**: Weekly/Monthly active users per feature
- **Opportunity Engagement**: View-to-application conversion rates
- **Revenue Attribution**: Contract values from platform opportunities

### **Product Metrics**  
- **Session Duration**: Average time spent in app
- **Feature Stickiness**: Daily/Monthly usage ratios
- **Search Success**: Query-to-result satisfaction
- **Error Rates**: Technical reliability indicators

### **Performance Metrics**
- **Page Load Times**: Core Web Vitals compliance
- **API Response Times**: Backend performance trends  
- **Error Frequency**: System stability monitoring
- **User Experience**: Hotjar satisfaction scores

---

## 🔧 **Configuration Options**

### **Privacy Controls**
```javascript
// Disable specific tracking
VITE_ENABLE_SESSION_RECORDING=false
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_ANALYTICS=true
```

### **Development Mode**
```javascript
// Enhanced logging in development
VITE_ENABLE_DEBUG_MODE=true
```

### **Custom Event Categories**
Events are automatically categorized:
- **User Actions**: Clicks, form submissions, navigation
- **Business Events**: Opportunities, applications, conversions  
- **Technical Events**: Errors, performance, API calls
- **Product Events**: Feature usage, experiments, feedback

---

## 📋 **Analytics Checklist**

### **Setup** ✅
- [x] PostHog integration with event tracking
- [x] Sentry error monitoring and performance
- [x] Mixpanel user analytics and funnels
- [x] Hotjar user experience tracking
- [x] Unified analytics manager
- [x] Automatic event tracking
- [x] Error boundary integration
- [x] API performance monitoring

### **Business Intelligence** ✅
- [x] Opportunity interaction tracking
- [x] User journey mapping
- [x] Feature adoption metrics
- [x] Conversion funnel analysis
- [x] Revenue attribution
- [x] Search behavior analysis
- [x] AI query performance
- [x] Scraping effectiveness metrics

### **Technical Monitoring** ✅
- [x] Real-time error tracking
- [x] Performance monitoring
- [x] API response time tracking
- [x] Web vitals measurement
- [x] Component render timing
- [x] Feature flag management
- [x] A/B testing infrastructure
- [x] Session recording capabilities

---

## 🎯 **Next Steps**

1. **Set up accounts** with PostHog, Sentry, Mixpanel, and Hotjar
2. **Add API keys** to your `.env` file
3. **Install packages** when dependency conflicts are resolved
4. **Configure dashboards** in each analytics platform
5. **Set up alerts** for critical errors and performance issues
6. **Create funnels** for key user journeys
7. **Define KPIs** for business success metrics

The analytics infrastructure is now ready to provide comprehensive insights into user behavior, product performance, and business outcomes! 🚀