import hashlib
from time import sleep
from django.urls import reverse
from .views import (DisableTOTP, VerifyTOTP, UserLogin,
    FavRouteView, UseRecoveryCode, SetupTOTP, ResetPassword,
    ForgottenPassword, RouteView, SearchedLocationView)
from .models import AppUser, RecoveryCode, Route, SearchedLocation
from django.test import RequestFactory, TestCase, Client
from django.urls import reverse
from django.core.cache import cache
from rest_framework_simplejwt.tokens import AccessToken
from django.test import TestCase
from rest_framework.test import APIClient
from .models import FavRoute
from .serializers import (FavRouteSerializer, UserSerializer,
                          RouteSerializer, SearchedLocationSerializer)
from rest_framework import status
from unittest.mock import patch
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework.throttling import UserRateThrottle
from django.core import mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import force_authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator


class NoThrottle(UserRateThrottle):
    def allow_request(self, request, view):
        return True


class UserLoginRateLimitTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.login_url = reverse('login')

        self.user = AppUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='O9247MVc3608471#'
        )
        self.user_credentials = {
            'email': 'test@example.com',
            'password': 'O9247MVc3608471#',
        }

        self.user.failed_login_attempts = 0
        self.user.save()
        self.email = 'test@example.com'
        self.ip = '127.0.0.1'
        self.rate_limit_key = f'login_attempt_{hashlib.sha256((self.ip + self.email).encode()).hexdigest()}'
        cache.set(self.rate_limit_key, 0, UserLogin.RATE_LIMIT_TIMEOUT)

        self.original_throttle_classes = UserLogin.throttle_classes
        UserLogin.throttle_classes = [NoThrottle]

    def test_successful_login(self):
        response = self.client.post(self.login_url, self.user_credentials)
        self.assertEqual(response.status_code, 200)
        # check the rate limit counter is reset
        self.assertEqual(cache.get(self.rate_limit_key), 0)

    def test_rate_limit_exceeded(self):
        for _ in range(5):
            self.client.post(self.login_url, {'email': 'test@example.com', 'password': 'X1295DFd31491%'})
        response = self.client.post(self.login_url, self.user_credentials)
        self.assertEqual(response.status_code, 429)

    def test_rate_limit_reset_after_timeout(self):
        for _ in range(5):
            self.client.post(self.login_url, {'email': 'test@example.com', 'password': 'X1295DFd31491%'})
        sleep(61)
        response = self.client.post(self.login_url, self.user_credentials)
        self.assertEqual(response.status_code, 200)


