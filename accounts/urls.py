from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (RegisterView, DemoLoginView, ProfileView, AdminOnlyView, AdminUserListView, AdminUserRoleUpdateView, LogoutView)


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("demo-login/", DemoLoginView.as_view(), name="demo-login"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("admin-only/", AdminOnlyView.as_view(), name="admin-only"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/<int:pk>/role/", AdminUserRoleUpdateView.as_view(), name="admin-user-role-update"),
    path("logout/", LogoutView.as_view(), name="logout"),
]