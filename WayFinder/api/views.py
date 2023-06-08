from django.contrib.auth import login, logout, update_session_auth_hash, get_user_model
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
            if serializer.check_user(serializer.validated_data) != ValidationError('invalid credentials'):
                login(request, user)
                # reset failed login attempts
                user.failed_login_attempts = 0
                user.save()
                return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
            else:
                # increment failed login attempts
                user.failed_login_attempts += 1
                user.last_failed_login = datetime.now()
                user.save()
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogout(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_200_OK)


class UserView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (SessionAuthentication,)

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
    authentication_classes = (SessionAuthentication,)

    def put(self, request):
        serializer = UserChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.update(request.user, serializer.validated_data)
            update_session_auth_hash(request, request.user)
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RouteView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (SessionAuthentication,)

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
