from django.urls import path
from rest_framework.permissions import AllowAny, IsAuthenticated
from .views import DiagnosisListView, DiagnosisDetailView, AnalyzeIssueView, SaveToPassportView, ReportIncorrectView

# Override permissions on analyze
AnalyzeIssueView.permission_classes = [AllowAny]
DiagnosisListView.permission_classes = [IsAuthenticated]
DiagnosisDetailView.permission_classes = [IsAuthenticated]
SaveToPassportView.permission_classes = [IsAuthenticated]
ReportIncorrectView.permission_classes = [IsAuthenticated]

urlpatterns = [
    path('', DiagnosisListView.as_view()),
    path('analyze/', AnalyzeIssueView.as_view(), name='analyze'),
    path('<int:pk>/', DiagnosisDetailView.as_view()),
    path('<int:pk>/save-passport/', SaveToPassportView.as_view()),
    path('<int:pk>/report/', ReportIncorrectView.as_view()),
]
