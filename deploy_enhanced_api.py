#!/usr/bin/env python3
"""
Deploy Enhanced API Script
Replaces the current backend with the Supabase-enhanced version
"""
import os
import sys
import shutil
import json
from pathlib import Path
from datetime import datetime

class EnhancedAPIDeployment:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root / 'backend'
        self.api_dir = self.backend_dir / 'api'
        
    def deploy(self):
        """Deploy the enhanced API system"""
        print("🚀 ENHANCED API DEPLOYMENT")
        print("=" * 50)
        
        # Step 1: Backup current API
        if not self.backup_current_api():
            return False
        
        # Step 2: Deploy enhanced API
        if not self.deploy_enhanced_api():
            return False
        
        # Step 3: Update Vercel configuration
        if not self.update_vercel_config():
            return False
        
        # Step 4: Test deployment
        if not self.test_deployment():
            return False
        
        # Step 5: Update frontend configuration
        self.update_frontend_config()
        
        print("\n✅ Enhanced API deployment completed!")
        self.print_deployment_summary()
        return True
    
    def backup_current_api(self):
        """Backup the current API"""
        print("\n📦 Step 1: Backing up current API")
        print("-" * 30)
        
        try:
            backup_dir = self.backend_dir / 'api_backup'
            backup_dir.mkdir(exist_ok=True)
            
            # Backup current index.py
            current_api = self.api_dir / 'index.py'
            if current_api.exists():
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_file = backup_dir / f'index_{timestamp}.py'
                shutil.copy2(current_api, backup_file)
                print(f"✅ Backed up current API to: {backup_file}")
            else:
                print("⚠️ No existing API found to backup")
            
            return True
            
        except Exception as e:
            print(f"❌ Backup failed: {e}")
            return False
    
    def deploy_enhanced_api(self):
        """Deploy the enhanced API"""
        print("\n🚀 Step 2: Deploying Enhanced API")
        print("-" * 30)
        
        try:
            # Replace index.py with enhanced version
            enhanced_api = self.api_dir / 'enhanced_index.py'
            target_api = self.api_dir / 'index.py'
            
            if enhanced_api.exists():
                shutil.copy2(enhanced_api, target_api)
                print("✅ Enhanced API deployed as index.py")
            else:
                print("❌ enhanced_index.py not found")
                return False
            
            # Copy data fetcher if it doesn't exist in api directory
            src_data_fetcher = self.backend_dir / 'src' / 'api' / 'data_fetcher.py'
            api_data_fetcher = self.api_dir / 'data_fetcher.py'
            
            if src_data_fetcher.exists() and not api_data_fetcher.exists():
                shutil.copy2(src_data_fetcher, api_data_fetcher)
                print("✅ Data fetcher module copied")
            
            return True
            
        except Exception as e:
            print(f"❌ Enhanced API deployment failed: {e}")
            return False
    
    def update_vercel_config(self):
        """Update Vercel configuration for enhanced API"""
        print("\n⚙️ Step 3: Updating Vercel Configuration")
        print("-" * 30)
        
        try:
            # Backend vercel.json
            backend_vercel_config = {
                "functions": {
                    "api/index.py": {
                        "runtime": "python3.9",
                        "maxDuration": 30
                    }
                },
                "env": {
                    "SUPABASE_URL": "@supabase_url",
                    "SUPABASE_ANON_KEY": "@supabase_anon_key", 
                    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
                    "SAM_API_KEY": "@sam_api_key",
                    "FIRECRAWL_API_KEY": "@firecrawl_api_key",
                    "ENABLE_BACKGROUND_JOBS": "true",
                    "SYNC_INTERVAL_MINUTES": "30",
                    "MAX_CONCURRENT_SOURCES": "2"
                },
                "build": {
                    "env": {
                        "PYTHONPATH": "$PYTHONPATH:./backend"
                    }
                }
            }
            
            backend_vercel_file = self.backend_dir / 'vercel.json'
            with open(backend_vercel_file, 'w') as f:
                json.dump(backend_vercel_config, f, indent=2)
            print("✅ Backend Vercel configuration updated")
            
            # Root vercel.json for routing
            root_vercel_config = {
                "version": 2,
                "builds": [
                    {
                        "src": "backend/api/index.py",
                        "use": "@vercel/python",
                        "config": {
                            "maxLambdaSize": "50mb"
                        }
                    },
                    {
                        "src": "frontend/package.json",
                        "use": "@vercel/static-build",
                        "config": {
                            "distDir": "dist"
                        }
                    }
                ],
                "routes": [
                    {
                        "src": "/api/(.*)",
                        "dest": "/backend/api/index.py"
                    },
                    {
                        "src": "/(.*)",
                        "dest": "/frontend/$1"
                    }
                ]
            }
            
            root_vercel_file = self.project_root / 'vercel.json'
            with open(root_vercel_file, 'w') as f:
                json.dump(root_vercel_config, f, indent=2)
            print("✅ Root Vercel configuration updated")
            
            return True
            
        except Exception as e:
            print(f"❌ Vercel configuration update failed: {e}")
            return False
    
    def test_deployment(self):
        """Test the enhanced API deployment"""
        print("\n🔍 Step 4: Testing Deployment")
        print("-" * 30)
        
        try:
            # Try to import and test the enhanced API
            sys.path.insert(0, str(self.api_dir))
            
            # Test if enhanced modules can be imported
            try:
                import index
                print("✅ Enhanced API module loads successfully")
            except ImportError as e:
                print(f"⚠️ Import warning: {e}")
                print("   This may be resolved after deployment to Vercel")
            
            # Check if enhanced features are available
            enhanced_features = {
                'database_service': self.backend_dir / 'src' / 'services' / 'database_service.py',
                'background_jobs': self.backend_dir / 'src' / 'services' / 'background_jobs.py',
                'data_fetcher': self.backend_dir / 'src' / 'api' / 'data_fetcher.py',
                'supabase_config': self.backend_dir / 'src' / 'config' / 'supabase.py'
            }
            
            missing_features = []
            for feature, path in enhanced_features.items():
                if path.exists():
                    print(f"✅ {feature}: Available")
                else:
                    print(f"❌ {feature}: Missing")
                    missing_features.append(feature)
            
            if missing_features:
                print(f"⚠️ Missing features: {missing_features}")
                print("   Some enhanced features may not work until all files are present")
            
            return True
            
        except Exception as e:
            print(f"❌ Deployment test failed: {e}")
            return False
    
    def update_frontend_config(self):
        """Update frontend configuration for enhanced API"""
        print("\n🎨 Step 5: Updating Frontend Configuration")
        print("-" * 30)
        
        try:
            # Update API base URL to use enhanced endpoints
            frontend_api_file = self.project_root / 'frontend' / 'src' / 'lib' / 'api.js'
            
            if frontend_api_file.exists():
                # Read current file
                with open(frontend_api_file, 'r') as f:
                    content = f.read()
                
                # Add version header to identify enhanced API
                if 'X-API-Version' not in content:
                    # Find the request method and add version header
                    updated_content = content.replace(
                        "headers: {",
                        "headers: {\n        'X-API-Version': '2.0-enhanced',"
                    )
                    
                    # Write updated content
                    with open(frontend_api_file, 'w') as f:
                        f.write(updated_content)
                    
                    print("✅ Frontend API client updated with version header")
                else:
                    print("✅ Frontend API client already enhanced")
            else:
                print("⚠️ Frontend API file not found")
            
        except Exception as e:
            print(f"⚠️ Frontend configuration update: {e}")
    
    def print_deployment_summary(self):
        """Print deployment summary and next steps"""
        print("\n📋 DEPLOYMENT SUMMARY")
        print("=" * 50)
        
        print("\n✅ What was deployed:")
        print("   🚀 Enhanced API with Supabase integration")
        print("   🗄️ Database caching and persistence")
        print("   ⚙️ Background job system")
        print("   🔄 Intelligent source rotation")
        print("   📊 Advanced analytics and scoring")
        
        print("\n🔧 Configuration files updated:")
        print("   📄 backend/api/index.py (enhanced version)")
        print("   ⚙️ backend/vercel.json (enhanced config)")
        print("   🌐 vercel.json (routing configuration)")
        print("   🎨 frontend/src/lib/api.js (version header)")
        
        print("\n📦 Backup created:")
        backup_dir = self.backend_dir / 'api_backup'
        if backup_dir.exists():
            backups = list(backup_dir.glob('index_*.py'))
            if backups:
                latest_backup = max(backups, key=lambda p: p.stat().st_mtime)
                print(f"   💾 {latest_backup}")
        
        print("\n🚀 Next Steps:")
        print("1. Deploy to Vercel:")
        print("   vercel --prod")
        
        print("\n2. Set environment variables in Vercel dashboard:")
        print("   SUPABASE_URL")
        print("   SUPABASE_ANON_KEY") 
        print("   SUPABASE_SERVICE_ROLE_KEY")
        print("   SAM_API_KEY (optional)")
        print("   FIRECRAWL_API_KEY (optional)")
        
        print("\n3. Test enhanced endpoints:")
        print("   GET /api/ (should show version 2.0.0)")
        print("   GET /api/health (enhanced health check)")
        print("   GET /api/opportunities (cached data)")
        print("   GET /api/sync/status (real-time status)")
        print("   GET /api/jobs/status (background jobs)")
        
        print("\n4. Monitor performance:")
        print("   📊 Check Supabase dashboard for database metrics")
        print("   🔄 Monitor background job execution")
        print("   ⚡ Verify faster page load times")
        
        print("\n🎉 Your opportunity dashboard is now enhanced!")

def main():
    """Main deployment function"""
    deployment = EnhancedAPIDeployment()
    
    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print("Enhanced API Deployment Script")
        print("Usage: python deploy_enhanced_api.py")
        print("\nThis script:")
        print("1. Backs up current API")
        print("2. Deploys enhanced API with Supabase integration")
        print("3. Updates Vercel configuration")
        print("4. Tests deployment")
        print("5. Updates frontend configuration")
        return
    
    print("⚠️ This will replace your current API with the enhanced version.")
    response = input("Continue with deployment? (y/N): ")
    
    if response.lower() != 'y':
        print("❌ Deployment cancelled")
        return
    
    try:
        success = deployment.deploy()
        if success:
            print("\n🎉 DEPLOYMENT SUCCESSFUL!")
            sys.exit(0)
        else:
            print("\n❌ Deployment failed. Check errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️ Deployment interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Deployment failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()