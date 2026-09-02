from django.urls import path
from .views import SupportTicketListCreateView, SupportTicketDetailView, SupportMessageView, SupportAIChatView, SupportFAQView

urlpatterns = [
    path('tickets/', SupportTicketListCreateView.as_view()),
    path('tickets/<int:pk>/', SupportTicketDetailView.as_view()),
    path('tickets/<int:pk>/messages/', SupportMessageView.as_view()),
    path('chat/', SupportAIChatView.as_view()),
    path('faq/', SupportFAQView.as_view()),
]
