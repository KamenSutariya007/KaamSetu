from django.conf import settings
from .i18n import TranslationDict, SUPPORTED_LANGUAGES


def global_context(request):
    # Language preference: Check session, cookie, user profile, or default to en
    lang = request.session.get('kaamsetu_lang')
    if not lang and request.user.is_authenticated and hasattr(request.user, 'language'):
        lang = request.user.language
    if not lang:
        lang = request.COOKIES.get('kaamsetu_lang', 'en')
    if lang not in SUPPORTED_LANGUAGES:
        lang = 'en'

    unread_count = 0
    if request.user.is_authenticated:
        try:
            from notifications.models import Notification
            unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        except Exception:
            unread_count = 0

    return {
        't': TranslationDict(lang),
        'current_lang': lang,
        'SUPPORTED_LANGUAGES': SUPPORTED_LANGUAGES,
        'unread_notifications_count': unread_count,
        'DEMO_MODE': getattr(settings, 'DEMO_MODE', True),
        'DEMO_TRACKING': getattr(settings, 'DEMO_TRACKING', True),
        'AI_ENABLED': getattr(settings, 'AI_ENABLED', True),
    }
