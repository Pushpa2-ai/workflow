from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs["refresh"]
        return attrs

    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except Exception:
            raise serializers.ValidationError(
                {"refresh": "Invalid or already blacklisted refresh token."}
            )

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ("username", "email", "password", "role")
        read_only_fields = ("role",)

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.role = User.Role.DEVELOPER
        user.set_password(password)
        user.save()

        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "role",
            "is_active",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "username",
            "email",
            "is_active",
            "date_joined",
        )


class UserRoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("role",)

    def validate_role(self, value):
        if value not in User.Role.values:
            raise serializers.ValidationError("Invalid user role.")

        return value

    def validate(self, attrs):
        request = self.context["request"]
        target_user = self.instance

        if target_user == request.user:
            raise serializers.ValidationError(
                "You cannot change your own role."
            )

        if target_user.is_superuser:
            raise serializers.ValidationError(
                "Superuser roles cannot be modified."
            )

        return attrs