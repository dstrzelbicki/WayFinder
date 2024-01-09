import hashlib
from django.conf import settings
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.db import IntegrityError
from django.http import HttpResponse
from django.utils.encoding import force_str, force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.core.mail import send_mail
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, update_session_auth_hash, get_user_model
from django.forms import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import (FavRouteSerializer, UserRegisterSerializer, UserLoginSerializer,
                          UserSerializer, UserChangePasswordSerializer, RouteSerializer,
                          SearchedLocationSerializer)
from rest_framework import permissions, status
from .validations import custom_validation
from django.contrib.auth.password_validation import validate_password
from datetime import timedelta, timezone
from django.core.cache import cache
from .models import Route, RecoveryCode, SearchedLocation
from rest_framework.authtoken.models import Token
import pyotp
from django_otp.plugins.otp_totp.models import TOTPDevice
from django import forms
from django.core.validators import validate_email
from django.middleware.csrf import rotate_token
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django.utils import timezone
import logging

token_generator = PasswordResetTokenGenerator()

current_time = timezone.now()

User = get_user_model()

logger = logging.getLogger(__name__)

class Anon5dThrottle(AnonRateThrottle):
    rate = '5/day'

class Anon10hThrottle(AnonRateThrottle):
    rate = '10/hour'

class Anon5hThrottle(AnonRateThrottle):
    rate = '5/hour'

class User3hThrottle(UserRateThrottle):
    rate = '3/hour'

class User5hThrottle(UserRateThrottle):
    rate = '5/hour'

class User3dThrottle(UserRateThrottle):
    rate = '3/day'

class User10hThrottle(UserRateThrottle):
    rate = '10/hour'


class OTPForm(forms.Form):
    otp = forms.RegexField(regex=r'^\d{6}$', error_messages={'invalid': 'OTP must be 6 digits'})


