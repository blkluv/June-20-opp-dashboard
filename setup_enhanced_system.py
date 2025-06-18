#!/usr/bin/env python3
"""
Enhanced Opportunity Dashboard Setup Script
Helps set up Supabase database, configure environment, and test the system
"""
import os
import sys
import json
import subprocess
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedSetup:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root / 'backend'
        self.env_file = self.project_root / '.env'
        self.env_example = self.project_root / '.env.enhanced.example'
    
    def run_setup(self):
        """Run the complete setup process"""
        print("🚀 Enhanced Opportunity Dashboard Setup")
        print("=" * 50)
        
        # Step 1: Check prerequisites
        if not self.check_prerequisites():
            return False
        
        # Step 2: Setup environment
        if not self.setup_environment():
            return False
        
        # Step 3: Test Supabase connection
        if not self.test_supabase_connection():
            return False
        
        # Step 4: Initialize database
        if not self.initialize_database():
            return False
        
        # Step 5: Test API endpoints
        if not self.test_api_endpoints():
            return False
        
        # Step 6: Setup background jobs
        self.setup_background_jobs()
        
        print("\n✅ Setup completed successfully!")
        print("\n📋 Next Steps:")
        print("1. Deploy to Vercel or your preferred platform")
        print("2. Update frontend API URL if needed")
        print("3. Test the sync functionality")
        print("4. Monitor background jobs")
        
        return True
    
    def check_prerequisites(self):
        """Check if all prerequisites are met"""
        print("\n📋 Checking prerequisites...")
        
        # Check Python version
        if sys.version_info < (3, 8):
            print("❌ Python 3.8 or higher is required")
            return False
        print("✅ Python version OK")
        
        # Check if pip is available
        try:
            subprocess.run(['pip', '--version'], capture_output=True, check=True)
            print("✅ pip is available")
        except:
            print("❌ pip is not available")
            return False
        
        # Check environment example file
        if not self.env_example.exists():
            print("❌ .env.enhanced.example file not found")
            return False
        print("✅ Environment example file found")
        
        return True
    
    def setup_environment(self):
        """Setup environment configuration"""
        print("\n🔧 Setting up environment...")
        
        # Copy env example if .env doesn't exist
        if not self.env_file.exists():
            print("📝 Creating .env file from example...")
            import shutil
            shutil.copy(self.env_example, self.env_file)
            print("⚠️  Please edit .env file with your actual values")
            print("   Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY")
            
            response = input("Have you updated the .env file? (y/n): ")
            if response.lower() != 'y':
                print("Please update .env file and run setup again")
                return False
        
        # Load environment variables
        try:
            from dotenv import load_dotenv
            load_dotenv(self.env_file)
            print("✅ Environment variables loaded")
        except ImportError:
            print("⚠️  python-dotenv not installed, installing...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'python-dotenv'])
            from dotenv import load_dotenv
            load_dotenv(self.env_file)
        
        return True
    
    def test_supabase_connection(self):
        """Test Supabase database connection"""
        print("\n🗄️  Testing Supabase connection...")
        
        # Install required packages
        self.install_requirements()
        
        try:
            # Add backend to path
            sys.path.insert(0, str(self.backend_dir))
            
            from src.config.supabase import get_supabase_client
            
            client = get_supabase_client()
            
            # Test connection by trying to fetch data sources
            result = client.table('data_sources').select('id').limit(1).execute()
            print("✅ Supabase connection successful")
            return True
            
        except Exception as e:
            print(f"❌ Supabase connection failed: {e}")
            print("Please check your SUPABASE_URL and SUPABASE_ANON_KEY in .env file")
            return False
    
    def initialize_database(self):
        """Initialize database with schema and sample data"""
        print("\n🏗️  Initializing database...")
        
        try:
            sys.path.insert(0, str(self.backend_dir))
            from src.config.supabase import get_supabase_client
            
            client = get_supabase_client()
            
            # Check if tables exist
            try:
                result = client.table('opportunities').select('id').limit(1).execute()
                print("✅ Database tables already exist")
            except:
                print("⚠️  Database tables not found")
                print("Please run the SQL schema from supabase_schema.sql in your Supabase dashboard")
                print("Go to: Supabase Dashboard > SQL Editor > New Query > Paste schema > Run")
                
                response = input("Have you created the database tables? (y/n): ")
                if response.lower() != 'y':
                    return False
            
            # Insert or update data sources
            sources = [
                {
                    'name': 'USASpending.gov',
                    'type': 'federal_contract',
                    'base_url': 'https://api.usaspending.gov/api/v2/',
                    'api_key_required': False,
                    'rate_limit_per_hour': 1000,
                    'is_active': True
                },
                {
                    'name': 'Grants.gov',
                    'type': 'federal_grant',
                    'base_url': 'https://api.grants.gov/v1/',
                    'api_key_required': False,
                    'rate_limit_per_hour': 1000,
                    'is_active': True
                },
                {
                    'name': 'SAM.gov',
                    'type': 'federal_contract',
                    'base_url': 'https://api.sam.gov/opportunities/v2/',
                    'api_key_required': True,
                    'rate_limit_per_hour': 450,
                    'is_active': True
                }
            ]
            
            for source in sources:
                try:
                    # Try to insert, ignore if already exists
                    client.table('data_sources').upsert(source, on_conflict='name').execute()
                except:
                    pass  # Source might already exist
            
            print("✅ Database initialized with data sources")
            return True
            
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            return False
    
    def test_api_endpoints(self):
        """Test API endpoints"""
        print("\n🔌 Testing API endpoints...")
        
        try:
            import requests
            
            # Test health endpoint
            try:
                response = requests.get('http://localhost:8000/api/health', timeout=5)
                if response.status_code == 200:
                    print("✅ Health endpoint working")
                else:
                    print("⚠️  API server not running locally")
            except:
                print("⚠️  API server not running locally (this is OK if deploying remotely)")
            
            # Test database service
            sys.path.insert(0, str(self.backend_dir))
            from src.services.database_service import get_database_service
            
            db_service = get_database_service()
            if db_service.test_connection():
                print("✅ Database service working")
            else:
                print("❌ Database service not working")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ API endpoint test failed: {e}")
            return False
    
    def setup_background_jobs(self):
        """Setup background job system"""
        print("\n⚙️  Setting up background jobs...")
        
        try:
            sys.path.insert(0, str(self.backend_dir))
            from src.services.background_jobs import get_job_manager
            
            job_manager = get_job_manager()
            
            # Test job manager
            status = job_manager.get_job_status()
            print(f"✅ Background job manager initialized")
            print(f"   - Running: {status['is_running']}")
            print(f"   - Config: {status['config']}")
            
            # Start background jobs if not running
            if not status['is_running']:
                job_manager.start()
                print("✅ Background jobs started")
            
        except Exception as e:
            print(f"⚠️  Background jobs setup issue: {e}")
            print("   This is OK - jobs will start automatically in production")
    
    def install_requirements(self):
        """Install required Python packages"""
        requirements_file = self.backend_dir / 'requirements_enhanced.txt'
        
        if requirements_file.exists():
            print("📦 Installing enhanced requirements...")
            subprocess.run([
                sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)
            ], capture_output=True)
        else:
            # Install basic requirements
            packages = ['supabase', 'python-dotenv', 'requests']
            for package in packages:
                subprocess.run([
                    sys.executable, '-m', 'pip', 'install', package
                ], capture_output=True)

def main():
    """Main setup function"""
    setup = EnhancedSetup()
    
    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print("Enhanced Opportunity Dashboard Setup Script")
        print("Usage: python setup_enhanced_system.py")
        print("\nThis script will:")
        print("1. Check prerequisites")
        print("2. Setup environment configuration")
        print("3. Test Supabase connection")
        print("4. Initialize database")
        print("5. Test API endpoints")
        print("6. Setup background jobs")
        return
    
    try:
        success = setup.run_setup()
        if success:
            print("\n🎉 Setup completed successfully!")
            sys.exit(0)
        else:
            print("\n❌ Setup failed. Please check the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️  Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Setup failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()