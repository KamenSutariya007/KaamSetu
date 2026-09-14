from django import template
from ..i18n import get_translation

register = template.Library()

CATEGORY_MAP = {
    'plumbing': {
        'en': 'Plumbing',
        'gu': 'પ્લમ્બિંગ',
        'hi': 'प्लंबिंग'
    },
    'electrical': {
        'en': 'Electrical',
        'gu': 'ઇલેક્ટ્રિકલ',
        'hi': 'इलेक्ट्रिकल'
    },
    'ac-refrigerator': {
        'en': 'AC & Appliance',
        'gu': 'એસી અને ઉપકરણ',
        'hi': 'एसी और उपकरण'
    },
    'appliance-repair': {
        'en': 'Appliance Repair',
        'gu': 'ઉપકરણ સમારકામ',
        'hi': 'उपकरण मरम्मत'
    },
    'carpentry': {
        'en': 'Carpentry',
        'gu': 'સુથારીકામ',
        'hi': 'बढ़ईगीरी'
    },
    'cleaning': {
        'en': 'Deep Cleaning',
        'gu': 'સફાઈ સેવા',
        'hi': 'सफाई सेवा'
    },
    'wall-ceiling': {
        'en': 'Wall & Ceiling',
        'gu': 'દીવાલ અને છત',
        'hi': 'दीवार और छत'
    },
    'door-lock': {
        'en': 'Door & Lock',
        'gu': 'દરવાજા અને તાળું',
        'hi': 'दरवाजा और ताला'
    },
    'ro-water': {
        'en': 'RO & Water Purifier',
        'gu': 'આરઓ અને વોટર પ્યુરીફાયર',
        'hi': 'आरओ और वाटर प्यूरीफायर'
    },
    'computer-mobile': {
        'en': 'Computer & Mobile',
        'gu': 'કમ્પ્યુટર અને મોબાઈલ',
        'hi': 'कंप्यूटर और मोबाइल'
    }
}

STATUS_MAP = {
    'requested': {
        'en': 'Requested',
        'gu': 'વિનંતી કરેલ',
        'hi': 'अनुरोधित'
    },
    'accepted': {
        'en': 'Accepted',
        'gu': 'સ્વીકારેલ',
        'hi': 'स्वीकृत'
    },
    'preparing': {
        'en': 'Preparing',
        'gu': 'તૈયારી ચાલુ',
        'hi': 'तैयारी जारी'
    },
    'on_the_way': {
        'en': 'En Route',
        'gu': 'રસ્તામાં છે',
        'hi': 'रास्ते में है'
    },
    'arrived': {
        'en': 'Arrived',
        'gu': 'પહોંચી ગયા',
        'hi': 'पहुँच गए'
    },
    'started': {
        'en': 'In Progress',
        'gu': 'કામ ચાલુ છે',
        'hi': 'कार्य प्रगति पर'
    },
    'completed': {
        'en': 'Completed',
        'gu': 'પૂર્ણ થયેલ',
        'hi': 'पूर्ण'
    },
    'cancelled': {
        'en': 'Cancelled',
        'gu': 'રદ કરેલ',
        'hi': 'रद्द'
    },
    'rejected': {
        'en': 'Declined',
        'gu': 'અસ્વીકાર કરેલ',
        'hi': 'अस्वीकृत'
    }
}


@register.filter
def trans_cat(cat, lang='en'):
    """Returns localized category name with zero cross-language mixing."""
    if not cat:
        return ''
    lang = lang if lang in ['en', 'gu', 'hi'] else 'en'
    slug = getattr(cat, 'slug', None) or str(cat).lower().strip()
    if slug in CATEGORY_MAP:
        return CATEGORY_MAP[slug].get(lang, CATEGORY_MAP[slug]['en'])
    # Fallback to model's name_gu if available and lang is gu
    if lang == 'gu' and hasattr(cat, 'name_gu') and cat.name_gu:
        return cat.name_gu
    return getattr(cat, 'name', str(cat))


@register.filter
def trans_status(status, lang='en'):
    """Returns localized status text for bookings and tickets."""
    if not status:
        return ''
    lang = lang if lang in ['en', 'gu', 'hi'] else 'en'
    st = str(status).lower().strip()
    if st in STATUS_MAP:
        return STATUS_MAP[st].get(lang, STATUS_MAP[st]['en'])
    return str(status).replace('_', ' ').capitalize()
