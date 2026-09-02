"""Smart slot matching and double-booking prevention."""
from datetime import datetime, timedelta, time
from decimal import Decimal
from django.utils import timezone
from django.db.models import Q

TIME_WINDOWS = [
    (time(8, 0), time(10, 0)),
    (time(10, 0), time(12, 0)),
    (time(12, 0), time(14, 0)),
    (time(14, 0), time(16, 0)),
    (time(16, 0), time(18, 0)),
    (time(18, 0), time(20, 0)),
]

ACTIVE_BOOKING_STATUSES = [
    'requested', 'accepted', 'preparing', 'on_the_way', 'arrived', 'started',
]


def _has_overlap(start1, end1, start2, end2):
    return start1 < end2 and start2 < end1


def get_provider_busy_slots(provider, date_from, date_to):
    from bookings.models import Booking, AppointmentSlot
    busy = []
    bookings = Booking.objects.filter(
        provider=provider,
        status__in=ACTIVE_BOOKING_STATUSES,
        scheduled_start__date__gte=date_from,
        scheduled_start__date__lte=date_to,
    ).exclude(scheduled_start__isnull=True)
    for b in bookings:
        if b.scheduled_start and b.scheduled_end:
            busy.append((b.scheduled_start, b.scheduled_end))
    held = AppointmentSlot.objects.filter(
        provider=provider,
        is_held=True,
        hold_expires_at__gt=timezone.now(),
        start_datetime__date__gte=date_from,
        start_datetime__date__lte=date_to,
    )
    for s in held:
        busy.append((s.start_datetime, s.end_datetime))
    blocked = provider.blocked_slots.filter(
        start_datetime__date__gte=date_from,
        end_datetime__date__lte=date_to,
    )
    for b in blocked:
        busy.append((b.start_datetime, b.end_datetime))
    return busy


def is_slot_available(provider, start_dt, end_dt, exclude_booking_id=None):
    if start_dt <= timezone.now():
        return False
    busy = get_provider_busy_slots(provider, start_dt.date(), end_dt.date())
    for b_start, b_end in busy:
        if _has_overlap(start_dt, end_dt, b_start, b_end):
            return False
    day = start_dt.weekday()
    avail = provider.availability.filter(day_of_week=day, is_available=True)
    if not avail.exists():
        return False
    slot_time = start_dt.time()
    end_time = end_dt.time()
    in_hours = any(a.start_time <= slot_time and end_time <= a.end_time for a in avail)
    return in_hours


def find_available_slots(provider, preferred_date, preferred_start=None, preferred_end=None,
                         alternatives=None, duration_minutes=60, count=10):
    from providers.models import ServiceProvider
    if isinstance(provider, int):
        provider = ServiceProvider.objects.get(pk=provider)

    slots = []
    travel_buffer = timedelta(minutes=15)
    service_duration = timedelta(minutes=duration_minutes)

    dates_to_check = [preferred_date]
    if alternatives:
        for alt in alternatives:
            d = alt.get('date')
            if d and d not in dates_to_check:
                dates_to_check.append(d)

    for check_date in dates_to_check[:7]:
        for win_start, win_end in TIME_WINDOWS:
            if preferred_start and preferred_end:
                if check_date == preferred_date:
                    if not (preferred_start <= win_start and win_end <= preferred_end):
                        if not any(
                            alt.get('date') == check_date and
                            alt.get('start') <= win_start.strftime('%H:%M') <= alt.get('end', '23:59')
                            for alt in (alternatives or [])
                        ):
                            continue

            start_dt = timezone.make_aware(datetime.combine(check_date, win_start))
            end_dt = start_dt + service_duration

            if end_dt.time() > win_end:
                continue

            if is_slot_available(provider, start_dt, end_dt):
                is_preferred = (
                    check_date == preferred_date and
                    preferred_start and preferred_end and
                    preferred_start <= win_start <= preferred_end
                )
                slots.append({
                    'date': check_date.isoformat(),
                    'start': win_start.strftime('%H:%M'),
                    'end': end_dt.time().strftime('%H:%M'),
                    'start_datetime': start_dt.isoformat(),
                    'end_datetime': end_dt.isoformat(),
                    'provider_id': provider.id,
                    'provider_name': provider.user.get_full_name() or provider.user.username,
                    'is_preferred': is_preferred,
                    'service_duration_minutes': duration_minutes,
                    'price_estimate': float(provider.visit_charge),
                    'availability': 'available',
                    'trust_score': float(provider.trust_score),
                })

    slots.sort(key=lambda s: (
        0 if s['is_preferred'] else 1,
        s['start_datetime'],
        -s['trust_score'],
    ))
    return slots[:count]


def hold_slot(provider, start_dt, end_dt, hold_minutes=15):
    from bookings.models import AppointmentSlot
    if not is_slot_available(provider, start_dt, end_dt):
        return None
    expires = timezone.now() + timedelta(minutes=hold_minutes)
    slot = AppointmentSlot.objects.create(
        provider=provider,
        start_datetime=start_dt,
        end_datetime=end_dt,
        is_held=True,
        hold_expires_at=expires,
    )
    return slot


def release_expired_holds():
    from bookings.models import AppointmentSlot, Booking
    expired = AppointmentSlot.objects.filter(
        is_held=True,
        hold_expires_at__lt=timezone.now(),
        is_confirmed=False,
    )
    for slot in expired:
        slot.is_held = False
        slot.save(update_fields=['is_held'])
        if slot.booking_id:
            Booking.objects.filter(pk=slot.booking_id, slot_status='slot_held').update(
                slot_status='slot_requested'
            )


def get_technician_busy_slots(technician, date_from, date_to):
    from bookings.models import Booking, AppointmentSlot
    busy = []
    bookings = Booking.objects.filter(
        technician=technician,
        status__in=ACTIVE_BOOKING_STATUSES,
        scheduled_start__date__gte=date_from,
        scheduled_start__date__lte=date_to,
    ).exclude(scheduled_start__isnull=True)
    for b in bookings:
        if b.scheduled_start and b.scheduled_end:
            busy.append((b.scheduled_start, b.scheduled_end))
    held = AppointmentSlot.objects.filter(
        technician=technician,
        is_held=True,
        hold_expires_at__gt=timezone.now(),
        start_datetime__date__gte=date_from,
        start_datetime__date__lte=date_to,
    )
    for s in held:
        busy.append((s.start_datetime, s.end_datetime))
    return busy


def is_technician_slot_available(technician, start_dt, end_dt):
    if start_dt <= timezone.now():
        return False
    busy = get_technician_busy_slots(technician, start_dt.date(), end_dt.date())
    for b_start, b_end in busy:
        if _has_overlap(start_dt, end_dt, b_start, b_end):
            return False
    day = start_dt.weekday()
    avail = technician.availability.filter(day_of_week=day, is_available=True)
    if not avail.exists():
        return False
    slot_time = start_dt.time()
    end_time = end_dt.time()
    return any(a.start_time <= slot_time and end_time <= a.end_time for a in avail)


def hold_technician_slot(technician, start_dt, end_dt, hold_minutes=15):
    from bookings.models import AppointmentSlot
    if not is_technician_slot_available(technician, start_dt, end_dt):
        return None
    expires = timezone.now() + timedelta(minutes=hold_minutes)
    return AppointmentSlot.objects.create(
        technician=technician,
        start_datetime=start_dt,
        end_datetime=end_dt,
        is_held=True,
        hold_expires_at=expires,
    )