class UserRegister(APIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [Anon10hThrottle]

    def post(self, request):
        try:
            clean_data = custom_validation(request.data)
        except ValidationError as e:
            logger.error(f'Validation error: {e.messages}')
            return Response({'message': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = UserRegisterSerializer(data=clean_data)
        if serializer.is_valid():
            try:
                user = serializer.save()
            except IntegrityError as e:
                logger.error(f'Integrity error during user registration: {e}')
                return Response({'message': 'Username or email already used'}, status=status.HTTP_409_CONFLICT)

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
        logger.error('Invalid request data')
        return Response({'message': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)


class UserLogin(APIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [Anon10hThrottle]

    RATE_LIMIT = 5
    RATE_LIMIT_TIMEOUT = 60

    def post(self, request):
        data = request.data
        ip = request.META.get('REMOTE_ADDR')
        email = data.get('email')

        # generate a unique key for rate limiting based on IP and email
        rate_limit_key = f'login_attempt_{hashlib.sha256((ip + email).encode()).hexdigest()}'

        current_attempts = cache.get(rate_limit_key, 0)
        # check for rate limiting
        if current_attempts >= UserLogin.RATE_LIMIT:
            return Response({"message": "Too many login attempts, please try again later"},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        try:
            validate_email(data.get('email'))
        except ValidationError:
            logger.error(f'Invalid email format: {email}')
            return Response({"message": "Invalid email format"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(data.get('password'))
        except ValidationError as e:
            logger.error(f'Invalid password: {e.messages}')
            return Response({"message": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST)

        # check for failed login attempts
        email_hash = hashlib.sha256(data.get('email').encode()).hexdigest()
        user = User.objects.filter(email_hash=email_hash).first()
        if user:
            if user.failed_login_attempts >= 10 and \
                    (current_time - user.last_failed_login) < timedelta(minutes=60):
                return Response({"message": "Too many failed login attempts, please wait"},
                                status=status.HTTP_429_TOO_MANY_REQUESTS)

        serializer = UserLoginSerializer(data=data)
        if serializer.is_valid():
            user = authenticate(request,
                                email=data['email'],
                                password=data['password'])
            if user and user.is_authenticated:
                cache.set(rate_limit_key, 0, UserLogin.RATE_LIMIT_TIMEOUT)
                totp_device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
                if totp_device:
                    otp = data.get('otp')
                    if not otp:
                        return Response({"message": "OTP required for 2FA", "requires_otp": True}, status=status.HTTP_200_OK)

                    totp = pyotp.TOTP(totp_device.key, digits=6)
                    if not totp.verify(otp.strip()):
                        return Response({"message": "Invalid OTP"}, status=status.HTTP_401_UNAUTHORIZED)
                rotate_token(request)
                login(request, user)
                # reset failed login attempts
                user.failed_login_attempts = 0
                user.save()
                # create JWT token
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }, status=status.HTTP_200_OK)
            else:
                # increment failed login attempts
                user = User.objects.filter(email_hash=email_hash).first()
                cache.set(rate_limit_key, current_attempts + 1, UserLogin.RATE_LIMIT_TIMEOUT)
                user.failed_login_attempts += 1
                user.last_failed_login = current_time
                user.save()
        return Response({'message': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)


class UserLogout(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_200_OK)


class UserView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (JWTAuthentication,)

    def get_throttles(self):
        if self.request.method.lower() == 'put':
            return [User10hThrottle()]
        return []

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({'user': serializer.data}, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f'Invalid request data: {serializer.errors}')
        return Response({'message': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)


class UserChangePassword(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (JWTAuthentication,)
    throttle_classes = [User5hThrottle]

    def put(self, request):
        try:
            serializer = UserChangePasswordSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.update(request.user, serializer.validated_data)
                update_session_auth_hash(request, request.user)
                return Response(status=status.HTTP_204_NO_CONTENT)
            logger.error(f'Invalid request data: {serializer.errors}')
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            logger.error(f'Invalid request data: {e.messages}')
            return Response({'message': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)


class SearchedLocationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (JWTAuthentication,)

    def get(self, request):
        locations = SearchedLocation.objects.filter(user=request.user)
        if not locations:
            return Response({'message': 'No locations found'},
                            status=status.HTTP_404_NOT_FOUND)
        serializer = SearchedLocationSerializer(locations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SearchedLocationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f'Invalid request data: {serializer.errors}')
        return Response({'message': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)


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
        logger.error(f'Invalid request data: {serializer.errors}')
        return Response({'message': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)


class ForgottenPassword(APIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [Anon5dThrottle]

    def post(self, request):
        email = request.data.get('email')

        try:
            validate_email(email)
        except ValidationError:
            logger.error(f'Invalid email format: {email}')
            return Response({'message': 'Invalid email format'}, status=status.HTTP_400_BAD_REQUEST)

        # check if the user with the provided email exists
        email_hash = hashlib.sha256(email.encode()).hexdigest()
        try:
            user = User.objects.get(email_hash=email_hash)
        except User.DoesNotExist:
            logger.error(f'User does not exist: {email}')
            return JsonResponse({'message': 'User does not exist'}, status=404)

        # generate a reset token
        token = token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.id))

        # prepare the email content
        subject = 'WayFinder - Password Reset'
        message = f'Click the link to reset your password: https://wayfinder.projektstudencki.pl//reset-password/{uidb64}/{token}'
        from_email = 'wayfinder.no.response@gmail.com'
        recipient_list = [email]

        # send the email
        try:
            send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        except Exception as e:
            logger.error(f'Error while sending email: {e}')
            return JsonResponse({'message': 'Error while sending email'}, status=500)

        return JsonResponse({'message': 'Email sent successfully'}, status=200)


class ResetPassword(APIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [User3dThrottle]

    def post(self, request):
        token = request.data.get('token')
        password = request.data.get('password')
        uidb64 = request.data.get('uidb64')

        # validate password with all AUTH_PASSWORD_VALIDATORS
        try:
            validate_password(password)
        except ValidationError as e:
            logger.error(f'Invalid password: {e.messages}')
            return HttpResponse('Invalid password', status=422)

        # decode uidb64 and get the user
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = get_user_model().objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):
            logger.error(f'Invalid uidb64: {uidb64}')
            user = None

        # check if the user exists and the token is valid
        if user and token_generator.check_token(user, token):
            # set new password
            user.set_password(password)
            user.save()
            return HttpResponse('Password reset successful', status=204)
        else:
            if user:
                return HttpResponse('Invalid or expired token', status=400)
            else:
                return HttpResponse('User not found', status=404)


class SetupTOTP(APIView):
    permission_classes = [permissions.IsAuthenticated]
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
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = (JWTAuthentication,)
    throttle_classes = [User10hThrottle]

    def post(self, request):
        form = OTPForm(request.data)
        if not form.is_valid():
            logger.error(f'Invalid OTP: {form.errors}')
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        otp = form.cleaned_data['otp']
        action = request.data.get('action')

        if action not in ['enable', 'disable']:
            return Response({"detail": "Invalid action. Use 'enable' or 'disable'"}, status=status.HTTP_400_BAD_REQUEST)

        # for enabling 2FA, look for an unconfirmed device; for disabling, look for a confirmed device
        confirmed_status = True if action == 'disable' else False
        totp_device = TOTPDevice.objects.filter(user=user, confirmed=confirmed_status).first()

        if not totp_device:
            device_status = "confirmed" if confirmed_status else "unconfirmed"
            return Response({"detail": f"TOTP device not set up or not {device_status}"}, status=status.HTTP_400_BAD_REQUEST)

        # initialize a TOTP object with the stored base32 key
        totp = pyotp.TOTP(totp_device.key, digits=6)

        # manually verify the OTP
        if not totp.verify(otp.strip()):
            return Response({"detail": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

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
            return Response({"detail": "TOTP device confirmed"})
        else:
            return Response({"detail": "TOTP device confirmed", "recovery_codes": recovery_codes})


class DisableTOTP(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = (JWTAuthentication,)
    throttle_classes = [User3hThrottle]

    def post(self, request):
        user = request.user

        # check if the user has 2FA enabled
        if not user.is_2fa_enabled:
            return Response({"detail": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)

        # fetch the confirmed TOTP device for the user
        totp_device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        if not totp_device:
            return Response({"detail": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)

        # disable 2FA for the user and delete the TOTP device
        user.is_2fa_enabled = False
        user.save()
        totp_device.delete()

        return Response({"detail": "2FA has been disabled"})


class UseRecoveryCode(APIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [Anon5hThrottle]

    def post(self, request):
        data = request.data

        email = data.get('email', '').strip()
        try:
            validate_email(email)
        except ValidationError:
            logger.error(f'Invalid email format: {email}')
            return Response({"detail": "Invalid email format"}, status=status.HTTP_400_BAD_REQUEST)

        email_hash = hashlib.sha256(email.encode()).hexdigest()
        user = User.objects.filter(email_hash=email_hash).first()
        if not user:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        code = data.get('recovery_code', '').strip()
        if not code.isalnum():
            return Response({"detail": "Invalid recovery code"}, status=status.HTTP_400_BAD_REQUEST)

        recovery_code = RecoveryCode.objects.filter(code=code, user=user, used=False).first()

        if recovery_code:
            recovery_code.mark_as_used()
            login(request, user)
            user.failed_login_attempts = 0
            user.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'detail': "Recovery successful"}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid or already used recovery code"}, status=status.HTTP_400_BAD_REQUEST)


class FavRouteView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (JWTAuthentication,)

    def get(self, request):
        user = request.user
        fav_routes = user.favroute_set.all()
        if not fav_routes:
            return Response({"message": "No favourite routes found"},
                            status=status.HTTP_404_NOT_FOUND)
        serializer = FavRouteSerializer(fav_routes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = FavRouteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f'Invalid request data: {serializer.errors}')
        return Response({"message": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)