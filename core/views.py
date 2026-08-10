from django.db import models
from rest_framework import generics
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.cache import cache

from .models import (
    Team,
    TeamMember,
    Project,
    ProjectMember,
    Issue,
    Workflow,
    WorkflowActivity,
    WorkflowMember,
    WorkflowComment,
    WorkflowAttachment,
)

from .pagination import WorkflowPagination
from .permissions import CanManageWorkflow

from .serializers import (
    TeamSerializer,
    TeamMemberSerializer,
    ProjectSerializer,
    ProjectMemberSerializer,
    IssueSerializer,
    WorkflowActivitySerializer,
    WorkflowMemberSerializer,
    WorkflowSerializer,
    WorkflowCommentSerializer,
    WorkflowAttachmentSerializer,
)


class HealthCheckView(APIView):
    permission_classes = []

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "workflow-backend",
            }
        )


# =========================================================
# TEAMS
# =========================================================

class TeamCreateView(generics.CreateAPIView):
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        team = serializer.save(
            owner=self.request.user
        )

        TeamMember.objects.get_or_create(
            team=team,
            user=self.request.user,
        )


class TeamListView(generics.ListAPIView):
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Team.objects.filter(
            members__user=self.request.user
        ).distinct()


class TeamDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Team.objects.filter(
            members__user=self.request.user
        ).distinct()

    def perform_update(self, serializer):
        team = self.get_object()

        if (
            team.owner_id != self.request.user.id
            and not self.request.user.is_superuser
            and self.request.user.role
            not in ["ADMIN", "PROJECT_MANAGER"]
        ):
            raise PermissionDenied(
                "You cannot modify this team."
            )

        serializer.save()

    def perform_destroy(self, instance):
        if (
            instance.owner_id != self.request.user.id
            and not self.request.user.is_superuser
            and self.request.user.role
            not in ["ADMIN", "PROJECT_MANAGER"]
        ):
            raise PermissionDenied(
                "You cannot delete this team."
            )

        instance.delete()


class TeamMemberListView(generics.ListAPIView):
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TeamMember.objects.filter(
            team_id=self.kwargs["pk"],
            team__members__user=self.request.user,
        ).distinct()


class TeamMemberAddView(generics.CreateAPIView):
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        team = Team.objects.get(
            pk=self.kwargs["pk"]
        )

        user = self.request.user

        can_manage = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or team.owner_id == user.id
        )

        if not can_manage:
            raise PermissionDenied(
                "You cannot manage this team."
            )

        serializer.save(team=team)


class TeamMemberRemoveView(generics.DestroyAPIView):
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        team = Team.objects.get(
            pk=self.kwargs["team_pk"]
        )

        user = self.request.user

        can_manage = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or team.owner_id == user.id
        )

        if not can_manage:
            return TeamMember.objects.none()

        return TeamMember.objects.filter(
            team=team
        )


# =========================================================
# PROJECTS
# =========================================================

class ProjectCreateView(generics.CreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        team_id = self.request.data.get("team")

        try:
            team = Team.objects.get(
                pk=team_id
            )
        except Team.DoesNotExist:
            raise PermissionDenied(
                "Team does not exist."
            )

        user = self.request.user

        is_team_member = TeamMember.objects.filter(
            team=team,
            user=user,
        ).exists()

        can_manage = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or team.owner_id == user.id
        )

        if not (is_team_member or can_manage):
            raise PermissionDenied(
                "You must belong to the team "
                "to create a project."
            )

        project = serializer.save(
            owner=user,
            team=team,
        )
        cache.clear()

        ProjectMember.objects.get_or_create(
            project=project,
            user=user,
        )


class ProjectListView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(
            members__user=self.request.user
        ).distinct()

    def list(self, request, *args, **kwargs):
        cache_key = f"projects:user:{request.user.id}"

        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(
            self.get_queryset()
        )

        serializer = self.get_serializer(
            queryset,
            many=True,
        )

        data = serializer.data

        cache.set(
            cache_key,
            data,
            300,
        )

        return Response(data)

class ProjectDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return Project.objects.filter(
            models.Q(members__user=user)
            | models.Q(owner=user)
        ).distinct()

    def perform_update(self, serializer):
        project = self.get_object()

        user = self.request.user

        can_manage = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or project.owner_id == user.id
        )

        if not can_manage:
            raise PermissionDenied(
                "You cannot modify this project."
            )

        serializer.save()
        cache.clear()

    def perform_destroy(self, instance):
        user = self.request.user

        can_manage = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or instance.owner_id == user.id
        )

        if not can_manage:
            raise PermissionDenied(
                "You cannot delete this project."
            )
        
        cache.clear()

        instance.delete()


class ProjectMemberListView(generics.ListAPIView):
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project = Project.objects.get(
            pk=self.kwargs["pk"]
        )

        user = self.request.user

        can_view = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or project.owner_id == user.id
            or project.members.filter(
                user_id=user.id
            ).exists()
        )

        if not can_view:
            return ProjectMember.objects.none()

        return ProjectMember.objects.filter(
            project=project
        )


