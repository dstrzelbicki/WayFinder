import hashlib
from time import sleep
from django.urls import reverse
from .views import UserLogin
from .models import AppUser
from django.test import TestCase, Client
from django.urls import reverse
from django.core.cache import cache

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