"""Mock AI diagnosis service with safety rules."""
import json
import re
from decimal import Decimal
from django.conf import settings

DANGEROUS_KEYWORDS = [
    'gas leak', 'gas leakage', 'gas smell', 'lpg leak',
    'fire', 'smoke', 'burning smell', 'burn smell',
    'electrocution', 'high voltage', 'exposed wire', 'live wire',
    'electrical panel', 'main panel', 'spark', 'short circuit',
    'structural crack', 'wall collapse', 'ceiling collapse',
    'chemical leak', 'acid leak', 'major flood', 'major water damage',
    'lift stuck', 'elevator', 'boiler explosion',
    'ગેસ', 'આગ', 'ધુમાડો', 'વિદ્યુત', 'તાર', 'દીવાલ ત crack',
]

CATEGORY_RULES = {
    'plumbing': {
        'keywords': ['tap', 'leak', 'pipe', 'drain', 'flush', 'water', 'tapka', 'pani', 'nali'],
        'issue': 'Possible tap or pipe leak',
        'decision': 'DIY with Caution',
        'cost': (200, 800),
        'time': '30-60 minutes',
        'tools': ['Adjustable wrench', 'Teflon tape', 'Screwdriver'],
        'parts': ['Washer', 'O-ring'],
    },
    'electrical': {
        'keywords': ['switch', 'bulb', 'light', 'fan', 'socket', 'wire', 'vijli', 'pankho'],
        'issue': 'Possible electrical fixture issue',
        'decision': 'Call Professional',
        'cost': (300, 1500),
        'time': '1-2 hours',
        'tools': ['Insulated screwdriver', 'Voltage tester'],
        'parts': ['Switch', 'Bulb holder'],
    },
    'ac': {
        'keywords': ['ac', 'cooling', 'refrigerator', 'fridge', 'filter', 'thanda'],
        'issue': 'AC or refrigerator cooling/filter issue',
        'decision': 'DIY with Caution',
        'cost': (500, 2500),
        'time': '45-90 minutes',
        'tools': ['Screwdriver', 'Vacuum cleaner'],
        'parts': ['AC filter'],
    },
    'appliance': {
        'keywords': ['washing', 'machine', 'geyser', 'mixer', 'appliance'],
        'issue': 'Home appliance malfunction',
        'decision': 'Call Professional',
        'cost': (400, 3000),
        'time': '1-3 hours',
        'tools': ['Basic toolkit'],
        'parts': ['Varies by appliance'],
    },
    'carpentry': {
        'keywords': ['door', 'hinge', 'screw', 'chair', 'wood', 'darwaja', 'kursi'],
        'issue': 'Loose fitting or hinge issue',
        'decision': 'Safe DIY',
        'cost': (50, 300),
        'time': '15-30 minutes',
        'tools': ['Screwdriver', 'Drill'],
        'parts': ['Screws', 'Hinges'],
    },
    'cleaning': {
        'keywords': ['stain', 'clean', 'dirty', 'safai'],
        'issue': 'Surface cleaning or stain removal needed',
        'decision': 'Safe DIY',
        'cost': (50, 200),
        'time': '20-40 minutes',
        'tools': ['Cleaning cloth', 'Mild detergent'],
        'parts': [],
    },
    'ro': {
        'keywords': ['ro', 'purifier', 'water filter', 'tds'],
        'issue': 'RO water purifier filter or flow issue',
        'decision': 'DIY with Caution',
        'cost': (300, 1200),
        'time': '30-45 minutes',
        'tools': ['Wrench'],
        'parts': ['RO filter cartridge'],
    },
}


def _detect_danger(text):
    text_lower = text.lower()
    for kw in DANGEROUS_KEYWORDS:
        if kw in text_lower:
            return True
    return False


def _match_category(text):
    text_lower = text.lower()
    best = None
    best_score = 0
    for cat, rules in CATEGORY_RULES.items():
        score = sum(1 for kw in rules['keywords'] if kw in text_lower)
        if score > best_score:
            best_score = score
            best = cat
    return best or 'appliance'


