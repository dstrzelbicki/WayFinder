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
                          UserSerializer, UserChangePasswordSerializer, RouteSerializer,
                          SearchedLocationSerializer)
from rest_framework import permissions, status
from .validations import custom_validation, validate_password
from datetime import datetime, timedelta, timezone
from django_ratelimit.decorators import ratelimit as django_ratelimit
from django_ratelimit.exceptions import Ratelimited
from functools import wraps
from .models import Route, RecoveryCode, SearchedLocation
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
import pyotp
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django import forms
from django.core.validators import validate_email
from django.middleware.csrf import rotate_token
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

token_generator = PasswordResetTokenGenerator()
now_utc = datetime.now(timezone.utc)
User = get_user_model()


class OTPForm(forms.Form):
    otp = forms.RegexField(regex=r'^\d{6}$', error_messages={'invalid': 'OTP must be 6 digits'})


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
        print(data.get('email'))
        try:
            validate_email(data.get('email'))
        except ValidationError:
            return Response({"message": "Invalid email format"}, status=status.HTTP_400_BAD_REQUEST)
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
            if user and user.is_authenticated:
                totp_device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
                if totp_device:
                    otp = data.get('otp')
                    if not otp:
                        return Response({"message": "OTP required for 2FA.", "requires_otp": True}, status=status.HTTP_200_OK)

                    totp = pyotp.TOTP(totp_device.key, digits=6)
                    if not totp.verify(otp.strip()):
                        return Response({"message": "Invalid OTP."}, status=status.HTTP_401_UNAUTHORIZED)
                rotate_token(request) # tie new CSRF token to the user's session and refresh it appropriately
                login(request, user)
                # reset failed login attempts
                user.failed_login_attempts = 0
                user.save()
                # token, created = Token.objects.get_or_create(user=user)
                # return Response({'token': token.key}, status=status.HTTP_200_OK)
                # create JWT token
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }, status=status.HTTP_200_OK)
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
    authentication_classes = (JWTAuthentication,)

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
    authentication_classes = (JWTAuthentication,)

    def put(self, request):
        try:
            serializer = UserChangePasswordSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.update(request.user, serializer.validated_data)
                update_session_auth_hash(request, request.user)
                return Response(status=status.HTTP_204_NO_CONTENT)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            return Response({'detail': e}, status=status.HTTP_400_BAD_REQUEST)


class SearchedLocationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (JWTAuthentication,)

    def get(self, request):
        locations = SearchedLocation.objects.filter(user=request.user)
        serializer = SearchedLocationSerializer(locations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SearchedLocationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RouteView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (JWTAuthentication,)

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

        if not validate_email(email):
            return JsonResponse({'message': 'Invalid email'}, status=400)

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
    # authentication_classes = (JWTAuthentication,)

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
    authentication_classes = (JWTAuthentication,)

    def get(self, request):
        user = request.user
        totp_device = TOTPDevice.objects.filter(user=user, confirmed=False).first()

        if not totp_device:
            secret_key = pyotp.random_base32()
            totp_device = TOTPDevice.objects.create(user=user, key=secret_key, confirmed=False)
        else:
            secret_key = totp_device.key

        totp = pyotp.TOTP(secret_key)
        provisioning_url = totp.provisioning_uri(user.email, issuer_name="WayFinder")

        return Response({"provisioning_url": provisioning_url})


class VerifyTOTP(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTAuthentication,)

    def post(self, request):
        form = OTPForm(request.data)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        otp = form.cleaned_data['otp']
        action = request.data.get('action')

        if action not in ['enable', 'disable']:
            return Response({"detail": "Invalid action. Use 'enable' or 'disable'."}, status=status.HTTP_400_BAD_REQUEST)

        # for enabling 2FA, look for an unconfirmed device; for disabling, look for a confirmed device
        confirmed_status = True if action == 'disable' else False
        totp_device = TOTPDevice.objects.filter(user=user, confirmed=confirmed_status).first()

        if not totp_device:
            device_status = "confirmed" if confirmed_status else "unconfirmed"
            return Response({"detail": f"TOTP device not set up or not {device_status}."}, status=status.HTTP_400_BAD_REQUEST)

        # initialize a TOTP object with the stored base32 key
        totp = pyotp.TOTP(totp_device.key, digits=6)

        # manually verify the OTP
        if not totp.verify(otp.strip()):
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'enable':
            # generating recovery codes
            num_recovery_codes = 10
            recovery_codes = []
            RecoveryCode.objects.filter(user=user, used=False).delete() # remove old recovery codes

            for _ in range(num_recovery_codes):
                recovery_code = RecoveryCode(user=user)
                recovery_code.save()
                recovery_codes.append(recovery_code.code)

            subject = 'Two-Factor Authentication has been enabled on your account'
            message = 'You have successfully enabled Two-Factor Authentication on your account.'
            recipients = [user.email]

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=recipients,
                fail_silently=False,
            )

        totp_device.confirmed = True
        totp_device.save()

        user.is_2fa_enabled = True
        user.save()

        if action == 'disable':
            return Response({"detail": "TOTP device confirmed."})
        else:
            return Response({"detail": "TOTP device confirmed.", "recovery_codes": recovery_codes})


class DisableTOTP(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = (JWTAuthentication,)

    def post(self, request):
        user = request.user

        # check if the user has 2FA enabled
        if not user.is_2fa_enabled:
            return Response({"detail": "2FA is not enabled for this user."}, status=status.HTTP_400_BAD_REQUEST)

        # fetch the confirmed TOTP device for the user
        totp_device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        if not totp_device:
            return Response({"detail": "Confirmed TOTP device not found."}, status=status.HTTP_400_BAD_REQUEST)

        # disable 2FA for the user and delete the TOTP device
        user.is_2fa_enabled = False
        user.save()
        totp_device.delete()

        return Response({"detail": "2FA has been disabled."})


class UseRecoveryCode(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = (SessionAuthentication,)

    def post(self, request):
        data = request.data

        email = data.get('email', '').strip()
        try:
            validate_email(email)
        except ValidationError:
            return Response({"detail": "Invalid email format"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=data.get('email')).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        code = data.get('recovery_code', '').strip()
        if not code.isalnum():
            return Response({"detail": "Invalid recovery code format."}, status=status.HTTP_400_BAD_REQUEST)

        recovery_code = RecoveryCode.objects.filter(code=code, user=user, used=False).first()

        if recovery_code:
            recovery_code.mark_as_used()
            login(request, user)
            user.failed_login_attempts = 0
            user.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'detail': "Recovery successful"}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid or already used recovery code."}, status=status.HTTP_400_BAD_REQUEST)