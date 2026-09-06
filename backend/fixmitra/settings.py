import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-dev-key-change-in-production')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'channels',
    'accounts',
    'services',
    'providers',
    'bookings',
    'ai_diagnosis',
    'tracking',
    'support',
    'passport',
    'notifications',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'fixmitra.urls'
WSGI_APPLICATION = 'fixmitra.wsgi.application'
ASGI_APPLICATION = 'fixmitra.asgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Database
_db_url = os.getenv('DATABASE_URL', '')
if _db_url:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(
            default=_db_url,
            conn_max_age=600,
            ssl_require=not DEBUG,
        )
    }
else:
    DB_ENGINE = os.getenv('DB_ENGINE', 'sqlite')
    if DB_ENGINE == 'postgresql':
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': os.getenv('DB_NAME', 'KaamSetu'),
                'USER': os.getenv('DB_USER', 'postgres'),
                'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
                'HOST': os.getenv('DB_HOST', 'localhost'),
                'PORT': os.getenv('DB_PORT', '5432'),
            }
        }
    elif DB_ENGINE == 'mysql':
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.mysql',
                'NAME': os.getenv('DB_NAME', 'KaamSetu'),
                'USER': os.getenv('DB_USER', 'root'),
                'PASSWORD': os.getenv('DB_PASSWORD', ''),
                'HOST': os.getenv('DB_HOST', 'localhost'),
                'PORT': os.getenv('DB_PORT', '3306'),
            }
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
# Serve uploaded files from disk when no external object store is configured.
SERVE_MEDIA_FROM_DISK = os.getenv('SERVE_MEDIA_FROM_DISK', 'True').lower() == 'true'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_RATES': {
        'send_otp': '5/hour',
        'verify_otp': '30/hour',
        'register': '20/hour',
        'google_auth': '30/hour',
        'email_ip': '20/hour',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 60))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': True,
}

CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173',
    ).split(',') if o.strip()
]
# LAN + public tunnel hosts (trycloudflare, ngrok, localtunnel)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^http://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$',
    r'^http://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$',
    r'^http://172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$',
    r'^https://[a-z0-9-]+\.trycloudflare\.com$',
    r'^https://[a-z0-9-]+\.loca\.lt$',
    r'^https://[a-z0-9-]+\.ngrok-free\.app$',
    r'^https://[a-z0-9-]+\.ngrok\.io$',
    r'^https://([a-z0-9-]+-)*[a-z0-9-]+\.vercel\.app$',
    r'^https://(www\.)?kaamsetu\.app$',
]
CORS_ALLOW_CREDENTIALS = True

# Channels
USE_REDIS = os.getenv('USE_REDIS', 'False').lower() == 'true'
if USE_REDIS:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {'hosts': [os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/0')]},
        },
    }
else:
    CHANNEL_LAYERS = {
        'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'},
    }

# App config
DEMO_MODE = os.getenv('DEMO_MODE', 'True').lower() == 'true'
DEMO_TRACKING = os.getenv('DEMO_TRACKING', 'True').lower() == 'true'
AI_ENABLED = os.getenv('AI_ENABLED', 'False').lower() == 'true'
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
AI_MODEL = os.getenv('AI_MODEL', 'gpt-4o-mini')
MAP_PROVIDER = os.getenv('MAP_PROVIDER', 'openstreetmap')
MAX_UPLOAD_SIZE_MB = int(os.getenv('MAX_UPLOAD_SIZE_MB', 25))
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

from core.network import get_lan_ip, get_public_frontend_url, resolve_lan_frontend_url  # noqa: E402

PUBLIC_FRONTEND_URL = get_public_frontend_url()
if PUBLIC_FRONTEND_URL not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(PUBLIC_FRONTEND_URL)

_lan_ip = get_lan_ip()
if DEBUG and _lan_ip:
    ALLOWED_HOSTS = list(dict.fromkeys([h.strip() for h in ALLOWED_HOSTS if h.strip()] + [_lan_ip]))
    _lan_frontend = resolve_lan_frontend_url(FRONTEND_URL)
    if _lan_frontend not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(_lan_frontend)

# Email — local dev / demo defaults to free console backend (OTP printed in terminal, no SMTP cost)
_email_host = os.getenv('EMAIL_HOST', '')
if (DEBUG or DEMO_MODE) and not _email_host:
    _default_email_backend = 'django.core.mail.backends.console.EmailBackend'
    _default_from_email = 'dev@fixmitra.local'
    _default_otp_cooldown = '0'
    _default_otp_max_resends = '0'
    _default_otp_max_attempts = '0'
else:
    _default_email_backend = 'django.core.mail.backends.smtp.EmailBackend'
    _default_from_email = _email_host or 'noreply@fixmitra.com'
    _default_otp_cooldown = '60'
    _default_otp_max_resends = '5'
    _default_otp_max_attempts = '5'

EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', _default_email_backend)
EMAIL_HOST = _email_host
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', '5'))
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or _default_from_email)
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')

# Email verification — set False to skip OTP during registration
EMAIL_VERIFICATION_REQUIRED = os.getenv('EMAIL_VERIFICATION_REQUIRED', 'False').lower() == 'true'
EMAIL_VERIFICATION_DEV_MODE = os.getenv('EMAIL_VERIFICATION_DEV_MODE', 'False').lower() == 'true'
OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', '10'))
OTP_MAX_ATTEMPTS = int(os.getenv('OTP_MAX_ATTEMPTS', _default_otp_max_attempts))
OTP_RESEND_COOLDOWN_SECONDS = int(os.getenv('OTP_RESEND_COOLDOWN_SECONDS', _default_otp_cooldown))
OTP_MAX_RESENDS = int(os.getenv('OTP_MAX_RESENDS', _default_otp_max_resends))
REGISTRATION_VERIFICATION_TOKEN_MINUTES = int(os.getenv('REGISTRATION_VERIFICATION_TOKEN_MINUTES', '30'))

# Google OAuth (client secret stays server-side; client ID also used by frontend GIS)
GOOGLE_OAUTH_CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID', '')

# Firebase Auth — path relative to project root (works on any PC / drive letter)
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', '')
_firebase_cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', '')
if _firebase_cred_path and not os.path.isabs(_firebase_cred_path):
    _firebase_cred_path = str(PROJECT_ROOT / _firebase_cred_path.replace('/', os.sep))
FIREBASE_CREDENTIALS_PATH = _firebase_cred_path
FIREBASE_CREDENTIALS_JSON = os.getenv('FIREBASE_CREDENTIALS_JSON', '')

FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    CSRF_TRUSTED_ORIGINS = [
        o.strip() for o in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()
    ]
