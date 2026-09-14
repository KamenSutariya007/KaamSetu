"""
Google Gemini Multimodal AI Diagnosis Service (Free Tier)
Connects to Google AI Studio Gemini Flash for structured issue diagnosis and DIY guides.
"""
import base64
import json
import logging
import re
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def _call_gemini_api(model, api_key, payload, timeout=14):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    return requests.post(url, json=payload, timeout=timeout)


def analyze_with_gemini(text='', image_file=None, category_hint='', language='en'):
    """
    Calls Google Gemini Flash API with text and optional image.
    Returns structured diagnosis dict with DIY steps or None if unconfigured/failed.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key:
        return None

    lang_code = language.lower() if language else 'en'
    target_lang = "Gujarati (ગુજરાતી)" if lang_code == 'gu' else ("Hindi (हिंदी)" if lang_code == 'hi' else "English")

    system_prompt = f"""
You are an expert AI home maintenance safety and diagnosis assistant for KaamSetu.
Your goal is to inspect home maintenance issues and provide safe, practical, step-by-step DIY guidance for minor problems, while safely identifying dangerous situations.

Language requested: {target_lang}.
ALL text fields ('possible_issue', 'safety_warning', 'instructions', 'required_tools', 'required_parts') MUST BE WRITTEN IN {target_lang}.

CRITICAL RULES:
1. MINOR / SMALL ISSUES (Safe DIY / DIY with Caution):
   - For common household issues like a leaking tap (નળ ટપકવો), clogged sink or drain (સિંક/ગટર જામ), running toilet/flush tank (ફ્લશ ટાંકી લીક), aerator clog/low pressure, loose or squeaky door hinge (ઢીલો દરવાજો/મિજાગરો), dirty AC air filter (AC ફિલ્ટર સફાઈ), ceiling fan blade dust/low speed, RO water purifier pre-filter, washing machine drain filter, etc.:
   - Set "decision": "Safe DIY" or "DIY with Caution".
   - Under "instructions", provide 4 to 6 VERY SPECIFIC, NUMBERED, PRACTICAL DIY STEPS that the user can follow right now at home using basic household tools to fix the problem immediately without calling a technician!
   - List required tools and parts clearly.

2. DANGEROUS / MAJOR ISSUES (Call Professional):
   - If the issue involves gas leakage, sparks/open live electric wires, fire/smoke, structural wall/ceiling collapse, or chemical fumes, mark "is_dangerous": true, "decision": "Call Professional", and "severity": "critical".
   - Warn the user NEVER to attempt DIY repair for high-risk hazards.

Return ONLY valid JSON matching this exact schema:
{{
  "category": "plumbing" | "electrical" | "ac" | "appliance" | "carpentry" | "cleaning",
  "possible_issue": "Short summary of the detected problem in the requested language",
  "confidence_score": 88,
  "severity": "low" | "medium" | "high" | "critical",
  "decision": "Safe DIY" | "DIY with Caution" | "Call Professional",
  "estimated_cost_min": 50,
  "estimated_cost_max": 300,
  "estimated_time": "15-30 minutes",
  "required_tools": ["tool 1", "tool 2"],
  "required_parts": ["part 1"],
  "safety_warning": "Safety advice or precautions in requested language",
  "instructions": [
    "Step 1: Description of first step...",
    "Step 2: Description of second step...",
    "Step 3: Description of third step..."
  ],
  "is_dangerous": false
}}
"""

    user_text = f"Category hint: {category_hint or 'None'}\nIssue description: {text or 'Please inspect the issue'}"
    parts = [{"text": system_prompt}, {"text": user_text}]

    # Handle image if attached
    if image_file:
        try:
            if hasattr(image_file, 'read'):
                image_bytes = image_file.read()
                image_file.seek(0)
            elif isinstance(image_file, bytes):
                image_bytes = image_file
            else:
                image_bytes = None

            if image_bytes:
                encoded = base64.b64encode(image_bytes).decode('utf-8')
                mime = getattr(image_file, 'content_type', 'image/jpeg')
                parts.append({
                    "inline_data": {
                        "mime_type": mime,
                        "data": encoded
                    }
                })
        except Exception as e:
            logger.warning(f"Failed to encode image for Gemini: {e}")

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
    }

    configured_model = getattr(settings, 'GEMINI_MODEL', 'gemini-1.5-flash')
    models_to_try = [configured_model]
    if configured_model != 'gemini-2.0-flash':
        models_to_try.append('gemini-2.0-flash')
    if configured_model != 'gemini-1.5-flash':
        models_to_try.append('gemini-1.5-flash')

    for model in models_to_try:
        try:
            response = _call_gemini_api(model, api_key, payload)
            if response.status_code == 200:
                result = response.json()
                candidates = result.get('candidates', [])
                if candidates:
                    candidate_parts = candidates[0].get('content', {}).get('parts', [])
                    if candidate_parts:
                        content_text = candidate_parts[0].get('text', '').strip()
                        # Clean JSON code block wrappers if present
                        content_text = re.sub(r'^```(?:json)?\s*', '', content_text)
                        content_text = re.sub(r'\s*```$', '', content_text)
                        data = json.loads(content_text)
                        data['is_demo_mode'] = False
                        data['ai_engine'] = f'Google Gemini ({model})'
                        return data
            logger.warning(f"Gemini model {model} returned status {response.status_code}")
        except Exception as exc:
            logger.warning(f"Gemini API exception with model {model}: {exc}")

    return None
