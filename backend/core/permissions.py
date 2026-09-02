from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'CUSTOMER'


class IsProvider(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'INDIVIDUAL_PROVIDER'


class IsPartner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'THIRD_PARTY_PARTNER'


class IsSupportAgent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT', 'ADMIN'
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class IsProviderOrPartner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'INDIVIDUAL_PROVIDER', 'THIRD_PARTY_PARTNER'
        )
