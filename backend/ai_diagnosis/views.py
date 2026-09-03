from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from .models import AIDiagnosis
from .serializers import AIDiagnosisSerializer
from .services import analyze_issue
from providers.recommendations import get_recommendations


class DiagnosisListView(generics.ListAPIView):
    serializer_class = AIDiagnosisSerializer

    def get_queryset(self):
        return AIDiagnosis.objects.filter(user=self.request.user)


class DiagnosisDetailView(generics.RetrieveAPIView):
    serializer_class = AIDiagnosisSerializer

    def get_queryset(self):
        return AIDiagnosis.objects.filter(user=self.request.user)


class AnalyzeIssueView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        text = request.data.get('text', '')
        category_hint = request.data.get('category', '')
        language = request.data.get('language', 'en')

        image_file = request.FILES.get('image')
        result = analyze_issue(
            text=text,
            category_hint=category_hint,
            language=language,
            image_file=image_file
        )

        diagnosis = AIDiagnosis.objects.create(
            user=request.user if request.user.is_authenticated else None,
            category=result['category'],
            possible_issue=result['possible_issue'],
            confidence_score=result['confidence_score'],
            severity=result['severity'],
            decision=result['decision'],
            estimated_cost_min=result['estimated_cost_min'],
            estimated_cost_max=result['estimated_cost_max'],
            estimated_time=result['estimated_time'],
            required_tools=result['required_tools'],
            required_parts=result['required_parts'],
            safety_warning=result['safety_warning'],
            instructions=result['instructions'],
            recommended_provider_category=result['recommended_provider_category'],
            input_text=text,
            input_language=language,
            image=request.FILES.get('image'),
            video=request.FILES.get('video'),
            audio=request.FILES.get('audio'),
            is_dangerous=result.get('is_dangerous', False),
            is_demo_mode=result.get('is_demo_mode', True),
            raw_response=result,
        )

        if not request.user.is_authenticated:
            return Response({**result, 'id': diagnosis.id, 'demo_mode_label': 'Demo AI Mode'})

        recs = get_recommendations(
            result['recommended_provider_category'],
            float(request.data.get('lat', 0)) or None,
            float(request.data.get('lon', 0)) or None,
        )
        return Response({
            **AIDiagnosisSerializer(diagnosis).data,
            'recommendations': recs.get('sections', {}),
            'demo_mode_label': 'Demo AI Mode' if diagnosis.is_demo_mode else None,
        }, status=status.HTTP_201_CREATED)


class SaveToPassportView(APIView):
    def post(self, request, pk):
        diagnosis = get_object_or_404(AIDiagnosis, pk=pk, user=request.user)
        diagnosis.saved_to_passport = True
        diagnosis.save()
        return Response({'detail': 'Saved to Home Passport.'})


class ReportIncorrectView(APIView):
    def post(self, request, pk):
        diagnosis = get_object_or_404(AIDiagnosis, pk=pk, user=request.user)
        return Response({'detail': 'Report submitted. Our team will review.'})