def analyze_issue(text='', category_hint='', language='en'):
    """Return diagnosis dict. Uses mock AI when external AI unavailable."""
    combined = f'{text} {category_hint}'.strip()
    is_dangerous = _detect_danger(combined)
    is_demo = not settings.AI_ENABLED or not settings.OPENAI_API_KEY

    if is_dangerous:
        safety_msg = (
            'આ problem ઘરે જાતે solve કરવાનો પ્રયાસ ન કરો.'
            if language == 'gu' else
            'Do NOT attempt to fix this issue at home.'
        )
        return {
            'category': category_hint or 'safety',
            'possible_issue': 'Potentially life-threatening issue detected',
            'confidence_score': 95,
            'severity': 'critical',
            'decision': 'Call Professional',
            'estimated_cost_min': 500,
            'estimated_cost_max': 5000,
            'estimated_time': 'Immediate',
            'required_tools': [],
            'required_parts': [],
            'safety_warning': safety_msg,
            'instructions': [
                'Move away from the danger area immediately',
                'Turn off supply only if it is safe to do so',
                'Contact a qualified professional immediately',
                'Use emergency professional booking option',
            ],
            'recommended_provider_category': category_hint or 'emergency',
            'is_dangerous': True,
            'is_demo_mode': is_demo,
        }

    cat = _match_category(combined) if not category_hint else category_hint.lower().replace(' ', '_').replace('&', '')
    if cat not in CATEGORY_RULES:
        for key in CATEGORY_RULES:
            if key in cat or cat in key:
                cat = key
                break
        else:
            cat = 'appliance'

    rules = CATEGORY_RULES.get(cat, CATEGORY_RULES['appliance'])
    confidence = 75 if combined else 45

    if not combined:
        return {
            'category': cat,
            'possible_issue': 'Insufficient information for diagnosis',
            'confidence_score': confidence,
            'severity': 'low',
            'decision': 'Need More Information',
            'estimated_cost_min': rules['cost'][0],
            'estimated_cost_max': rules['cost'][1],
            'estimated_time': rules['time'],
            'required_tools': rules['tools'],
            'required_parts': rules['parts'],
            'safety_warning': '',
            'instructions': [
                'Upload a close-up photo of the problem',
                'Upload a wider photo showing surrounding area',
                'Describe when the problem started',
                'Mention any sound, smell, or symptoms',
            ],
            'recommended_provider_category': cat,
            'is_dangerous': False,
            'is_demo_mode': is_demo,
        }

    instructions_map = {
        'Safe DIY': [
            'Gather required tools and materials',
            'Turn off relevant supply if applicable',
            'Follow step-by-step guide carefully',
            'Test after completion',
        ],
        'DIY with Caution': [
            'Read safety warnings before starting',
            'Ensure power/water supply is off',
            'Work slowly and carefully',
            'Stop if unsure and call a professional',
        ],
        'Call Professional': [
            'Do not attempt repair without proper skills',
            'Book a verified professional through KaamSetu',
            'Keep the area safe until help arrives',
        ],
    }

    return {
        'category': cat.replace('_', ' ').title(),
        'possible_issue': rules['issue'],
        'confidence_score': min(confidence + len(combined) // 10, 92),
        'severity': 'medium' if rules['decision'] == 'Call Professional' else 'low',
        'decision': rules['decision'],
        'estimated_cost_min': rules['cost'][0],
        'estimated_cost_max': rules['cost'][1],
        'estimated_time': rules['time'],
        'required_tools': rules['tools'],
        'required_parts': rules['parts'],
        'safety_warning': 'Always turn off power/water before attempting any repair.' if rules['decision'] != 'Safe DIY' else '',
        'instructions': instructions_map.get(rules['decision'], instructions_map['Call Professional']),
        'recommended_provider_category': cat,
        'is_dangerous': False,
        'is_demo_mode': is_demo,
    }
