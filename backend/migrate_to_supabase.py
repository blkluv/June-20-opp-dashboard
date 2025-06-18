#!/usr/bin/env python3
"""
Migration script to move data from SQLite to Supabase PostgreSQL
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from src.models.opportunity import db, Opportunity, DataSource, SyncLog
from src.config.supabase import get_supabase_admin_client
from sqlalchemy import create_engine
from flask import Flask
import json
from datetime import datetime

def setup_flask_app():
    """Set up Flask app for database access"""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/opportunities.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

def migrate_data():
    """Migrate data from SQLite to Supabase"""
    print("🚀 Starting migration from SQLite to Supabase...")
    
    # Setup Flask app
    app = setup_flask_app()
    
    try:
        # Get Supabase client
        supabase = get_supabase_admin_client()
        print("✅ Connected to Supabase")
        
        with app.app_context():
            # Migrate Data Sources
            print("\n📊 Migrating data sources...")
            data_sources = DataSource.query.all()
            for ds in data_sources:
                supabase_data = {
                    'name': ds.name,
                    'type': ds.type,
                    'base_url': ds.base_url,
                    'api_key_required': ds.api_key_required,
                    'rate_limit_per_hour': ds.rate_limit_per_hour,
                    'last_sync_at': ds.last_sync_at.isoformat() if ds.last_sync_at else None,
                    'is_active': ds.is_active
                }
                
                try:
                    result = supabase.table('data_sources').upsert(supabase_data).execute()
                    print(f"  ✅ Migrated data source: {ds.name}")
                except Exception as e:
                    print(f"  ❌ Failed to migrate data source {ds.name}: {e}")
            
            # Migrate Opportunities
            print("\n🎯 Migrating opportunities...")
            opportunities = Opportunity.query.all()
            migrated_count = 0
            
            for opp in opportunities:
                supabase_data = {
                    'external_id': opp.opportunity_number or f"local-{opp.id}",
                    'title': opp.title,
                    'description': opp.description,
                    'agency_name': opp.agency_name,
                    'opportunity_number': opp.opportunity_number,
                    'estimated_value': float(opp.estimated_value) if opp.estimated_value else None,
                    'posted_date': opp.posted_date.isoformat() if opp.posted_date else None,
                    'due_date': opp.due_date.isoformat() if opp.due_date else None,
                    'source_type': opp.source_type,
                    'source_name': opp.source_name,
                    'source_url': opp.source_url,
                    'location': opp.location,
                    'contact_info': opp.contact_info,
                    'keywords': opp.keywords,
                    'relevance_score': opp.relevance_score,
                    'urgency_score': opp.urgency_score,
                    'value_score': opp.value_score,
                    'competition_score': opp.competition_score,
                    'total_score': opp.total_score,
                    'data_source_id': opp.data_source_id,
                    'created_at': opp.created_at.isoformat() if opp.created_at else None,
                    'updated_at': opp.updated_at.isoformat() if opp.updated_at else None
                }
                
                try:
                    result = supabase.table('opportunities').upsert(supabase_data).execute()
                    migrated_count += 1
                    print(f"  ✅ Migrated opportunity: {opp.title[:50]}...")
                except Exception as e:
                    print(f"  ❌ Failed to migrate opportunity {opp.id}: {e}")
            
            # Migrate Sync Logs
            print("\n📝 Migrating sync logs...")
            sync_logs = SyncLog.query.all()
            for log in sync_logs:
                supabase_data = {
                    'source_name': log.source_name,
                    'sync_type': log.sync_type,
                    'records_processed': log.records_processed,
                    'records_added': log.records_added,
                    'records_updated': log.records_updated,
                    'error_message': log.error_message,
                    'started_at': log.started_at.isoformat() if log.started_at else None,
                    'completed_at': log.completed_at.isoformat() if log.completed_at else None
                }
                
                try:
                    result = supabase.table('sync_logs').upsert(supabase_data).execute()
                    print(f"  ✅ Migrated sync log: {log.source_name}")
                except Exception as e:
                    print(f"  ❌ Failed to migrate sync log {log.id}: {e}")
        
        print(f"\n🎉 Migration completed!")
        print(f"   📊 {len(data_sources)} data sources migrated")
        print(f"   🎯 {migrated_count} opportunities migrated")
        print(f"   📝 {len(sync_logs)} sync logs migrated")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    
    return True

def test_supabase_connection():
    """Test Supabase connection and show stats"""
    try:
        supabase = get_supabase_admin_client()
        
        # Test basic connection
        sources = supabase.table('data_sources').select('*').execute()
        opportunities = supabase.table('opportunities').select('id').execute()
        
        print("\n📊 Supabase Database Status:")
        print(f"   📈 Data Sources: {len(sources.data)}")
        print(f"   🎯 Opportunities: {len(opportunities.data)}")
        
        return True
    except Exception as e:
        print(f"❌ Supabase connection test failed: {e}")
        return False

if __name__ == "__main__":
    print("🗄️ OPPORTUNITY DASHBOARD - SUPABASE MIGRATION")
    print("=" * 50)
    
    # Check if Supabase credentials are set
    required_vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n💡 Please add these to your .env file:")
        print("   SUPABASE_URL=https://your-project.supabase.co")
        print("   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
        sys.exit(1)
    
    # Test connection first
    if not test_supabase_connection():
        print("❌ Cannot connect to Supabase. Please check your credentials.")
        sys.exit(1)
    
    # Ask for confirmation
    response = input("\n🤔 Ready to migrate data to Supabase? (y/N): ")
    if response.lower() != 'y':
        print("❌ Migration cancelled")
        sys.exit(0)
    
    # Run migration
    if migrate_data():
        print("\n✅ Migration successful! Your data is now in Supabase.")
        print("💡 Don't forget to update your .env file with:")
        print("   DATABASE_URL=postgresql://postgres:[password]@[host]/postgres")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
        sys.exit(1)