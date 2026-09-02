from django.urls import path
from .views import StartTrackingView, UpdateLocationView, TrackingStatusView, StopTrackingView

urlpatterns = [
    path('<int:booking_id>/start/', StartTrackingView.as_view()),
    path('<int:booking_id>/update/', UpdateLocationView.as_view()),
    path('<int:booking_id>/status/', TrackingStatusView.as_view()),
    path('<int:booking_id>/stop/', StopTrackingView.as_view()),
]
