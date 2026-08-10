from rest_framework.permissions import BasePermission


class CanManageWorkflow(BasePermission):
    message = "You do not have permission to manage this workflow."

    def has_object_permission(self, request, view, obj):
        user = request.user

        if not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        if user.role in ["ADMIN", "PROJECT_MANAGER"]:
            return True

        if obj.owner_id == user.id:
            return True

        if obj.assigned_to_id == user.id:
            return request.method in ["GET", "PATCH"]

        return obj.members.filter(id=user.id).exists() and request.method == "GET"