# Scoring Algorithm Design for Opportunity Dashboard

## Overview
The scoring system evaluates opportunities across multiple dimensions to help users prioritize which RFPs and grants to pursue. The total score is calculated from four main components:

1. **Relevance Score** (40% weight) - How well the opportunity matches user interests/keywords
2. **Urgency Score** (25% weight) - Time sensitivity based on due dates
3. **Value Score** (20% weight) - Financial attractiveness of the opportunity
4. **Competition Score** (15% weight) - Estimated level of competition

## Scoring Components

### 1. Relevance Score (0-100 points)
Measures how well an opportunity matches predefined keywords and categories.

```python
def calculate_relevance_score(opportunity, user_keywords):
    """
    Calculate relevance based on keyword matching in title and description
    """
    base_score = 0
    title_weight = 3.0
    description_weight = 1.0
    
    # Title matching (higher weight)
    title_matches = count_keyword_matches(opportunity.title, user_keywords)
    title_score = min(title_matches * 15, 60)  # Max 60 points from title
    
    # Description matching
    desc_matches = count_keyword_matches(opportunity.description, user_keywords)
    desc_score = min(desc_matches * 5, 40)  # Max 40 points from description
    
    # Category bonus
    category_bonus = 0
    if opportunity.category in user_preferred_categories:
        category_bonus = 10
    
    total = title_score + desc_score + category_bonus
    return min(total, 100)
```

### 2. Urgency Score (0-100 points)
Based on time remaining until the due date.

```python
def calculate_urgency_score(due_date):
    """
    Calculate urgency based on days until due date
    """
    if not due_date:
        return 0
    
    days_remaining = (due_date - datetime.now().date()).days
    
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
```

### 3. Value Score (0-100 points)
Based on the estimated financial value of the opportunity.

```python
def calculate_value_score(estimated_value, source_type):
    """
    Calculate value score based on opportunity size
    Different scales for different opportunity types
    """
    if not estimated_value:
        return 30  # Default score for unknown values
    
    # Define value thresholds by opportunity type
    thresholds = {
        'federal_contract': {
            'very_high': 10000000,  # $10M+
            'high': 1000000,        # $1M+
            'medium': 100000,       # $100K+
            'low': 25000,           # $25K+
            'very_low': 0
        },
        'federal_grant': {
            'very_high': 5000000,   # $5M+
            'high': 500000,         # $500K+
            'medium': 100000,       # $100K+
            'low': 25000,           # $25K+
            'very_low': 0
        },
        'state_rfp': {
            'very_high': 1000000,   # $1M+
            'high': 250000,         # $250K+
            'medium': 50000,        # $50K+
            'low': 10000,           # $10K+
            'very_low': 0
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
```

### 4. Competition Score (0-100 points)
Estimates competition level based on various factors.

```python
def calculate_competition_score(opportunity):
    """
    Estimate competition level (higher score = less competition)
    """
    score = 50  # Base score
    
    # Set-aside programs reduce competition
    if opportunity.set_aside_type:
        if 'small business' in opportunity.set_aside_type.lower():
            score += 20
        if 'veteran' in opportunity.set_aside_type.lower():
            score += 15
        if 'women' in opportunity.set_aside_type.lower():
            score += 15
    
    # Specialized requirements may reduce competition
    specialized_keywords = ['specialized', 'niche', 'unique', 'proprietary', 'custom']
    if any(keyword in opportunity.description.lower() for keyword in specialized_keywords):
        score += 10
    
    # Geographic restrictions may reduce competition
    if opportunity.place_of_performance_state and opportunity.place_of_performance_state != 'Multiple':
        score += 10
    
    # Very high value opportunities typically have more competition
    if opportunity.estimated_value and opportunity.estimated_value > 10000000:
        score -= 20
    
    # Short deadlines may reduce competition
    if opportunity.due_date:
        days_remaining = (opportunity.due_date - datetime.now().date()).days
        if days_remaining <= 14:
            score += 15
    
    return max(0, min(score, 100))
```

## Total Score Calculation

```python
def calculate_total_score(opportunity, user_keywords, user_preferences):
    """
    Calculate the weighted total score for an opportunity
    """
    # Component weights
    RELEVANCE_WEIGHT = 0.40
    URGENCY_WEIGHT = 0.25
    VALUE_WEIGHT = 0.20
    COMPETITION_WEIGHT = 0.15
    
    # Calculate individual scores
    relevance = calculate_relevance_score(opportunity, user_keywords)
    urgency = calculate_urgency_score(opportunity.due_date)
    value = calculate_value_score(opportunity.estimated_value, opportunity.source_type)
    competition = calculate_competition_score(opportunity)
    
    # Calculate weighted total
    total = (
        relevance * RELEVANCE_WEIGHT +
        urgency * URGENCY_WEIGHT +
        value * VALUE_WEIGHT +
        competition * COMPETITION_WEIGHT
    )
    
    # Store individual scores for transparency
    opportunity.relevance_score = relevance
    opportunity.urgency_score = urgency
    opportunity.value_score = value
    opportunity.competition_score = competition
    opportunity.total_score = round(total, 2)
    
    return total
```

## Keyword Categories and Weights

### Technology Keywords (High Priority)
- Software Development: web development, mobile app, API, cloud computing, cybersecurity
- Data & Analytics: data analysis, machine learning, AI, business intelligence, database
- Infrastructure: network, server, hardware, telecommunications, IT support

### Business Services Keywords (Medium Priority)
- Consulting: management consulting, strategic planning, business analysis
- Marketing: digital marketing, social media, branding, public relations
- Operations: project management, process improvement, training, HR services

### Specialized Services Keywords (Variable Priority)
- Healthcare: medical services, healthcare IT, clinical research
- Education: training programs, curriculum development, educational technology
- Construction: architecture, engineering, construction management, facilities

## Scoring Adjustments

### Bonus Factors
- **New Opportunity Bonus**: +5 points for opportunities posted within last 7 days
- **Repeat Customer Bonus**: +10 points if user has won contracts with this agency before
- **Local Preference Bonus**: +5 points for opportunities in user's preferred geographic areas

### Penalty Factors
- **Complexity Penalty**: -10 points for opportunities requiring extensive compliance documentation
- **Multi-Award Penalty**: -5 points for multiple award contracts (more competition)
- **Federal Penalty**: -5 points for federal opportunities (typically more competitive)

## Implementation Notes

1. **Keyword Matching**: Use fuzzy matching and stemming to catch variations of keywords
2. **Machine Learning**: Consider implementing ML-based relevance scoring as data grows
3. **User Feedback**: Allow users to rate opportunities to improve scoring accuracy over time
4. **A/B Testing**: Test different weight combinations to optimize user satisfaction
5. **Personalization**: Allow users to customize weights based on their priorities

