from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from accounts.models import User
from services.models import ServiceCategory, RepairGuide, PriceRange
from providers.models import ServiceProvider, ThirdPartyPartner
from bookings.models import Booking, Review
from ai_diagnosis.models import AIDiagnosis
from support.models import SupportTicket
from passport.models import HouseholdAsset
from notifications.models import Notification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'language', 'is_verified']
    list_filter = ['role', 'language']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('KaamSetu', {'fields': ('role', 'phone', 'language', 'address', 'latitude', 'longitude', 'is_verified')}),
    )


admin.site.register(ServiceCategory)
admin.site.register(RepairGuide)
admin.site.register(PriceRange)
admin.site.register(ServiceProvider)
admin.site.register(ThirdPartyPartner)
admin.site.register(Booking)
admin.site.register(Review)
admin.site.register(AIDiagnosis)
admin.site.register(SupportTicket)
admin.site.register(HouseholdAsset)
admin.site.register(Notification)
