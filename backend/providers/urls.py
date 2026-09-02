from django.urls import path
from .views import (
    ProviderListView, ProviderDetailView, PartnerListView, PartnerDetailView,
    ProviderProfileView, PartnerProfileView, ProviderDocumentView,
    ProviderAvailabilityView, ProviderBlockSlotView, RecommendationsView,
    PartnerTechnicianListCreateView, PartnerTechnicianDetailView,
    PartnerDashboardStatsView, PartnerWarrantyClaimView,
    PartnerQuotationView, PartnerSparePartView,
)

urlpatterns = [
    path('', ProviderListView.as_view()),
    path('recommendations/', RecommendationsView.as_view()),
    path('profile/', ProviderProfileView.as_view()),
    path('partners/', PartnerListView.as_view()),
    path('partners/profile/', PartnerProfileView.as_view()),
    path('partners/dashboard/', PartnerDashboardStatsView.as_view()),
    path('partners/technicians/', PartnerTechnicianListCreateView.as_view()),
    path('partners/technicians/<int:pk>/', PartnerTechnicianDetailView.as_view()),
    path('partners/warranty-claims/', PartnerWarrantyClaimView.as_view()),
    path('partners/quotations/', PartnerQuotationView.as_view()),
    path('partners/spare-parts/', PartnerSparePartView.as_view()),
    path('partners/<int:pk>/', PartnerDetailView.as_view()),
    path('<int:pk>/', ProviderDetailView.as_view()),
    path('<int:pk>/documents/', ProviderDocumentView.as_view()),
    path('<int:pk>/availability/', ProviderAvailabilityView.as_view()),
    path('<int:pk>/block-slot/', ProviderBlockSlotView.as_view()),
    path('<int:pk>/block-slot/<int:slot_id>/', ProviderBlockSlotView.as_view()),
]
