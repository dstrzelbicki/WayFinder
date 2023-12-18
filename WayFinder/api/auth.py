import hashlib
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model

class EncryptedEmailBackend(BaseBackend):
    def authenticate(self, request, email=None, password=None):
        UserModel = get_user_model()
        email_hash = hashlib.sha256(email.encode()).hexdigest()
        try:
            user = UserModel.objects.get(email_hash=email_hash)
            if user.check_password(password):
                return user
        except UserModel.DoesNotExist:
            return None

    def get_user(self, user_id):
        UserModel = get_user_model()
        try:
            return UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None