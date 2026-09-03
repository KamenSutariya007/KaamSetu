from django.contrib import admin
from django.urls import path, include

from core.media_urls import media_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/services/', include('services.urls')),
    path('api/providers/', include('providers.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/ai/', include('ai_diagnosis.urls')),
    path('api/tracking/', include('tracking.urls')),
    path('api/support/', include('support.urls')),
    path('api/passport/', include('passport.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/calendar/', include('bookings.calendar_urls')),
    path('api/admin/', include('core.urls')),
] + media_urlpatterns()
