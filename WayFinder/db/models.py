from django.db import models

from django.db import models
class User(models.Model):
    login = models.CharField(max_length=80)
