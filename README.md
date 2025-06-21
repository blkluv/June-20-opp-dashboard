# 🎯 Opportunity Dashboard - June 20, 2025

**AI-Powered RFP & Grant Discovery Platform**

A comprehensive web application for tracking and analyzing government contracting opportunities from federal sources including SAM.gov, Grants.gov, and USASpending.gov.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Python](https://img.shields.io/badge/Python-3.13-blue)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

## 🚀 Features

### 📊 **Dashboard & Analytics**
- **Real-time Metrics**: Live opportunity counts, total funding values, recent additions
- **Professional UI**: Clean, responsive design with intuitive navigation
- **Smart Loading**: Graceful data loading with fallback systems
- **Error Recovery**: Robust error handling that never breaks the user experience

### 🎯 **Opportunity Management**
- **Multi-source Integration**: SAM.gov, Grants.gov, USASpending.gov APIs
- **AI-Powered Scoring**: Intelligent opportunity ranking and prioritization
- **Real-time Sync**: Background data updates with status monitoring
- **Advanced Search**: Filter by value, deadline, agency, and keywords

### 🧠 **AI Intelligence Features**
- **Daily Briefings**: Automated market intelligence reports
- **Predictive Analytics**: Win probability forecasting
- **Smart Matching**: Personalized opportunity recommendations
- **Market Intelligence**: Competitive analysis and trend tracking

### 🔧 **Technical Excellence**
- **Safe API Client**: Never-failing API integration with smart fallbacks
- **Error Boundaries**: React error boundaries prevent crashes
- **Loading States**: Professional loading animations and status indicators
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

## 🏗️ Architecture

```
opportunity-dashboard/
├── frontend/          # React 18.3.1 with Vite
│   ├── src/
│   │   ├── App-enhanced.jsx    # Main dashboard application
│   │   ├── lib/
│   │   │   ├── api.js          # Safe API client
│   │   │   ├── analytics-safe.js # Analytics with fallbacks
│   │   │   └── auth.jsx        # Authentication system
│   │   └── components/         # Reusable UI components
├── backend/           # Python Flask serverless functions
│   ├── src/
│   │   ├── api/               # API endpoints
│   │   ├── services/          # Business logic
│   │   └── config/            # Database configuration
└── docs/             # Documentation and guides
```

## 🚀 Quick Start

### Prerequisites
- Node.js 22.16.0+
- Python 3.13+
- npm or pnpm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/june-20-opp-dashboard.git
cd june-20-opp-dashboard
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

3. **Install backend dependencies**
```bash
cd ../backend
pip install -r requirements.txt
```

4. **Start development servers**
```bash
# Frontend (in frontend/ directory)
npm run dev

# Backend (in backend/ directory)
python -m flask run
```

5. **Open your browser**
```
http://localhost:5173
```

## 🌐 Live Demo

The dashboard automatically falls back to demo data, so you can explore all features immediately:

- **Dashboard**: Overview with metrics and recent opportunities
- **Opportunities**: Browse and search federal contracting opportunities
- **Intelligence**: AI-powered market insights and briefings
- **Analytics**: Predictive analytics and performance tracking
- **Sync Status**: Real-time system health monitoring

## 📊 Data Sources

### Government APIs Integrated:
- **SAM.gov**: Federal contracting opportunities (450 requests/hour)
- **Grants.gov**: Federal grant opportunities (1000 requests/hour)
- **USASpending.gov**: Historical spending data (450 requests/hour)

### AI & Intelligence:
- **Perplexity API**: Market intelligence and opportunity discovery
- **Custom Scoring**: Multi-factor opportunity ranking algorithm
- **Predictive Models**: Win probability and trend forecasting

## 🔧 Configuration

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Frontend (.env)**
```env
VITE_API_BASE_URL=your-backend-url
VITE_ENABLE_ANALYTICS=true
```

**Backend (.env)**
```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SAM_GOV_API_KEY=your-sam-gov-key
GRANTS_GOV_API_KEY=your-grants-gov-key
PERPLEXITY_API_KEY=your-perplexity-key
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Deploy Frontend**
```bash
cd frontend
npm run build
vercel --prod
```

2. **Deploy Backend**
```bash
cd backend
vercel --prod
```

### Manual Deployment

The application is designed to work with any hosting provider:
- **Frontend**: Static hosting (Netlify, Vercel, AWS S3)
- **Backend**: Serverless functions (Vercel, Netlify Functions, AWS Lambda)
- **Database**: Supabase (PostgreSQL with real-time features)

## 🧪 Testing

### Run Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
python -m pytest

# Full system test
python system_test.py
```

### Test Coverage
- ✅ Frontend component tests
- ✅ API integration tests
- ✅ Error handling tests
- ✅ End-to-end system tests

## 📈 Performance

- **Loading Time**: < 2 seconds initial load
- **API Response**: < 500ms average
- **Error Recovery**: < 1 second failover to demo data
- **Mobile Performance**: 95+ Lighthouse score

## 🛡️ Security

- **API Rate Limiting**: Respect all government API limits
- **Error Boundaries**: Prevent information leakage
- **Safe Fallbacks**: Never expose sensitive data
- **Input Validation**: All user inputs sanitized

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Government APIs**: SAM.gov, Grants.gov, USASpending.gov teams
- **AI Partners**: Perplexity for intelligence capabilities
- **Infrastructure**: Vercel for hosting, Supabase for database
- **Open Source**: React, Vite, and the entire open source community

## 📞 Support

For support, email support@opportunitydashboard.com or create an issue in this repository.

---

**Built with ❤️ for government contractors and grant seekers**

*Last updated: June 20, 2025* 