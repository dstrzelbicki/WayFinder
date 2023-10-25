from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.http import HttpResponse
from django.shortcuts import redirect
from django.contrib.auth.views import LoginView
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.views import View
from django.core.mail import send_mail
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.crypto import get_random_string
from django.contrib.auth import login, logout, update_session_auth_hash, get_user_model, authenticate
from django.forms import ValidationError
from rest_framework.authentication import SessionAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import (UserRegisterSerializer, UserLoginSerializer,
                          UserSerializer, UserChangePasswordSerializer, RouteSerializer)
from rest_framework import permissions, status
from .validations import custom_validation, validate_email, validate_password
from datetime import datetime, timedelta, timezone
from django_ratelimit.decorators import ratelimit as django_ratelimit
from django_ratelimit.exceptions import Ratelimited
from functools import wraps
from .models import Route
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
import pyotp
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import secrets

token_generator = PasswordResetTokenGenerator()
now_utc = datetime.now(timezone.utc)
User = get_user_model()


def custom_ratelimit(key=None, rate=None, method=None, block=False):
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if hasattr(request, 'META'):
                return django_ratelimit(key=key, rate=rate, method=method,
                                        block=block)(func)(request, *args, **kwargs)
            else:
                return func(request, *args, **kwargs)

        return wrapper

    return decorator


class UserRegister(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        clean_data = custom_validation(request.data)
        serializer = UserRegisterSerializer(data=clean_data)
        if serializer.is_valid():
            user = serializer.save()

            subject = 'Welcome to WayFinder'
            message = 'Thank you for registering on WayFinder!'
            recipients = [user.email]

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=recipients,
                fail_silently=False,
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogin(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = (SessionAuthentication,)

    @custom_ratelimit(key='ip', rate='5/m', block=True)
    def post(self, request):
        data = request.data
        ip = request.META.get('REMOTE_ADDR')
        assert validate_email(data)
        assert validate_password(data)

        # check for rate limiting
        user = User.objects.filter(email=data.get('email')).first()
        if user:
            if user.failed_login_attempts >= 5 and \
                    (now_utc - user.last_failed_login) < timedelta(minutes=60):
                return Response({"message": "Too many failed login attempts, please wait."},
                                status=status.HTTP_429_TOO_MANY_REQUESTS)

        serializer = UserLoginSerializer(data=data)
        if serializer.is_valid():
            user = authenticate(request, email=data['email'], password=data['password'])
            if user:
                login(request, user)
                # reset failed login attempts
                user.failed_login_attempts = 0
                user.save()
                token, created = Token.objects.get_or_create(user=user)
                return Response({'token': token.key}, status=status.HTTP_200_OK)
            else:
                # increment failed login attempts
                user.failed_login_attempts += 1
                user.last_failed_login = datetime.now()
                user.save()
        return Response(serializer.errors, status=status.HTTP_400)


class UserLogout(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_200_OK)


class UserView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({'user': serializer.data}, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserChangePassword(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)

    def put(self, request):
        serializer = UserChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.update(request.user, serializer.validated_data)
            update_session_auth_hash(request, request.user)
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RouteView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (TokenAuthentication,)

    def get(self, request):
        routes = Route.objects.filter(user=request.user)
        serializer = RouteSerializer(routes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = RouteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def reset_password(request):
    if request.method == 'POST':
        email = request.POST.get('email')

        # Check if the user with the provided email exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'message': 'User does not exist'}, status=404)

        # Generate a reset token
        reset_token = get_random_string(length=32)

        # Save the reset token to the user's profile
        user.profile.reset_token = reset_token
        user.profile.save()

        # Prepare the email content
        subject = 'Password Reset'
        message = f'Click the link to reset your password: https://example.com/reset-password/{reset_token}'
        from_email = 'wayfinder.no.response@gmail.com'
        recipient_list = [email]

        # Send the email
        try:
            send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        except Exception as e:
            return JsonResponse({'message': str(e)}, status=500)

        return JsonResponse({'message': 'Email sent successfully'})
    else:
        return JsonResponse({'message': 'Invalid request method'}, status=405)


class ResetPasswordConfirmView(APIView):
    # permission_classes = (permissions.AllowAny,)
    # authentication_classes = (TokenAuthentication,)

    def post(self, request):
        token = request.POST.get('token')
        password = request.POST.get('password')
        uidb64 = request.POST.get('uidb64')

        # Decode the token and get the user
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = get_user_model().objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):
            user = None

        if user is not None and token_generator.check_token(user, token):
            # Reset the user's password
            user.set_password(password)
            user.save()
            return redirect('login')
        else:
            return HttpResponse('Invalid or expired token', status=400)


class SetupTOTP(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (TokenAuthentication,)

    def get(self, request):
        user = request.user
        totp_device = TOTPDevice.objects.filter(user=user, confirmed=False).first()

        if not totp_device:
            # generate a random 20-byte (160-bit) hexadecimal key
            secret_key = secrets.token_hex(20)
            totp_device = TOTPDevice.objects.create(user=user, key=secret_key, confirmed=False)
        else:
            secret_key = totp_device.key

        totp = pyotp.TOTP(secret_key, digits=6)
        provisioning_url = totp.provisioning_uri(user.email, issuer_name="WayFinder")

        return Response({"provisioning_url": provisioning_url})


class VerifyTOTP(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (TokenAuthentication,)

    def post(self, request):
        user = request.user
        otp = request.data.get('otp')

        totp_device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
        if not totp_device:
            return Response({"detail": "TOTP device not set up."}, status=status.HTTP_400_BAD_REQUEST)

        # initialize a TOTP object with the stored base32 key
        totp = pyotp.TOTP(totp_device.key, digits=6)

        # manually verify the OTP
        if not totp.verify(otp.strip()):
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        totp_device.confirmed = True
        totp_device.save()

        return Response({"detail": "TOTP device confirmed."})