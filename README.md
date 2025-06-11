# Opportunity Dashboard - RFP & Grant Tracker

A comprehensive web application for tracking and managing RFP (Request for Proposal) and grant opportunities from federal, state, local, and private sources.

## 🚀 Features

- **Multi-Source Data Collection**: Integrates with SAM.gov, Grants.gov, USASpending.gov, and web scraping via Firecrawl
- **Intelligent Scoring System**: 4-component scoring algorithm (Relevance, Urgency, Value, Competition)
- **Interactive Dashboard**: Real-time charts, statistics, and opportunity tracking
- **Advanced Search & Filtering**: Multi-criteria search with customizable filters
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Sync Monitoring**: Track data collection status across all sources

## 📊 Data Sources

### Federal Sources
- **SAM.gov**: Federal contracts and RFPs
- **Grants.gov**: Federal grant opportunities
- **USASpending.gov**: Historical contract data and trends

### State & Local Sources
- **California**: Cal eProcure system
- **Texas**: SmartBuy procurement portal
- **New York**: State procurement opportunities
- **Custom Scraping**: Any government procurement website

### Private Sources
- **RFPMart**: Private sector RFP aggregator
- **Custom Sources**: Configurable web scraping for corporate RFPs

## 🏗️ Architecture

### Backend (Flask API)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite (development) / PostgreSQL (production)
- **APIs**: RESTful API with comprehensive endpoints
- **Scoring Engine**: Intelligent opportunity evaluation
- **Data Sync**: Automated data collection and processing

### Frontend (React)
- **Framework**: React with Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **Charts**: Recharts for data visualization
- **State Management**: React hooks and context
- **Responsive**: Mobile-first design approach

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/opportunity-dashboard.git
   cd opportunity-dashboard
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python src/main.py
   ```

3. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:5000

### Environment Variables

#### Backend (.env)
```bash
FLASK_ENV=development
SECRET_KEY=your-secret-key
SAM_GOV_API_KEY=your_sam_gov_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

#### Frontend (.env.local)
```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🌐 Deployment

### Vercel Deployment (Recommended)

Both frontend and backend are configured for Vercel deployment:

1. **Deploy Backend**:
   ```bash
   cd backend
   vercel
   ```

2. **Deploy Frontend**:
   ```bash
   cd frontend
   vercel
   ```

See `docs/vercel_deployment_guide.md` for detailed deployment instructions.

### Alternative Deployment Options
- **Netlify**: Frontend deployment
- **Railway**: Full-stack deployment
- **DigitalOcean**: VPS deployment
- **AWS**: Lambda + S3 deployment

## 📁 Project Structure

```
opportunity-dashboard/
├── backend/                 # Flask API backend
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── main.py         # Application entry point
│   ├── api/                # Vercel serverless functions
│   ├── vercel.json         # Vercel configuration
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/           # Utilities and API client
│   │   └── hooks/         # Custom React hooks
│   ├── public/            # Static assets
│   ├── vercel.json        # Vercel configuration
│   └── package.json       # Node.js dependencies
└── docs/                  # Documentation
    ├── api_research.md
    ├── database_design.md
    ├── scoring_algorithm.md
    └── deployment_guide.md
```

## 🔧 API Endpoints

### Opportunities
- `GET /api/opportunities` - List opportunities with filtering
- `GET /api/opportunities/{id}` - Get specific opportunity
- `GET /api/opportunities/stats` - Get statistics
- `POST /api/opportunities/search` - Advanced search

### Data Synchronization
- `GET /api/sync/status` - Get sync status
- `POST /api/sync/run` - Trigger data sync

### Web Scraping
- `GET /api/scraping/sources` - List scraping sources
- `POST /api/scraping/test` - Test scraping configuration

## 🎯 Scoring Algorithm

The intelligent scoring system evaluates opportunities based on:

1. **Relevance (40%)**: Keyword matching and category alignment
2. **Urgency (25%)**: Time until deadline and posting recency
3. **Value (20%)**: Estimated contract value and potential ROI
4. **Competition (15%)**: Set-aside requirements and market competition

## 🔒 Security Features

- **CORS Protection**: Configurable cross-origin resource sharing
- **Environment Variables**: Secure API key management
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API endpoint protection
- **Error Handling**: Secure error responses

## 📈 Performance

- **Backend**: Sub-second API response times
- **Frontend**: Optimized bundle size with code splitting
- **Database**: Indexed queries for fast data retrieval
- **Caching**: API response caching for improved performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See `/docs` directory for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions

## 🙏 Acknowledgments

- **Data Sources**: SAM.gov, Grants.gov, USASpending.gov
- **UI Components**: shadcn/ui, Tailwind CSS
- **Charts**: Recharts library
- **Deployment**: Vercel platform
- **Web Scraping**: Firecrawl service

---

**Built with ❤️ for the procurement and grant-seeking community**

