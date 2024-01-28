from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
from .models import Route, FavRoute, SearchedLocation

UserModel = get_user_model()


class UserRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(validators=[validate_email])
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = UserModel
        fields = ['email', 'username', 'password']

    def validate_password(self, value):
        # validate the password against Django's built-in validators as well as custom validators
        validate_password(value, self.instance)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = UserModel.objects.create_user(**validated_data, password=password)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def check_user(self, clean_data):
        user = authenticate(username=clean_data['email'], password=clean_data['password'])
        if not user:
            return ValidationError('invalid credentials')
        return user


class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(validators=[validate_email])

    class Meta:
        model = UserModel
        fields = ('email', 'username', 'is_2fa_enabled')
        # fields = ('email', 'username', 'first_name', 'last_name')


class UserChangePasswordSerializer(serializers.Serializer):
    model = get_user_model()
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('old password is not correct')
        return value

    def validate_new_password(self, value):
        user = self.context['request'].user
        validate_password(value, user=user)
        return value

    def update(self, instance, validated_data):
        instance.set_password(validated_data['new_password'])
        instance.save()
        return instance


class RouteSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = Route
        fields = [
            'route_id',
            'start_location_name',
            'start_location_lat',
            'start_location_lng',
            'end_location_name',
            'end_location_lat',
            'end_location_lng',
            'distance',
            'duration',
            'created_at',
            'user',
        ]


class FavRouteSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = FavRoute
        fields = [
            'id',
            'name',
            'data',
            'user',
        ]


class SearchedLocationSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = SearchedLocation
        fields = [
            'id',
            'name',
            'lat',
            'lng',
            'created_at',
            'user',
        ]