class FavRouteViewTest(TestCase):
    def setUp(self):
        self.user = AppUser.objects.create_user(
            username="testuser", email="test@example.com", password="O9247MVc3608471#"
        )
        self.client = APIClient()
        self.token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + self.token)
        FavRoute.objects.create(user=self.user, name="Route1", data={})
        self.url = reverse("fav_route")
        self.original_throttle_classes = FavRouteView.throttle_classes
        FavRouteView.throttle_classes = [NoThrottle]

    def _generate_token(self, user):
        access = AccessToken.for_user(user)
        return str(access)

    def test_get_fav_routes(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            FavRouteSerializer(FavRoute.objects.filter(user=self.user), many=True).data,
        )

    def test_get_no_fav_routes(self):
        user2 = AppUser.objects.create_user(
            username="testuser2", email="test2@example.com", password="O9247MVc3608471#"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer " + self._generate_token(user2)
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 404)

    def test_post_valid_fav_route(self):
        response = self.client.post(
            self.url, {"name": "NewRoute", "data": '{"test": "test"}'}
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(FavRoute.objects.filter(name="NewRoute").exists())

    def test_post_invalid_fav_route(self):
        response = self.client.post(self.url, {"invalid_field": "Invalid"})
        self.assertEqual(response.status_code, 400)


class UseRecoveryCodeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_email = "test@example.com"
        self.user_email_hash = hashlib.sha256(self.user_email.encode()).hexdigest()
        self.recovery_code_str = "123456ABCDEF"
        self.user = AppUser.objects.create_user(
            username="testuser", email="test@example.com", password="O9247MVc3608471#"
        )
        self.recovery_code = RecoveryCode.objects.create(
            code=self.recovery_code_str, user=self.user, used=False
        )
        self.url = reverse("use_recovery_code")
        self.original_throttle_classes = UseRecoveryCode.throttle_classes
        UseRecoveryCode.throttle_classes = [NoThrottle]

    @patch("api.views.login")
    def test_valid_recovery(self, mock_login):
        response = self.client.post(
            self.url,
            {"email": self.user_email, "recovery_code": self.recovery_code_str},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["detail"], "Recovery successful")
        mock_login.assert_called_once()

    def test_invalid_email_format(self):
        response = self.client.post(
            self.url, {"email": "invalidemail", "recovery_code": self.recovery_code_str}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Invalid email format")

    def test_user_not_found(self):
        response = self.client.post(
            self.url,
            {"email": "notfound@example.com", "recovery_code": self.recovery_code_str},
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "User not found")

    def test_invalid_recovery_code_format(self):
        response = self.client.post(
            self.url, {"email": self.user_email, "recovery_code": "invalid$$code"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Invalid recovery code")

    @patch("api.models.RecoveryCode.objects.filter")
    def test_invalid_or_used_recovery_code(self, mock_filter):
        mock_filter.return_value.first.return_value = None
        response = self.client.post(
            self.url, {"email": self.user_email, "recovery_code": "usedorinvalidcode"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["detail"], "Invalid or already used recovery code"
        )

    @patch("api.views.permissions.AllowAny.has_permission", return_value=False)
    def test_jwt_authentication_required(self, mock_permission):
        response = self.client.post(
            self.url,
            {"email": self.user_email, "recovery_code": self.recovery_code_str},
        )
        self.assertNotEqual(response.status_code, status.HTTP_200_OK)


class DisableTOTPTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.recovery_code_str = '123456ABCDEF'
        self.user = AppUser.objects.create_user(
            username='testuser', email='test2@example.com', password='O9247MVc3608471#'
        )
        self.user.is_2fa_enabled = True
        self.user.save()
        self.device = TOTPDevice.objects.create(user=self.user, confirmed=True)
        self.recovery_code = RecoveryCode.objects.create(
            code=self.recovery_code_str, user=self.user, used=False
        )
        self.url = reverse('disable-totp')
        self.original_throttle_classes = DisableTOTP.throttle_classes
        DisableTOTP.throttle_classes = [NoThrottle]

    def _generate_token(self, user):
        access = AccessToken.for_user(user)
        return str(access)

    def test_unauthenticated_access(self):
        response = self.client.post(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_access(self):
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.post(self.url)
        assert response.status_code == status.HTTP_200_OK

    def test_disable_2fa_without_enabled_2fa(self):
        self.user.is_2fa_enabled = False
        self.user.save()
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.post(self.url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_disable_2fa_with_no_totp_device(self):
        user = AppUser.objects.create_user(
            username='userWithNoTOTP', email='userWithNoTOTP@example.com', password='O9247MVc3608471#'
        )
        user.is_2fa_enabled = True
        user.save()
        token = self._generate_token(user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.post(self.url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_disable_2fa_with_confirmed_totp_device(self):
        self.user.is_2fa_enabled = True
        self.user.save()
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.post(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert not TOTPDevice.objects.filter(user=self.user, confirmed=True).exists()


class VerifyTOTPTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.recovery_code_str = '123456ABCDEF'
        self.user = AppUser.objects.create_user(
            username='testuser', email='test2@example.com', password='O9247MVc3608471#'
        )
        self.user.is_2fa_enabled = True
        self.user.save()
        self.device = TOTPDevice.objects.create(user=self.user, confirmed=False)
        self.recovery_code = RecoveryCode.objects.create(
            code=self.recovery_code_str, user=self.user, used=False
        )
        self.url = reverse('verify_totp')
        self.original_throttle_classes = VerifyTOTP.throttle_classes
        VerifyTOTP.throttle_classes = [NoThrottle]

    def _generate_token(self, user):
        access = AccessToken.for_user(user)
        return str(access)

    def test_invalid_form_data(self):
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.post(self.url, {'otp': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_action(self):
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.post(self.url, {'otp': '123456', 'action': 'invalid_action'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('pyotp.TOTP.verify')
    def test_no_totp_device(self, mock_verify):
        mock_verify.return_value = True
        user = AppUser.objects.create_user(
            username='userNoDevice', email='userNoDevice@example.com', password='O9247MVc3608471#'
        )
        token = self._generate_token(user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.post(self.url, {'otp': '123456', 'action': 'enable'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('api.views.send_mail')
    @patch('pyotp.TOTP.verify')
    def test_enable_action(self, mock_send_mail, mock_verify):
        mock_verify.return_value = True
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        valid_otp = '123456'
        response = self.client.post(self.url, {'otp': valid_otp, 'action': 'enable'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('recovery_codes', response.data)
        mock_send_mail.assert_called_once()

    @patch('pyotp.TOTP.verify')
    def test_disable_action(self, mock_verify):
        mock_verify.return_value = True
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        self.device.confirmed = True
        self.device.save()
        response = self.client.post(self.url, {'otp': '123456', 'action': 'disable'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('recovery_codes', response.data)


class SetupTOTPTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            username='userSetup', email='userSetup@example.com', password='O9247MVc3608471#'
        )
        self.url = reverse('setup_totp')
        self.original_throttle_classes = SetupTOTP.throttle_classes
        SetupTOTP.throttle_classes = [NoThrottle]

    def _generate_token(self, user):
        return str(AccessToken.for_user(user))

    def test_get_provisioning_url(self):
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('provisioning_url', response.data)


class ResetPasswordTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = AppUser.objects.create_user(
            username='userReset', email='userReset@example.com', password='O9247MVc3608471#'
        )
        self.user_id = self.user.id
        self.uidb64 = urlsafe_base64_encode(force_bytes(self.user.id))
        self.view = ResetPassword.as_view()
        self.url = reverse('password_reset')
        self.original_throttle_classes = ResetPassword.throttle_classes
        ResetPassword.throttle_classes = [NoThrottle]

    @patch.object(PasswordResetTokenGenerator, 'check_token', return_value=True)
    def test_reset_password(self, mock_check_token):
        request = self.factory.post(self.url, {
            'token': 'testtoken',
            'password': 'p94u7nTc567O471)',
            'uidb64': self.uidb64
        })
        force_authenticate(request, user=self.user)

        response = self.view(request)

        self.assertEqual(response.status_code, 204)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('p94u7nTc567O471)'))

    def test_reset_password_invalid_token(self):
        request = self.factory.post(self.url, {
            'token': 'invalidtoken',
            'password': 'p94u7nTc567O471)',
            'uidb64': self.uidb64
        })
        force_authenticate(request, user=self.user)

        response = self.view(request)

        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertFalse(self.user.check_password('p94u7nTc567O471)'))


class ForgottenPasswordTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = AppUser.objects.create_user(
            username='userForgotten', email='userForgotten@example.com', password='O9247MVc3608471#'
        )
        self.view = ForgottenPassword.as_view()
        self.url = reverse('forgotten_password')
        self.original_throttle_classes = ForgottenPassword.throttle_classes
        ForgottenPassword.throttle_classes = [NoThrottle]

    def test_forgotten_password(self):
        request = self.factory.post(self.url, {
            'email': 'userForgotten@example.com',
        })
        response = self.view(request)
        self.assertEqual(response.status_code, 200)

    def test_forgotten_password_no_email(self):
        request = self.factory.post(self.url, {
            'email': '',
        })
        response = self.view(request)
        self.assertEqual(response.status_code, 400)

    def test_forgotten_password_nonexistent_user(self):
        request = self.factory.post(self.url, {
            'email': 'nonexistent@example.com',
        })
        response = self.view(request)
        self.assertEqual(response.status_code, 404)


class RouteViewTests(TestCase):
    def setUp(self):
        self.user = AppUser.objects.create_user(
            username="testuser", email="test@example.com", password="O9247MVc3608471#"
        )
        self.client = APIClient()
        self.token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + self.token)
        self.url = reverse("route")
        self.original_throttle_classes = RouteView.throttle_classes
        RouteView.throttle_classes = [NoThrottle]

    def _generate_token(self, user):
        access = AccessToken.for_user(user)
        return str(access)

    def test_get_routes(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            RouteSerializer(Route.objects.filter(user=self.user), many=True).data,
        )

    def test_post_valid_route(self):
        response = self.client.post(
            self.url, {
                "start_location_name" : "location1",
                "start_location_lat" : 0,
                "start_location_lng" : 0,
                "end_location_name" : "location2",
                "end_location_lat" : 0,
                "end_location_lng" : 0,
                "distance" : 0,
                "duration" : 0
            }
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Route.objects.filter(start_location_name="location1").exists())

    def test_post_invalid_route(self):
        response = self.client.post(self.url, {"invalid_field": "Invalid"})
        self.assertEqual(response.status_code, 400)


class SearchedLocationViewTests(TestCase):
    def setUp(self):
        self.user = AppUser.objects.create_user(
            username="testlocation", email="testlocation@example.com", password="O9247MVc3608471#"
        )
        self.client = APIClient()
        self.token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + self.token)
        self.url = reverse("location")
        self.original_throttle_classes = SearchedLocationView.throttle_classes
        SearchedLocationView.throttle_classes = [NoThrottle]

    def _generate_token(self, user):
        access = AccessToken.for_user(user)
        return str(access)

    def test_get_searched_locations(self):
        SearchedLocation.objects.create(user=self.user, name="location1", lat=0, lng=0)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            SearchedLocationSerializer(SearchedLocation.objects.filter(user=self.user), many=True).data,
        )

    def test_get_no_searched_locations(self):
        user2 = AppUser.objects.create_user(
            username="testuser2", email="test2@example.com", password="O9247MVc3608471#"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer " + self._generate_token(user2)
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 404)

    def test_post_valid_searched_location(self):
        response = self.client.post(
            self.url, {
                "name" : "location1",
                "lat" : 0,
                "lng" : 0,
            }
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(SearchedLocation.objects.filter(name="location1").exists())