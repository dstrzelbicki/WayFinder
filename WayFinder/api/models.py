from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin

class AppUserManager(BaseUserManager):
	def create_user(self, email, username, password):
		if not email:
			raise ValueError('email required')
		if not username:
			raise ValueError('username required')
		email = self.normalize_email(email)
		user = self.model(email=email, username=username, password=password)
		user.set_password(password)
		user.save()
		return user
	
	def create_superuser(self, email, password, **extra_fields):
		user = self.create_user(email=self.normalize_email(
email), password=password, **extra_fields)
		user.is_superuser = True
		user.is_admin= True
		user.is_staff = True
		user.save()
		return user


class AppUser(AbstractBaseUser, PermissionsMixin):
	user_id = models.AutoField(primary_key=True)
	email = models.EmailField(max_length=50, unique=True)
	username = models.CharField(max_length=50)
	is_admin = models.BooleanField(default=False)
	is_superuser = models.BooleanField(default=False)
	is_staff = models.BooleanField(default=False)
	USERNAME_FIELD = 'email'
	REQUIRED_FIELDS = []
	objects = AppUserManager()
	def __str__(self):
		return self.username