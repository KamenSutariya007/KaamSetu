import json
from pathlib import Path

_TRANSLATIONS_FILE = Path(__file__).resolve().parent / 'translations.json'

try:
    with open(_TRANSLATIONS_FILE, 'r', encoding='utf-8') as f:
        TRANSLATIONS = json.load(f)
except Exception:
    TRANSLATIONS = {'en': {}, 'gu': {}, 'hi': {}}

SUPPORTED_LANGUAGES = ['en', 'gu', 'hi']


def get_translation(lang: str, key: str, default: str = '') -> str:
    lang = lang if lang in SUPPORTED_LANGUAGES else 'en'
    parts = key.split('.')
    cur = TRANSLATIONS.get(lang, {})
    for p in parts:
        if isinstance(cur, dict) and p in cur:
            cur = cur[p]
        else:
            cur = None
            break
    if cur is not None and not isinstance(cur, (dict, list)):
        return str(cur)

    # Fallback to English
    if lang != 'en':
        cur_en = TRANSLATIONS.get('en', {})
        for p in parts:
            if isinstance(cur_en, dict) and p in cur_en:
                cur_en = cur_en[p]
            else:
                cur_en = None
                break
        if cur_en is not None and not isinstance(cur_en, (dict, list)):
            return str(cur_en)

    return default or key


def get_request_lang(request) -> str:
    if not request:
        return 'en'
    lang = request.GET.get('lang')
    if lang in SUPPORTED_LANGUAGES:
        return lang
    if hasattr(request, 'session'):
        s_lang = request.session.get('kaamsetu_lang') or request.session.get('language')
        if s_lang in SUPPORTED_LANGUAGES:
            return s_lang
    if getattr(request, 'user', None) and getattr(request.user, 'is_authenticated', False) and getattr(request.user, 'language', None) in SUPPORTED_LANGUAGES:
        return request.user.language
    return 'en'


def get_request_translation(request, key: str, default: str = '', **kwargs) -> str:
    lang = get_request_lang(request)
    raw = get_translation(lang, key, default)
    if kwargs and isinstance(raw, str):
        try:
            return raw.format(**kwargs)
        except Exception:
            return raw
    return raw


class TranslationDict:
    """Wrapper that enables template dot-notation or dictionary lookup like {{ t.appName }} or {{ t.login }}"""
    def __init__(self, lang: str):
        self.lang = lang if lang in SUPPORTED_LANGUAGES else 'en'
        self.data = TRANSLATIONS.get(self.lang, {})
        self.en_data = TRANSLATIONS.get('en', {})

    def __getitem__(self, item):
        val = self.data.get(item)
        if val is None:
            val = self.en_data.get(item, item)
        if isinstance(val, dict):
            return NestedTranslationDict(self.lang, item, val)
        return val

    def __getattr__(self, item):
        return self.__getitem__(item)


class NestedTranslationDict:
    def __init__(self, lang: str, prefix: str, data: dict):
        self.lang = lang
        self.prefix = prefix
        self.data = data
        self.en_data = TRANSLATIONS.get('en', {}).get(prefix, {})

    def __getitem__(self, item):
        val = self.data.get(item)
        if val is None and isinstance(self.en_data, dict):
            val = self.en_data.get(item, f'{self.prefix}.{item}')
        if isinstance(val, dict):
            return NestedTranslationDict(self.lang, f'{self.prefix}.{item}', val)
        return val if val is not None else f'{self.prefix}.{item}'

    def __getattr__(self, item):
        return self.__getitem__(item)