class ProjectMemberAddView(generics.CreateAPIView):
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        project = Project.objects.get(
            pk=self.kwargs["pk"]
        )

        user = self.request.user

        can_manage = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or project.owner_id == user.id
        )

        if not can_manage:
            raise PermissionDenied(
                "You cannot manage project members."
            )

        serializer.save(
            project=project
        )


class ProjectMemberRemoveView(
    generics.DestroyAPIView
):
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project = Project.objects.get(
            pk=self.kwargs["project_pk"]
        )

        user = self.request.user

        can_manage = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or project.owner_id == user.id
        )

        if not can_manage:
            return ProjectMember.objects.none()

        return ProjectMember.objects.filter(
            project=project
        )


# =========================================================
# EXISTING WORKFLOW SYSTEM
# =========================================================

class WorkflowCreateView(generics.CreateAPIView):
    serializer_class = WorkflowSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        workflow = serializer.save(
            owner=self.request.user
        )

        WorkflowActivity.objects.create(
            workflow=workflow,
            actor=self.request.user,
            action="WORKFLOW_CREATED",
            details="Workflow created.",
        )

        if workflow.assigned_to:
            WorkflowActivity.objects.create(
                workflow=workflow,
                actor=self.request.user,
                action="WORKFLOW_ASSIGNED",
                details=(
                    f"Workflow assigned to "
                    f"{workflow.assigned_to.username}."
                ),
            )


class WorkflowListView(generics.ListAPIView):
    serializer_class = WorkflowSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = WorkflowPagination

    def get_queryset(self):
        queryset = Workflow.objects.filter(
            owner=self.request.user
        )

        status = self.request.query_params.get("status")
        priority = self.request.query_params.get("priority")
        search = self.request.query_params.get("search")

        if status:
            queryset = queryset.filter(status=status)

        if priority:
            queryset = queryset.filter(priority=priority)

        if search:
            queryset = queryset.filter(
                name__icontains=search
            )

        sort = self.request.query_params.get("sort")

        allowed_sort_fields = {
            "name": "name",
            "-name": "-name",
            "priority": "priority",
            "-priority": "-priority",
            "created_at": "created_at",
            "-created_at": "-created_at",
            "due_date": "due_date",
            "-due_date": "-due_date",
        }

        if sort in allowed_sort_fields:
            queryset = queryset.order_by(
                allowed_sort_fields[sort]
            )

        return queryset


class WorkflowDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = WorkflowSerializer
    permission_classes = [
        IsAuthenticated,
        CanManageWorkflow,
    ]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        return Workflow.objects.all()

    def perform_update(self, serializer):
        old_instance = self.get_object()

        old_status = old_instance.status
        old_assigned_to = old_instance.assigned_to

        workflow = serializer.save()

        new_status = workflow.status
        new_assigned_to = workflow.assigned_to

        if old_status != new_status:
            WorkflowActivity.objects.create(
                workflow=workflow,
                actor=self.request.user,
                action="WORKFLOW_STATUS_CHANGED",
                details=(
                    f"Status changed from "
                    f"{old_status} to {new_status}."
                ),
            )

        if old_assigned_to != new_assigned_to:
            if new_assigned_to:
                details = (
                    f"Workflow assigned to "
                    f"{new_assigned_to.username}."
                )
            else:
                details = "Workflow assignment removed."

            WorkflowActivity.objects.create(
                workflow=workflow,
                actor=self.request.user,
                action="WORKFLOW_ASSIGNED",
                details=details,
            )

        if (
            old_status == new_status
            and old_assigned_to == new_assigned_to
        ):
            WorkflowActivity.objects.create(
                workflow=workflow,
                actor=self.request.user,
                action="WORKFLOW_UPDATED",
                details="Workflow updated.",
            )

    def perform_destroy(self, instance):
        WorkflowActivity.objects.create(
            workflow=instance,
            actor=self.request.user,
            action="WORKFLOW_DELETED",
            details="Workflow deleted.",
        )

        instance.delete()


class WorkflowMemberListView(generics.ListAPIView):
    serializer_class = WorkflowMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkflowMember.objects.filter(
            workflow_id=self.kwargs["pk"]
        )


class WorkflowActivityListView(generics.ListAPIView):
    serializer_class = WorkflowActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkflowActivity.objects.filter(
            workflow_id=self.kwargs["pk"]
        )


class WorkflowCommentListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = WorkflowCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkflowComment.objects.filter(
            workflow_id=self.kwargs["pk"]
        )

    def perform_create(self, serializer):
        workflow = Workflow.objects.get(
            pk=self.kwargs["pk"]
        )

        comment = serializer.save(
            workflow=workflow,
            author=self.request.user,
        )

        WorkflowActivity.objects.create(
            workflow=workflow,
            actor=self.request.user,
            action="COMMENT_ADDED",
            details="A new comment was added.",
        )


class WorkflowCommentDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = WorkflowCommentSerializer
    permission_classes = [IsAuthenticated]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        return WorkflowComment.objects.filter(
            author=self.request.user
        )

    def perform_update(self, serializer):
        comment = serializer.save()

        WorkflowActivity.objects.create(
            workflow=comment.workflow,
            actor=self.request.user,
            action="COMMENT_UPDATED",
            details="A comment was updated.",
        )

    def perform_destroy(self, instance):
        workflow = instance.workflow

        WorkflowActivity.objects.create(
            workflow=workflow,
            actor=self.request.user,
            action="COMMENT_DELETED",
            details="A comment was deleted.",
        )

        instance.delete()


class WorkflowAttachmentListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = WorkflowAttachmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkflowAttachment.objects.filter(
            workflow_id=self.kwargs["pk"]
        )

    def perform_create(self, serializer):
        workflow = Workflow.objects.get(
            pk=self.kwargs["pk"]
        )

        attachment = serializer.save(
            workflow=workflow,
            uploaded_by=self.request.user,
        )

        WorkflowActivity.objects.create(
            workflow=workflow,
            actor=self.request.user,
            action="ATTACHMENT_ADDED",
            details=(
                f"Attachment added: "
                f"{attachment.file_name}."
            ),
        )


class WorkflowAttachmentDetailView(
    generics.RetrieveDestroyAPIView
):
    serializer_class = WorkflowAttachmentSerializer
    permission_classes = [IsAuthenticated]

    http_method_names = [
        "get",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        return WorkflowAttachment.objects.filter(
            uploaded_by=self.request.user
        )

    def perform_destroy(self, instance):
        workflow = instance.workflow

        WorkflowActivity.objects.create(
            workflow=workflow,
            actor=self.request.user,
            action="ATTACHMENT_DELETED",
            details=(
                f"Attachment deleted: "
                f"{instance.file_name}."
            ),
        )

        instance.delete()


class WorkflowMemberAddView(generics.CreateAPIView):
    serializer_class = WorkflowMemberSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        workflow = Workflow.objects.get(
            pk=self.kwargs["pk"]
        )

        user = self.request.user

        can_manage = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or workflow.owner_id == user.id
        )

        if not can_manage:
            raise PermissionDenied(
                "You cannot manage workflow members."
            )

        serializer.save(
            workflow=workflow
        )


class WorkflowMemberRemoveView(
    generics.DestroyAPIView
):
    serializer_class = WorkflowMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        workflow = Workflow.objects.get(
            pk=self.kwargs["workflow_pk"]
        )

        user = self.request.user

        can_manage = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or workflow.owner_id == user.id
        )

        if not can_manage:
            return WorkflowMember.objects.none()

        return WorkflowMember.objects.filter(
            workflow=workflow
        )

    def perform_destroy(self, instance):
        workflow = instance.workflow
        username = instance.user.username

        WorkflowActivity.objects.create(
            workflow=workflow,
            actor=self.request.user,
            action="MEMBER_REMOVED",
            details=(
                f"Member {username} "
                f"was removed from the workflow."
            ),
        )

        instance.delete()

class IssueListCreateView(generics.ListCreateAPIView):
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project = Project.objects.get(
            pk=self.kwargs["project_pk"]
        )

        user = self.request.user

        can_view = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or project.owner_id == user.id
            or project.members.filter(
                user_id=user.id
            ).exists()
        )

        if not can_view:
            return Issue.objects.none()

        return Issue.objects.filter(
            project=project
        )
    
    def list(self, request, *args, **kwargs):
        project_id = self.kwargs["project_pk"]

        cache_key = f"issues:project:{project_id}"

        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(
            self.get_queryset()
        )

        serializer = self.get_serializer(
            queryset,
            many=True,
        )

        data = serializer.data

        cache.set(
            cache_key,
            data,
            300,
        )

        return Response(data)

    def perform_create(self, serializer):
        project = Project.objects.get(
            pk=self.kwargs["project_pk"]
        )

        user = self.request.user

        can_create = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or project.owner_id == user.id
            or project.members.filter(
                user_id=user.id
            ).exists()
        )

        if not can_create:
            raise PermissionDenied(
                "You do not have access to this project."
            )

        serializer.save(
            project=project,
            created_by=user,
        )

        cache.clear()

class IssueDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        project = Project.objects.get(
            pk=self.kwargs["project_pk"]
        )

        user = self.request.user

        can_view = (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "PROJECT_MANAGER",
            ]
            or project.owner_id == user.id
            or project.members.filter(
                user_id=user.id
            ).exists()
        )

        if not can_view:
            return Issue.objects.none()

        return Issue.objects.filter(
            project=project
        )

    def perform_update(self, serializer):
        issue = serializer.save()

        cache.clear()

    def perform_destroy(self, instance):
        project_id = instance.project_id

        cache.clear()

        instance.delete()

class RedisHealthCheckView(APIView):
        permission_classes = []

        def get(self, request):
            try:
                cache.set("redis_health_check", "ok", 10)
                value = cache.get("redis_health_check")

                if value == "ok":
                    return Response(
                        {
                            "status": "ok",
                            "redis": "connected",
                        }
                    )

                return Response(
                    {
                        "status": "error",
                        "redis": "not responding",
                    },
                    status=503,
                )

            except Exception as exc:
                return Response(
                    {
                        "status": "error",
                        "redis": "disconnected",
                        "detail": str(exc),
                    },
                    status=503,
                )