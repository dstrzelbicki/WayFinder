from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
import secrets


class AppUserManager(BaseUserManager):
    def create_user(self, email, username, password=None): # def create_user(self, email, username, first_name, last_name, password=None):
        if not email:
            raise ValueError('An email is required.')
        if not password:
            raise ValueError('A password is required.')
        if not username:
            raise ValueError('A username is required.')
        # if not first_name:
        #     raise ValueError('A first name is required.')
        # if not last_name:
        #     raise ValueError('A last name is required.')
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            username=username)
            # first_name=first_name,
            # last_name=last_name)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, username, password=None):
        user = self.create_user(email, username, password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return user


class AppUser(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True) # changed this field's name to 'id' because its needed for the JWT token creation in UserLogin view
    email = models.EmailField(max_length=50, unique=True)
    username = models.CharField(max_length=50, unique=True)
    # first_name = models.CharField(max_length=50, blank=False)
    # last_name = models.CharField(max_length=50, blank=False)
    is_active = models.BooleanField(default=True)
    # is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    failed_login_attempts = models.IntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True)
    is_2fa_enabled = models.BooleanField(default=False)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    objects = AppUserManager()

    def __str__(self):
        return self.username


class Route(models.Model):
    route_id = models.AutoField(primary_key=True)
    start_location_name = models.CharField(max_length=200)
    start_location_lat = models.DecimalField(max_digits=9, decimal_places=7)
    start_location_lng = models.DecimalField(max_digits=9, decimal_places=7)
    end_location_name = models.CharField(max_length=200)
    end_location_lat = models.DecimalField(max_digits=9, decimal_places=7)
    end_location_lng = models.DecimalField(max_digits=9, decimal_places=7)
    distance = models.DecimalField(max_digits=9, decimal_places=2)
    duration = models.DurationField()
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE)
    saved = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Route'
        verbose_name_plural = 'Routes'

    def __str__(self):
        return f"{self.start_location_name} to {self.end_location_name}"


class SearchedLocation(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    lat = models.DecimalField(max_digits=9, decimal_places=7)
    lng = models.DecimalField(max_digits=9, decimal_places=7)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE)

    class Meta:
        verbose_name = 'Searched Location'
        verbose_name_plural = 'Searched Locations'

    def __str__(self):
        return f"{self.name}"

class RecoveryCode(models.Model):
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='recovery_codes')
    code = models.CharField(max_length=10, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = secrets.token_hex(5)
        super(RecoveryCode, self).save(*args, **kwargs)

    def mark_as_used(self):
        self.used = True
        self.save()