from django.urls import path
from .views import HouseholdAssetListCreateView, HouseholdAssetDetailView, MaintenanceRecordCreateView

urlpatterns = [
    path('assets/', HouseholdAssetListCreateView.as_view()),
    path('assets/<int:pk>/', HouseholdAssetDetailView.as_view()),
    path('assets/<int:asset_id>/records/', MaintenanceRecordCreateView.as_view()),
]
