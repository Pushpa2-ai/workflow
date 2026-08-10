from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    message = "Admin access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsProjectManager(BasePermission):
    message = "Project Manager access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "PROJECT_MANAGER"
        )


class IsDeveloper(BasePermission):
    message = "Developer access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "DEVELOPER"
        )


class IsViewer(BasePermission):
    message = "Viewer access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "VIEWER"
        )


class HasRole(BasePermission):
    allowed_roles = []

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in self.allowed_roles
        )

class IsAdminOrProjectManager(HasRole):
    allowed_roles = [
        "ADMIN",
        "PROJECT_MANAGER",
    ]


class IsAdminOrProjectManagerOrDeveloper(HasRole):
    allowed_roles = [
        "ADMIN",
        "PROJECT_MANAGER",
        "DEVELOPER",
    ]