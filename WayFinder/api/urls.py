from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)

urlpatterns = [
    path('register', views.UserRegister.as_view(), name='register'),
    path('login', views.UserLogin.as_view(), name='login'),
    path('logout', views.UserLogout.as_view(), name='logout'),
    path('user', views.UserView.as_view(), name='user'),
    path('change-password', views.UserChangePassword.as_view(), name='change_password'),
    path('route', views.RouteView.as_view(), name='route'),
    path('location', views.SearchedLocationView.as_view(), name='location'),

    path('forgotten-password', views.ForgottenPassword.as_view(), name='forgotten_password'),
    path('password-reset', views.ResetPassword.as_view(), name='password_reset'),

    path('setup-totp/', views.SetupTOTP.as_view(), name='setup_totp'),
    path('verify-totp/', views.VerifyTOTP.as_view(), name='verify_totp'),
    path('disable-totp/', views.DisableTOTP.as_view(), name='disable-totp'),
    path('use-recovery-code/', views.UseRecoveryCode.as_view(), name='use_recovery_code'),

    # refreshing, and verifying JWT tokens
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]