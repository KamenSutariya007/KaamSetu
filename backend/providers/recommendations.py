"""Provider recommendation engine."""
from decimal import Decimal
from math import radians, cos, sin, asin, sqrt


def haversine(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return 999
    lat1, lon1, lat2, lon2 = map(float, [lat1, lon1, lat2, lon2])
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371 * 2 * asin(sqrt(a))


def score_provider(provider, category_slug, customer_lat, customer_lon):
    cat_match = 30 if provider.categories.filter(slug=category_slug).exists() else 0
    verify = 20 if provider.verification_status == 'verified' else 5
    dist = haversine(customer_lat, customer_lon, provider.base_latitude, provider.base_longitude)
    dist_score = max(0, 15 - dist) if dist < 15 else 0
    avail = 15 if provider.is_active else 0
    rating = float(provider.average_rating) / 5 * 10
    jobs = min(provider.completed_jobs / 50, 1) * 5
    ontime = float(provider.on_time_rate) / 100 * 3
    response = float(provider.response_rate) / 100 * 2
    total = cat_match + verify + dist_score + avail + rating + jobs + ontime + response
    return {
        'score': round(total, 2),
        'distance_km': round(dist, 2),
        'eta_minutes': int(dist * 3 + 10) if dist < 999 else None,
    }


def score_partner(partner, category_slug, customer_lat, customer_lon):
    cat_match = 30 if partner.categories.filter(slug=category_slug).exists() else 0
    verify = 20 if partner.verification_status == 'verified' else 5
    dist = haversine(customer_lat, customer_lon, partner.latitude, partner.longitude)
    dist_score = max(0, 15 - dist) if dist < 15 else 0
    avail = 15 if partner.is_active else 0
    rating = float(partner.average_rating) / 5 * 10
    brand_bonus = 5 if partner.authorized_brands else 0
    warranty_bonus = 3 if partner.warranty_support else 0
    parts_bonus = 2 if partner.spare_parts_available else 0
    total = cat_match + verify + dist_score + avail + rating + brand_bonus + warranty_bonus + parts_bonus
    return {
        'score': round(total, 2),
        'distance_km': round(dist, 2),
        'eta_minutes': int(float(partner.response_time_hours) * 60),
    }


def get_recommendations(category_slug, customer_lat=None, customer_lon=None, limit=8):
    from providers.models import ServiceProvider, ThirdPartyPartner

    results = {'sections': {}}
    providers = ServiceProvider.objects.filter(is_active=True).prefetch_related('categories', 'user')
    partners = ThirdPartyPartner.objects.filter(is_active=True).prefetch_related('categories')

    scored_providers = []
    for p in providers:
        s = score_provider(p, category_slug, customer_lat, customer_lon)
        scored_providers.append({'type': 'provider', 'data': p, **s})

    scored_partners = []
    for p in partners:
        s = score_partner(p, category_slug, customer_lat, customer_lon)
        scored_partners.append({'type': 'partner', 'data': p, **s})

    all_scored = scored_providers + scored_partners
    all_scored.sort(key=lambda x: -x['score'])

    if all_scored:
        results['sections']['best_match'] = all_scored[:3]
    nearest = sorted(all_scored, key=lambda x: x.get('distance_km', 999))[:3]
    if nearest:
        results['sections']['nearest_available'] = nearest
    rated = sorted(
        [x for x in all_scored if x['type'] == 'provider'],
        key=lambda x: -float(x['data'].average_rating)
    )[:3]
    if rated:
        results['sections']['highest_rated'] = rated
    low_cost = sorted(
        [x for x in all_scored if x['type'] == 'provider'],
        key=lambda x: float(x['data'].visit_charge)
    )[:3]
    if low_cost:
        results['sections']['lowest_cost'] = low_cost
    emergency = [x for x in all_scored if (
        (x['type'] == 'provider' and x['data'].emergency_available) or
        (x['type'] == 'partner' and x['data'].emergency_available)
    )][:3]
    if emergency:
        results['sections']['emergency_available'] = emergency
    brand = [x for x in scored_partners if x['data'].authorized_brands][:3]
    if brand:
        results['sections']['authorized_brand'] = brand
    fastest = sorted(all_scored, key=lambda x: x.get('eta_minutes') or 999)[:3]
    if fastest:
        results['sections']['fastest_arrival'] = fastest
    top_local = sorted(scored_providers, key=lambda x: (-float(x['data'].trust_score), x.get('distance_km', 999)))[:3]
    if top_local:
        results['sections']['top_local_professional'] = top_local

    return results
