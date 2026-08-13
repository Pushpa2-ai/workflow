from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .permissions import IsAdmin
from .serializers import (
    UserRegistrationSerializer,
    UserRoleUpdateSerializer,
    UserSerializer,
    LogoutSerializer,
)
from rest_framework import status

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class DemoLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            user = User.objects.get(
                username="demo",
                is_active=True,
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Demo user is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.is_active:
            return Response(
                {"detail": "Your account is inactive."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            }
        )

class AdminOnlyView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(
            {
                "message": "You have admin access.",
                "role": request.user.role,
            }
        )

class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by("-date_joined")


class AdminUserRoleUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserRoleUpdateSerializer
    queryset = User.objects.all()
    http_method_names = ["patch"]

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "Successfully logged out."},
            status=status.HTTP_200_OK,
        )