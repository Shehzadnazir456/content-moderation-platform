import base64
import json

from django.conf import settings
from groq import Groq

from apps.policies.models import Policy

CATEGORY_LABELS = {
    'graphic_violence':       'Graphic Violence',
    'hate_symbols':           'Hate Symbols',
    'self_harm':              'Self-Harm',
    'extremist_propaganda':   'Extremist Propaganda',
    'weapons_contraband':     'Weapons & Contraband',
    'harassment_humiliation': 'Harassment & Humiliation',
}

VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'


def moderate_image(image_bytes, mime_type='image/jpeg'):
    active_policies = [p for p in Policy.objects.all() if p.enabled]
    
    policy_snapshot = [
        {
            'category':             p.category,
            'enabled':              p.enabled,
            'confidence_threshold': p.confidence_threshold,
            'enforcement':          p.enforcement,
        }
        for p in Policy.objects.all()
    ]

    if not active_policies:
        return ('approved', [], policy_snapshot)

    category_list = '\n'.join(
        f'- {CATEGORY_LABELS[p.category]} (key: {p.category})'
        for p in active_policies
    )

    prompt = (
        f'You are a professional content moderation AI. '
        f'Analyze the provided image against the following content policy categories.\n\n'
        f'Categories to evaluate:\n{category_list}\n\n'
        f'Return ONLY valid JSON — no markdown fences, no explanation, no text outside the JSON object:\n'
        f'{{"results": [{{"category": "string", "detected": true/false, "confidence": 0-100, "reasoning": "string"}}]}}\n\n'
        f'Rules:\n'
        f'- "detected" must be true or false\n'
        f'- "confidence" must be an integer from 0 to 100\n'
        f'- "reasoning" must be a concise one-sentence explanation of what you observed\n'
        f'- Include exactly one entry per category listed above, using the exact category keys provided\n'
        f'- Be conservative: only set detected=true when there is clear visual evidence in the image\n'
        f'- Return ONLY the JSON object, nothing else'
    )

    # Encode image as base64 data URI for Groq vision API
    image_b64 = base64.standard_b64encode(image_bytes).decode('utf-8')
    image_data_uri = f'data:{mime_type};base64,{image_b64}'

    client = Groq(api_key=settings.GROQ_API_KEY)

    response = client.chat.completions.create(
        model=VISION_MODEL,
        messages=[
            {
                'role': 'user',
                'content': [
                    {
                        'type': 'image_url',
                        'image_url': {
                            'url': image_data_uri,
                        },
                    },
                    {
                        'type': 'text',
                        'text': prompt,
                    },
                ],
            }
        ],
        temperature=0.1,
        max_tokens=1000,
    )

    raw_text = response.choices[0].message.content

  
    raw_text = raw_text.strip()
    if raw_text.startswith('```json'):
        raw_text = raw_text[7:]
    if raw_text.startswith('```'):
        raw_text = raw_text[3:]
    if raw_text.endswith('```'):
        raw_text = raw_text[:-3]
    raw_text = raw_text.strip()

    parsed = json.loads(raw_text)

    policy_map = {p.category: p for p in active_policies}

    outcome = 'approved'
    category_results = []

    for result in parsed.get('results', []):
        cat_key = result.get('category', '')
        detected = result.get('detected', False)
        confidence = float(result.get('confidence', 0))
        reasoning = result.get('reasoning', '')

        category_results.append({
            'category':   cat_key,
            'detected':   detected,
            'confidence': confidence,
            'reasoning':  reasoning,
        })

        if detected and cat_key in policy_map:
            policy = policy_map[cat_key]
            if confidence >= policy.confidence_threshold:
                if policy.enforcement == 'auto_block':
                    outcome = 'blocked'
                elif policy.enforcement == 'flag_review' and outcome != 'blocked':
                    outcome = 'flagged'

    return (outcome, category_results, policy_snapshot)
