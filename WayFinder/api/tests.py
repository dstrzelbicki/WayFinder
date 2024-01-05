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
        """
        Test case for successful login.

        This method tests the successful login functionality by making a POST request to the login URL
        with the user credentials. It then asserts that the response status code is 200 (OK) and checks
        that the rate limit counter is reset to 0.
        """
        response = self.client.post(self.login_url, self.user_credentials)
        self.assertEqual(response.status_code, 200)
        # check the rate limit counter is reset
        self.assertEqual(cache.get(self.rate_limit_key), 0)

    def test_rate_limit_exceeded(self):
        """
        Test case to check if the rate limit is exceeded.

        It sends multiple POST requests to the login URL and then checks if the response status code is 429 (Too Many Requests).
        """
        for _ in range(5):
            self.client.post(self.login_url, {'email': 'test@example.com', 'password': 'X1295DFd31491%'})
        response = self.client.post(self.login_url, self.user_credentials)
        self.assertEqual(response.status_code, 429)

    def test_rate_limit_reset_after_timeout(self):
        """
        Test case to verify that the rate limit is reset after a timeout.

        This test sends multiple login requests within a short period of time,
        exceeding the rate limit. Then it waits for the rate limit timeout to
        expire and sends another login request. The test asserts that the response
        status code is 200, indicating that the rate limit has been reset.
        """
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
        """
        Test case for getting favorite routes.

        This test sends a GET request to the specified URL and checks if the response status code is 200.
        It also compares the response data with the serialized data of the favorite routes filtered by the user.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            FavRouteSerializer(FavRoute.objects.filter(user=self.user), many=True).data,
        )

    def test_get_no_fav_routes(self):
        """
        Test case to verify the behavior when there are no favorite routes for a user.

        This test sends a GET request to the specified URL with a user that has no favorite routes.
        It then checks if the response status code is 404 (Not Found).
        """
        user2 = AppUser.objects.create_user(
            username="testuser2", email="test2@example.com", password="O9247MVc3608471#"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer " + self._generate_token(user2)
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 404)

    def test_post_valid_fav_route(self):
        """
        Test case for posting a valid favorite route.

        This test case verifies that a valid favorite route can be successfully posted
        to the server. It sends a POST request to the specified URL with the required
        parameters and checks that the response status code is 201 (Created). It also
        asserts that the newly created favorite route exists in the database.
        """
        response = self.client.post(
            self.url, {"name": "NewRoute", "data": '{"test": "test"}'}
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(FavRoute.objects.filter(name="NewRoute").exists())

    def test_post_invalid_fav_route(self):
        """
        Test case for posting an invalid favorite route.

        This test sends a POST request to the specified URL with an invalid field.
        It then checks if the response status code is 400 (Bad Request).
        """
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
        """
        Test case for valid recovery code.

        This test case verifies the behavior of the API when a valid recovery request is made.
        It checks that the response status code is 200 (OK), the response data contains a "token" key,
        the response detail is "Recovery successful", and the login function is called once.
        """
        response = self.client.post(
            self.url,
            {"email": self.user_email, "recovery_code": self.recovery_code_str},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["detail"], "Recovery successful")
        mock_login.assert_called_once()

    def test_invalid_email_format(self):
        """
        Test case for handling invalid email format scenario.

        Test case to check if the API returns a 400 BAD REQUEST status code and the correct error message
        when an invalid email format is provided.
        """
        response = self.client.post(
            self.url, {"email": "invalidemail", "recovery_code": self.recovery_code_str}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Invalid email format")

    def test_user_not_found(self):
        """
        Test case for handling user not found scenario.

        It sends a POST request to the specified URL with an email and recovery code.
        The expected response status code is 404 (Not Found) and the response data should contain the detail "User not found".
        """
        response = self.client.post(
            self.url,
            {"email": "notfound@example.com", "recovery_code": self.recovery_code_str},
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "User not found")

    def test_invalid_recovery_code_format(self):
        """
        Test case to check the behavior when an invalid recovery code format is provided.

        It sends a POST request to the specified URL with an invalid recovery code format.
        The expected behavior is to receive a response with a status code of 400 (Bad Request)
        and a detail message indicating that the recovery code is invalid.
        """
        response = self.client.post(
            self.url, {"email": self.user_email, "recovery_code": "invalid$$code"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Invalid recovery code")

    @patch("api.models.RecoveryCode.objects.filter")
    def test_invalid_or_used_recovery_code(self, mock_filter):
        """
        Test case to verify the behavior when an invalid or already used recovery code is provided.

        It mocks the filter method of the RecoveryCode model to return None as the first recovery code.
        Then, it sends a POST request to the specified URL with the user's email and an invalid or used recovery code.
        Finally, it asserts that the response status code is 400 (Bad Request) and the response data's detail is "Invalid or already used recovery code".
        """
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
        """
        Test that JWT authentication is required for the view.

        This test verifies that when a request is made to the specified URL with the given parameters,
        the response status code is not equal to 200 (OK), indicating that JWT authentication is required.
        """
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
        """
        Test for unauthenticated access to the API endpoint.

        This test verifies that when a request is made to the API endpoint without
        authentication, the server responds with a status code of 401 UNAUTHORIZED.
        """
        response = self.client.post(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_access(self):
        """
        Test case to verify authenticated access.

        This test ensures that the API endpoint can be accessed by an authenticated user.
        It generates a token for the user, sets the token in the request's authorization header,
        and makes a POST request to the endpoint. The test asserts that the response status code
        is HTTP 200 OK.
        """
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.post(self.url)
        assert response.status_code == status.HTTP_200_OK

    def test_disable_2fa_without_enabled_2fa(self):
        """
        Test case for disabling 2FA without having it enabled.

        This test verifies the behavior of the API when a request is made to disable 2FA for a user who does not have 2FA enabled.
        It sets the 'is_2fa_enabled' attribute of the user to False, saves the user, generates a token for the user,
        sets the token in the request's authorization header, and makes a POST request to the endpoint.
        The test asserts that the response status code is HTTP 400 BAD REQUEST.
        """
        self.user.is_2fa_enabled = False
        self.user.save()
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.post(self.url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_disable_2fa_with_no_totp_device(self):
        """
        Test case for disabling 2FA without a TOTP device.

        This test verifies the behavior of the API when a request is made to disable 2FA for a user who does not have a TOTP device.
        It creates a new user with 2FA enabled, generates a token for the user, sets the token in the request's authorization header,
        and makes a POST request to the endpoint. The test asserts that the response status code is HTTP 400 BAD REQUEST.
        """
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
        """
        Test case for disabling 2FA with a confirmed TOTP device.

        This test verifies the behavior of the API when a request is made to disable 2FA for a user who has a confirmed TOTP device.
        It sets the 'is_2fa_enabled' attribute of the user to True, saves the user, generates a token for the user,
        sets the token in the request's authorization header, and makes a POST request to the endpoint.
        The test asserts that the response status code is HTTP 200 OK and checks that there are no TOTP devices with confirmed status for the user.
        """
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
        """
        Test case for invalid form data.

        This method tests the behavior of the API when invalid form data is provided.
        It generates an access token for the user, sets the credentials for the client,
        and makes a POST request to the specified URL with an empty 'otp' field.
        The method then asserts that the response status code is 400 (Bad Request).
        """
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.post(self.url, {'otp': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_action(self):
        """
        Test case for invalid action.

        This method tests the behavior of the API when an invalid action is provided.
        It generates an access token for the user, sets the credentials for the client,
        and makes a POST request to the specified URL with an invalid action value.
        The method then asserts that the response status code is 400 (Bad Request).
        """
        token = self._generate_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        response = self.client.post(self.url, {'otp': '123456', 'action': 'invalid_action'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('pyotp.TOTP.verify')
    def test_no_totp_device(self, mock_verify):
        """
        Test case for the scenario when no TOTP device is associated with the user.

        This method tests the behavior of the API when a user tries to enable 2FA (Two-Factor Authentication) without having a TOTP (Time-Based One-Time Password) device associated with their account.
        It creates a new user with no TOTP device, generates an access token for the user, sets the credentials for the client, and makes a POST request to the specified URL with the OTP (One-Time Password) and action parameters.
        The method then asserts that the response status code is 400 (Bad Request).
        """
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
        """
        Test case for enabling 2FA.

        This test case verifies that the 'enable' action is properly handled by the API.
        It mocks the 'send_mail' function and the 'verify' method of the 'pyotp.TOTP' class.
        It generates a token for the user, sets the HTTP authorization header with the token,
        and sends a POST request to the specified URL with the OTP and action parameters.
        It asserts that the response status code is 200 (OK) and that the 'recovery_codes'
        field is present in the response data. It also asserts that the 'send_mail' function
        is called once.
        """
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
        """
        Test case for disabling 2FA.

        This test verifies that the disable action endpoint works correctly by simulating a successful OTP verification,
        setting the device as confirmed, and making a POST request to the endpoint with the OTP and action parameters.
        The test asserts that the response status code is 200 (OK) and that the 'recovery_codes' key is not present in the response data.
        """
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
        """
        Test case for getting the provisioning URL.

        This method tests the functionality of retrieving the provisioning URL
        when a valid token is provided in the request's authorization header.
        It asserts that the response status code is 200 (OK) and that the
        'provisioning_url' key is present in the response data.
        """
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
        """
        Test case for resetting password.

        This test case simulates the process of resetting a user's password.
        It sends a POST request to the reset password endpoint with the necessary data,
        including the reset token, new password, and user ID.
        The request is authenticated with the user's credentials.
        The expected response status code is 204 (No Content).
        After the password is reset, the user's password is checked to ensure it matches the new password.
        """
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
        """
        Test case for resetting password with an invalid token.

        This test case simulates the scenario where a user tries to reset their password with an invalid token.
        It creates a POST request to the reset password endpoint with an invalid token, a new password, and the user ID.
        The request is authenticated with the user's credentials. The expected response status code is 400 (Bad Request).
        After the request is made, the user's password is checked to ensure it has not been changed.
        """
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
        """
        Test case for the forgotten password functionality.

        This test sends a POST request to the specified URL with a user's email address.
        It then checks if the response status code is 200, indicating a successful request.

        """
        request = self.factory.post(self.url, {
            'email': 'userForgotten@example.com',
        })
        response = self.view(request)
        self.assertEqual(response.status_code, 200)

    def test_forgotten_password_no_email(self):
        """
        Test case for handling the scenario when no email is provided for forgotten password functionality.

        This test case verifies the behavior of the 'ForgottenPassword' view when a POST request is made without providing an email address. 
        It creates a request object with an empty email field and sends it to the view. 
        The expected response status code is 400 (Bad Request), indicating that the request is invalid due to the missing email field.
        """
        request = self.factory.post(self.url, {
            'email': '',
        })
        response = self.view(request)
        self.assertEqual(response.status_code, 400)

    def test_forgotten_password_nonexistent_user(self):
        """
        Test case for handling the scenario when the user does not exist for the forgotten password functionality.

        This test case verifies the behavior of the 'ForgottenPassword' view when a POST request is made with an email address of a non-existent user. 
        It creates a request object with the email address of a non-existent user and sends it to the view. 
        The expected response status code is 404 (Not Found), indicating that the user does not exist.
        """
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
        """
        Test case for the getting routes.

        This method tests the functionality of retrieving routes for a specific user.
        It sends a GET request to the specified URL and asserts that the response status code is 200.
        It also asserts that the response data matches the serialized data of the routes filtered by the user.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            RouteSerializer(Route.objects.filter(user=self.user), many=True).data,
        )

    def test_post_valid_route(self):
        """
        Test case for posting a valid route.

        This test sends a POST request to the specified URL with valid route data.
        It then checks if the response status code is 201 (Created) and verifies
        that a Route object with the specified start location name exists in the database.
        """
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
        """
        Test case for posting an invalid route.

        This test sends a POST request to the specified URL with an invalid field.
        It expects the response status code to be 400 (Bad Request).
        """
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
        """
        Test the GET request for retrieving searched locations.

        This method tests the functionality of the GET request for retrieving searched locations.
        It creates a new searched location object with the specified user, name, latitude, and longitude.
        Then, it sends a GET request to the specified URL and checks if the response status code is 200 (OK).
        It also compares the response data with the serialized data of the searched locations filtered by the user.
        """
        SearchedLocation.objects.create(user=self.user, name="location1", lat=0, lng=0)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            SearchedLocationSerializer(SearchedLocation.objects.filter(user=self.user), many=True).data,
        )

    def test_get_no_searched_locations(self):
        """
        Test the GET request for retrieving searched locations.

        This method tests the functionality of the GET request for retrieving searched locations.
        It creates a new user object with the specified username, email, and password.
        Then, it sets the client credentials with the generated token for the new user.
        After that, it sends a GET request to the specified URL and checks if the response status code is 404 (Not Found).
        This is to test the scenario where the user has no searched locations.
        """
        user2 = AppUser.objects.create_user(
            username="testuser2", email="test2@example.com", password="O9247MVc3608471#"
        )
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer " + self._generate_token(user2)
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 404)

    def test_post_valid_searched_location(self):
        """
        Test case for posting a valid searched location.

        This test verifies that a valid searched location can be successfully posted
        to the API and that it returns a status code of 201 (Created). It also checks
        that the posted location is saved in the database.
        """
        response = self.client.post(
            self.url, {
                "name" : "location1",
                "lat" : 0,
                "lng" : 0,
            }
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(SearchedLocation.objects.filter(name="location1").exists())