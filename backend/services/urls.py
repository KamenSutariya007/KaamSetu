from django.urls import path
from .views import (
    ServiceCategoryListView, RepairGuideListView,
    RepairGuideDetailView, PriceRangeListView, FairPriceCheckView,
)

urlpatterns = [
    path('categories/', ServiceCategoryListView.as_view()),
    path('guides/', RepairGuideListView.as_view()),
    path('guides/<slug:slug>/', RepairGuideDetailView.as_view()),
    path('price-ranges/', PriceRangeListView.as_view()),
    path('fair-price/check/', FairPriceCheckView.as_view()),
]
