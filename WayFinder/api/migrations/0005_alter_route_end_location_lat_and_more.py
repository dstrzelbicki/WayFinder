# Generated by Django 4.2.1 on 2023-10-23 14:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_remove_appuser_is_admin'),
    ]

    operations = [
        migrations.AlterField(
            model_name='route',
            name='end_location_lat',
            field=models.DecimalField(decimal_places=7, max_digits=9),
        ),
        migrations.AlterField(
            model_name='route',
            name='end_location_lng',
            field=models.DecimalField(decimal_places=7, max_digits=9),
        ),
        migrations.AlterField(
            model_name='route',
            name='start_location_lat',
            field=models.DecimalField(decimal_places=7, max_digits=9),
        ),
        migrations.AlterField(
            model_name='route',
            name='start_location_lng',
            field=models.DecimalField(decimal_places=7, max_digits=9),
        ),
    ]