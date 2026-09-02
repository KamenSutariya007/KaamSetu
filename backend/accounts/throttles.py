from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle


class SendOTPThrottle(AnonRateThrottle):
    scope = 'send_otp'


class VerifyOTPThrottle(AnonRateThrottle):
    scope = 'verify_otp'


class RegisterThrottle(AnonRateThrottle):
    scope = 'register'


class GoogleAuthThrottle(AnonRateThrottle):
    scope = 'google_auth'


class EmailIPThrottle(SimpleRateThrottle):
    scope = 'email_ip'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}
