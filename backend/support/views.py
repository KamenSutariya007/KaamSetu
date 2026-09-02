import uuid
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone

from core.permissions import IsSupportAgent
from .models import SupportTicket, SupportMessage
from .serializers import SupportTicketSerializer, SupportTicketCreateSerializer, SupportMessageSerializer

ESCALATION_KEYWORDS = ['refund', 'fraud', 'complaint', 'safety', 'danger', 'angry', 'frustrated', 'human', 'agent']
FRUSTRATED_KEYWORDS = ['angry', 'frustrated', 'useless', 'terrible', 'worst']


class SupportTicketListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        return SupportTicketCreateSerializer if self.request.method == 'POST' else SupportTicketSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT', 'ADMIN'):
            return SupportTicket.objects.all().prefetch_related('messages')
        return SupportTicket.objects.filter(customer=user).prefetch_related('messages')

    def perform_create(self, serializer):
        ticket_num = f'FM-{uuid.uuid4().hex[:8].upper()}'
        desc = serializer.validated_data.get('description', '').lower()
        category = serializer.validated_data.get('category', '')
        escalate = (
            any(kw in desc for kw in ESCALATION_KEYWORDS)
            or category in ('refund', 'safety', 'payment')
            or any(kw in desc for kw in FRUSTRATED_KEYWORDS)
        )
        ticket = serializer.save(
            customer=self.request.user,
            ticket_number=ticket_num,
            is_escalated=escalate,
            status='escalated' if escalate else 'open',
        )
        SupportMessage.objects.create(
            ticket=ticket, sender=self.request.user,
            message=serializer.validated_data['description'],
        )


class SupportTicketDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = SupportTicketSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ('SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT', 'ADMIN'):
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(customer=user)

    def patch(self, request, *args, **kwargs):
        if request.user.role not in ('SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT', 'ADMIN'):
            return Response({'detail': 'Not allowed.'}, status=403)
        ticket = self.get_object()
        for field in ('status', 'assigned_agent', 'priority', 'is_escalated'):
            if field in request.data:
                setattr(ticket, field, request.data[field])
        if request.data.get('status') == 'resolved':
            ticket.resolved_at = timezone.now()
        ticket.save()
        return Response(SupportTicketSerializer(ticket).data)


class SupportMessageView(generics.CreateAPIView):
    serializer_class = SupportMessageSerializer

    def create(self, request, *args, **kwargs):
        ticket = get_object_or_404(SupportTicket, pk=self.kwargs['pk'])
        user = request.user
        if ticket.customer != user and user.role not in ('SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT', 'ADMIN'):
            return Response({'detail': 'Not allowed.'}, status=403)
        is_internal = request.data.get('is_internal', False)
        if is_internal and user.role not in ('SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT', 'ADMIN'):
            is_internal = False
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(ticket=ticket, sender=user, is_internal=is_internal, is_ai=request.data.get('is_ai', False))
        if request.data.get('request_human'):
            ticket.is_escalated = True
            ticket.status = 'escalated'
            ticket.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SupportAIChatView(APIView):
    def post(self, request):
        message = request.data.get('message', '').lower()
        session_key = f'support_ai_fails_{request.user.id}'
        fail_count = getattr(request, '_ai_fails', 0)
        if not hasattr(request, 'session'):
            fail_count = 0
        escalate = (
            any(kw in message for kw in ESCALATION_KEYWORDS + FRUSTRATED_KEYWORDS)
            or request.data.get('request_human')
            or request.data.get('ai_confidence', 100) < 70
        )
        reply = 'Thank you for contacting KaamSetu. I can help with bookings, AI guidance, and service questions.'
        if 'booking' in message:
            reply = 'For booking issues, please share your booking ID or create a support ticket.'
        elif 'refund' in message or 'payment' in message:
            reply = 'Payment and refund queries are escalated to our support team. Creating a ticket is recommended.'
            escalate = True
        return Response({
            'reply': reply,
            'demo_mode_label': 'Demo 24x7 Support Mode',
            'escalate_recommended': escalate,
            'suggested_actions': ['Create Ticket', 'Talk to Human', 'View FAQ'],
        })


class SupportFAQView(APIView):
    permission_classes = []

    def get(self, request):
        q = request.query_params.get('q', '').lower()
        faqs = [
            {'q': 'How does AI diagnosis work?', 'a': 'Upload a photo or describe the issue. Demo AI Mode provides guidance when external AI is unavailable.'},
            {'q': 'Is DIY advice safe?', 'a': 'We never provide DIY steps for gas leaks, fire, or high-voltage issues.'},
            {'q': 'How do I track my provider?', 'a': 'After booking is accepted and provider starts travel, use the Track Provider button.'},
            {'q': 'Are prices real?', 'a': 'Demo prices are labelled Approximate Demo Price.'},
        ]
        if q:
            faqs = [f for f in faqs if q in f['q'].lower() or q in f['a'].lower()]
        return Response({'faqs': faqs, 'demo_mode_label': 'Demo 24x7 Support Mode'})
