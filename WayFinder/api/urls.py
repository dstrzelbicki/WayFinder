from django.urls import path
from . import views
# from django.contrib.auth import views as auth_views
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

    # path('password_reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
    # path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    # path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    # path('reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),

    path('forgotten-password', views.ForgottenPassword.as_view(), name='forgotten_password'),
    path('password-reset', views.ResetPassword.as_view(), name='password_reset'),

    path('setup-totp/', views.SetupTOTP.as_view(), name='setup_totp'),
    path('verify-totp/', views.VerifyTOTP.as_view(), name='verify_totp'),
    path('disable-totp/', views.DisableTOTP.as_view(), name='disable-totp'),
    path('use-recovery-code/', views.UseRecoveryCode.as_view(), name='use_recovery_code'),

    # obtaining, refreshing, and verifying JWT tokens
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]