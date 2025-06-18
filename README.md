diff --git a/README.md b/README.md
index 7ba7f69d2477f9576b19bbb8ddb3801ae0425e56..91206b2c0b1574112550b6aba4269628bb581b04 100644
--- a/README.md
+++ b/README.md
@@ -43,78 +43,84 @@ A comprehensive web application for tracking and managing RFP (Request for Propo
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
+   # Populate the database with sample data
+   python create_sample_data.py
    python src/main.py
+   # In a new terminal, trigger live data sync
+   curl -X POST http://localhost:5000/api/sync
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
-SAM_GOV_API_KEY=your_sam_gov_api_key
+SAM_API_KEY=your_sam_gov_api_key
 FIRECRAWL_API_KEY=your_firecrawl_api_key
 ```
+Copy `backend/.env.example` to `backend/.env` and update the values with your API keys.
 
 #### Frontend (.env.local)
 ```bash
 VITE_API_BASE_URL=http://localhost:5000/api
 ```
+Copy `frontend/.env.local.example` to `frontend/.env.local` before starting the development server.
 
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
diff --git a/README.md b/README.md
index 7ba7f69d2477f9576b19bbb8ddb3801ae0425e56..91206b2c0b1574112550b6aba4269628bb581b04 100644
--- a/README.md
+++ b/README.md
@@ -136,51 +142,51 @@ opportunity-dashboard/
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
-- `POST /api/sync/run` - Trigger data sync
+- `POST /api/sync` - Trigger data sync
 
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
