"""
Google Gemini Multimodal AI Diagnosis Service (Free Tier)
Connects to Google AI Studio Gemini Flash for structured issue diagnosis.
"""
import base64
import json
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


def analyze_with_gemini(text='', image_file=None, category_hint='', language='en'):
    """
    Calls Google Gemini Flash API with text and optional image.
    Returns structured diagnosis dict or None if unconfigured/failed.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key:
        return None

    system_prompt = f"""
You are an expert AI home maintenance safety and diagnosis assistant for KaamSetu.
Your goal is to inspect home maintenance issues and provide safe, practical guidance.

Language requested: {"Gujarati" if language == "gu" else "English"}.
If Gujarati is requested, provide 'possible_issue', 'safety_warning', and 'instructions' in Gujarati.

CRITICAL SAFETY RULES:
- If the issue involves gas leakage, sparks/open live electric wires, fire/smoke, structural wall/ceiling collapse, or chemical fumes, mark "is_dangerous": true, "decision": "Call Professional", and "severity": "critical".
- For high-risk issues, warn the user NEVER to attempt DIY repair.

Return ONLY valid JSON matching this exact schema:
{{
  "category": "plumbing" | "electrical" | "ac" | "appliance" | "carpentry" | "cleaning",
  "possible_issue": "Short summary of the detected problem",
  "confidence_score": 85,
  "severity": "low" | "medium" | "high" | "critical",
  "decision": "Safe DIY" | "DIY with Caution" | "Call Professional",
  "estimated_cost_min": 200,
  "estimated_cost_max": 800,
  "estimated_time": "30-60 minutes",
  "required_tools": ["tool 1", "tool 2"],
  "required_parts": ["part 1"],
  "safety_warning": "Safety advice",
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "is_dangerous": false
}}
"""

    user_text = f"Category hint: {category_hint or 'None'}\nIssue description: {text or 'Please inspect image'}"
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

    try:
        url = f"{GEMINI_API_URL}?key={api_key}"
        response = requests.post(url, json=payload, timeout=12)
        if response.status_code != 200:
            logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
            return None

        result = response.json()
        candidates = result.get('candidates', [])
        if not candidates:
            return None

        candidate_parts = candidates[0].get('content', {}).get('parts', [])
        if not candidate_parts:
            return None

        content_text = candidate_parts[0].get('text', '').strip()
        data = json.loads(content_text)
        data['is_demo_mode'] = False
        data['ai_engine'] = 'Google Gemini 1.5 Flash'
        return data
    except Exception as exc:
        logger.warning(f"Gemini API call exception: {exc}")
        return None
