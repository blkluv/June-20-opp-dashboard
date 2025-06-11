from datetime import datetime, date
from typing import List, Dict, Any, Optional
from fuzzywuzzy import fuzz
import re
import json


class ScoringService:
    """Service for calculating opportunity scores"""
    
    # Component weights
    RELEVANCE_WEIGHT = 0.40
    URGENCY_WEIGHT = 0.25
    VALUE_WEIGHT = 0.20
    COMPETITION_WEIGHT = 0.15
    
    # Default keywords for different categories
    DEFAULT_KEYWORDS = {
        'technology': {
            'keywords': ['software', 'development', 'web', 'mobile', 'app', 'api', 'cloud', 'cybersecurity', 
                        'data', 'analytics', 'machine learning', 'ai', 'artificial intelligence', 'database',
                        'network', 'server', 'hardware', 'telecommunications', 'it support'],
            'weight': 1.2
        },
        'business_services': {
            'keywords': ['consulting', 'management', 'strategic planning', 'business analysis',
                        'marketing', 'digital marketing', 'social media', 'branding', 'public relations',
                        'project management', 'process improvement', 'training', 'hr services'],
            'weight': 1.0
        },
        'professional_services': {
            'keywords': ['legal', 'accounting', 'financial', 'audit', 'compliance', 'regulatory',
                        'insurance', 'real estate', 'architecture', 'engineering', 'design'],
            'weight': 1.1
        },
        'healthcare': {
            'keywords': ['medical', 'healthcare', 'clinical', 'hospital', 'pharmacy', 'medicaid',
                        'medicare', 'health services', 'wellness', 'fitness'],
            'weight': 1.3
        },
        'education': {
            'keywords': ['education', 'training', 'curriculum', 'learning', 'academic', 'school',
                        'university', 'research', 'educational technology'],
            'weight': 1.1
        }
    }
    
    def __init__(self, user_keywords: Optional[List[str]] = None, user_preferences: Optional[Dict] = None):
        self.user_keywords = user_keywords or []
        self.user_preferences = user_preferences or {}
        self.all_keywords = self._build_keyword_list()
    
    def _build_keyword_list(self) -> List[Dict[str, Any]]:
        """Build comprehensive keyword list with weights"""
        keywords = []
        
        # Add user-defined keywords with high weight
        for keyword in self.user_keywords:
            keywords.append({
                'keyword': keyword.lower(),
                'weight': 2.0,
                'category': 'user_defined'
            })
        
        # Add default keywords by category
        for category, data in self.DEFAULT_KEYWORDS.items():
            for keyword in data['keywords']:
                keywords.append({
                    'keyword': keyword.lower(),
                    'weight': data['weight'],
                    'category': category
                })
        
        return keywords
    
    def calculate_relevance_score(self, opportunity: Dict[str, Any]) -> float:
        """Calculate relevance based on keyword matching"""
        if not self.all_keywords:
            return 30  # Default score if no keywords defined
        
        title = (opportunity.get('title') or '').lower()
        description = (opportunity.get('description') or '').lower()
        
        title_score = 0
        description_score = 0
        category_bonus = 0
        
        # Title matching (higher weight)
        for keyword_data in self.all_keywords:
            keyword = keyword_data['keyword']
            weight = keyword_data['weight']
            
            # Exact match
            if keyword in title:
                title_score += 15 * weight
            # Fuzzy match
            elif fuzz.partial_ratio(keyword, title) > 80:
                title_score += 10 * weight
        
        # Description matching
        for keyword_data in self.all_keywords:
            keyword = keyword_data['keyword']
            weight = keyword_data['weight']
            
            # Exact match
            if keyword in description:
                description_score += 5 * weight
            # Fuzzy match
            elif fuzz.partial_ratio(keyword, description) > 85:
                description_score += 3 * weight
        
        # Category bonus
        opportunity_category = (opportunity.get('category') or '').lower()
        if opportunity_category:
            for category in self.DEFAULT_KEYWORDS.keys():
                if category in opportunity_category or fuzz.ratio(category, opportunity_category) > 70:
                    category_bonus = 10
                    break
        
        # Cap individual components
        title_score = min(title_score, 60)
        description_score = min(description_score, 40)
        
        total = title_score + description_score + category_bonus
        return min(total, 100)
    
    def calculate_urgency_score(self, due_date: Optional[date]) -> float:
        """Calculate urgency based on days until due date"""
        if not due_date:
            return 0
        
        if isinstance(due_date, str):
            try:
                due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
            except ValueError:
                return 0
        
        today = date.today()
        days_remaining = (due_date - today).days
        
        if days_remaining < 0:
            return 0  # Expired
        elif days_remaining <= 7:
            return 100  # Very urgent
        elif days_remaining <= 14:
            return 80   # Urgent
        elif days_remaining <= 30:
            return 60   # Moderate urgency
        elif days_remaining <= 60:
            return 40   # Some urgency
        elif days_remaining <= 90:
            return 20   # Low urgency
        else:
            return 10   # Very low urgency
    
    def calculate_value_score(self, estimated_value: Optional[float], source_type: str) -> float:
        """Calculate value score based on opportunity size"""
        if not estimated_value:
            return 30  # Default score for unknown values
        
        # Define value thresholds by opportunity type
        thresholds = {
            'federal_contract': {
                'very_high': 10000000,  # $10M+
                'high': 1000000,        # $1M+
                'medium': 100000,       # $100K+
                'low': 25000,           # $25K+
            },
            'federal_grant': {
                'very_high': 5000000,   # $5M+
                'high': 500000,         # $500K+
                'medium': 100000,       # $100K+
                'low': 25000,           # $25K+
            },
            'state_rfp': {
                'very_high': 1000000,   # $1M+
                'high': 250000,         # $250K+
                'medium': 50000,        # $50K+
                'low': 10000,           # $10K+
            }
        }
        
        threshold = thresholds.get(source_type, thresholds['federal_contract'])
        
        if estimated_value >= threshold['very_high']:
            return 100
        elif estimated_value >= threshold['high']:
            return 80
        elif estimated_value >= threshold['medium']:
            return 60
        elif estimated_value >= threshold['low']:
            return 40
        else:
            return 20
    
    def calculate_competition_score(self, opportunity: Dict[str, Any]) -> float:
        """Estimate competition level (higher score = less competition)"""
        score = 50  # Base score
        
        # Set-aside programs reduce competition
        set_aside = (opportunity.get('set_aside_type') or '').lower()
        if set_aside:
            if 'small business' in set_aside:
                score += 20
            if 'veteran' in set_aside:
                score += 15
            if 'women' in set_aside:
                score += 15
            if 'minority' in set_aside:
                score += 15
        
        # Specialized requirements may reduce competition
        description = (opportunity.get('description') or '').lower()
        specialized_keywords = ['specialized', 'niche', 'unique', 'proprietary', 'custom', 'specific']
        if any(keyword in description for keyword in specialized_keywords):
            score += 10
        
        # Geographic restrictions may reduce competition
        state = opportunity.get('place_of_performance_state')
        if state and state.lower() not in ['multiple', 'various', 'nationwide']:
            score += 10
        
        # Very high value opportunities typically have more competition
        estimated_value = opportunity.get('estimated_value')
        if estimated_value and estimated_value > 10000000:
            score -= 20
        elif estimated_value and estimated_value > 1000000:
            score -= 10
        
        # Short deadlines may reduce competition
        due_date = opportunity.get('due_date')
        if due_date:
            if isinstance(due_date, str):
                try:
                    due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
                except ValueError:
                    due_date = None
            
            if due_date:
                days_remaining = (due_date - date.today()).days
                if days_remaining <= 14:
                    score += 15
                elif days_remaining <= 7:
                    score += 25
        
        # Federal opportunities are typically more competitive
        if opportunity.get('source_type', '').startswith('federal'):
            score -= 5
        
        return max(0, min(score, 100))
    
    def calculate_total_score(self, opportunity: Dict[str, Any]) -> Dict[str, float]:
        """Calculate the weighted total score for an opportunity"""
        # Calculate individual scores
        relevance = self.calculate_relevance_score(opportunity)
        urgency = self.calculate_urgency_score(opportunity.get('due_date'))
        value = self.calculate_value_score(
            opportunity.get('estimated_value'), 
            opportunity.get('source_type', '')
        )
        competition = self.calculate_competition_score(opportunity)
        
        # Calculate weighted total
        total = (
            relevance * self.RELEVANCE_WEIGHT +
            urgency * self.URGENCY_WEIGHT +
            value * self.VALUE_WEIGHT +
            competition * self.COMPETITION_WEIGHT
        )
        
        # Apply bonus factors
        total = self._apply_bonus_factors(opportunity, total)
        
        return {
            'relevance_score': round(relevance, 2),
            'urgency_score': round(urgency, 2),
            'value_score': round(value, 2),
            'competition_score': round(competition, 2),
            'total_score': round(total, 2)
        }
    
    def _apply_bonus_factors(self, opportunity: Dict[str, Any], base_score: float) -> float:
        """Apply bonus and penalty factors to the base score"""
        score = base_score
        
        # New opportunity bonus
        posted_date = opportunity.get('posted_date')
        if posted_date:
            if isinstance(posted_date, str):
                try:
                    posted_date = datetime.strptime(posted_date, '%Y-%m-%d').date()
                except ValueError:
                    posted_date = None
            
            if posted_date and (date.today() - posted_date).days <= 7:
                score += 5  # New opportunity bonus
        
        # Local preference bonus
        user_state = self.user_preferences.get('preferred_state')
        if user_state and opportunity.get('place_of_performance_state') == user_state:
            score += 5
        
        # Complexity penalty (based on description length and complexity indicators)
        description = opportunity.get('description') or ''
        if len(description) > 5000:  # Very long descriptions often indicate complexity
            score -= 5
        
        complexity_indicators = ['compliance', 'certification', 'clearance', 'bonding', 'insurance']
        if any(indicator in description.lower() for indicator in complexity_indicators):
            score -= 10
        
        return max(0, min(score, 100))
    
    def score_opportunities(self, opportunities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Score a list of opportunities"""
        scored_opportunities = []
        
        for opp in opportunities:
            scores = self.calculate_total_score(opp)
            
            # Add scores to opportunity
            opp_with_scores = opp.copy()
            opp_with_scores.update(scores)
            
            scored_opportunities.append(opp_with_scores)
        
        # Sort by total score (highest first)
        scored_opportunities.sort(key=lambda x: x['total_score'], reverse=True)
        
        return scored_opportunities
    
    def get_scoring_explanation(self, opportunity: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed explanation of how an opportunity was scored"""
        scores = self.calculate_total_score(opportunity)
        
        explanation = {
            'total_score': scores['total_score'],
            'components': {
                'relevance': {
                    'score': scores['relevance_score'],
                    'weight': self.RELEVANCE_WEIGHT,
                    'contribution': scores['relevance_score'] * self.RELEVANCE_WEIGHT,
                    'description': 'Based on keyword matching in title and description'
                },
                'urgency': {
                    'score': scores['urgency_score'],
                    'weight': self.URGENCY_WEIGHT,
                    'contribution': scores['urgency_score'] * self.URGENCY_WEIGHT,
                    'description': 'Based on time remaining until due date'
                },
                'value': {
                    'score': scores['value_score'],
                    'weight': self.VALUE_WEIGHT,
                    'contribution': scores['value_score'] * self.VALUE_WEIGHT,
                    'description': 'Based on estimated financial value'
                },
                'competition': {
                    'score': scores['competition_score'],
                    'weight': self.COMPETITION_WEIGHT,
                    'contribution': scores['competition_score'] * self.COMPETITION_WEIGHT,
                    'description': 'Estimated level of competition (higher = less competitive)'
                }
            }
        }
        
        return explanation

