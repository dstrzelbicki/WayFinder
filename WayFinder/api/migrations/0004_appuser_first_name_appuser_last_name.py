# Generated by Django 4.2.1 on 2023-06-03 07:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_alter_appuser_username'),
    ]

    operations = [
        migrations.AddField(
            model_name='appuser',
            name='first_name',
            field=models.CharField(default='Jan', max_length=50),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='appuser',
            name='last_name',
            field=models.CharField(default='Kowalski', max_length=50),
            preserve_default=False,
        ),
    ]