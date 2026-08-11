from django.contrib.auth import get_user_model
from rest_framework import serializers

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
    Notification,
)


User = get_user_model()


class TeamMemberSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(
        source="user.username"
    )

    class Meta:
        model = TeamMember
        fields = (
            "id",
            "user",
            "username",
            "joined_at",
        )
        read_only_fields = (
            "id",
            "username",
            "joined_at",
        )


class TeamSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(
        source="owner.username"
    )

    class Meta:
        model = Team
        fields = (
            "id",
            "name",
            "description",
            "owner",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "owner",
            "created_at",
            "updated_at",
        )

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Team name cannot be empty."
            )

        if len(value) < 3:
            raise serializers.ValidationError(
                "Team name must contain at least 3 characters."
            )

        return value


class ProjectMemberSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(
        source="user.username"
    )

    class Meta:
        model = ProjectMember
        fields = (
            "id",
            "user",
            "username",
            "joined_at",
        )
        read_only_fields = (
            "id",
            "username",
            "joined_at",
        )


class ProjectSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(
        source="owner.username"
    )

    team_name = serializers.ReadOnlyField(
        source="team.name"
    )

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "description",
            "team",
            "team_name",
            "owner",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "owner",
            "team_name",
            "created_at",
            "updated_at",
        )

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Project name cannot be empty."
            )

        if len(value) < 3:
            raise serializers.ValidationError(
                "Project name must contain at least 3 characters."
            )

        return value


class IssueSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(
        source="project.name"
    )

    assignee_username = serializers.ReadOnlyField(
        source="assignee.username"
    )

    created_by = serializers.ReadOnlyField(
        source="created_by.username"
    )

    class Meta:
        model = Issue
        fields = (
            "id",
            "project",
            "project_name",
            "title",
            "description",
            "status",
            "priority",
            "assignee",
            "assignee_username",
            "due_date",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "project",
            "project_name",
            "assignee_username",
            "created_by",
            "created_at",
            "updated_at",
        )

    def validate_title(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Issue title cannot be empty."
            )

        if len(value) < 3:
            raise serializers.ValidationError(
                "Issue title must contain at least 3 characters."
            )

        return value

    def validate_status(self, value):
        if value not in Issue.Status.values:
            raise serializers.ValidationError(
                "Invalid issue status."
            )

        return value

    def validate_priority(self, value):
        if value not in Issue.Priority.values:
            raise serializers.ValidationError(
                "Invalid issue priority."
            )

        return value

    def validate_assignee(self, value):
        if value is None:
            return value

        project = self.initial_data.get("project")

        if self.instance:
            project = self.instance.project_id

        if project:
            from .models import ProjectMember

            if not ProjectMember.objects.filter(
                project_id=project,
                user=value,
            ).exists():
                raise serializers.ValidationError(
                    "Assignee must be a member of the project."
                )

        return value


class WorkflowMemberSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(
        source="user.username"
    )

    class Meta:
        model = WorkflowMember
        fields = (
            "id",
            "user",
            "username",
            "joined_at",
        )
        read_only_fields = (
            "id",
            "username",
            "joined_at",
        )


class WorkflowActivitySerializer(serializers.ModelSerializer):
    actor = serializers.ReadOnlyField(
        source="actor.username"
    )

    class Meta:
        model = WorkflowActivity
        fields = (
            "id",
            "actor",
            "action",
            "details",
            "created_at",
        )
        read_only_fields = (
            "id",
            "actor",
            "action",
            "details",
            "created_at",
        )


class WorkflowCommentSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(
        source="author.username"
    )

    class Meta:
        model = WorkflowComment
        fields = (
            "id",
            "workflow",
            "author",
            "content",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "workflow",
            "author",
            "created_at",
            "updated_at",
        )

    def validate_content(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Comment cannot be empty."
            )

        return value


class WorkflowAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.ReadOnlyField(
        source="uploaded_by.username"
    )

    class Meta:
        model = WorkflowAttachment
        fields = (
            "id",
            "workflow",
            "uploaded_by",
            "file_name",
            "file_url",
            "file_size",
            "content_type",
            "created_at",
        )
        read_only_fields = (
            "id",
            "workflow",
            "uploaded_by",
            "created_at",
        )

    def validate_file_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "File name cannot be empty."
            )

        return value


class WorkflowSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(
        source="owner.username"
    )

    due_date = serializers.DateTimeField(
        required=False,
        allow_null=True,
    )

    is_overdue = serializers.ReadOnlyField()

    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )

    members = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        many=True,
        required=False,
        write_only=True,
    )

    member_details = WorkflowMemberSerializer(
        source="members",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Workflow
        fields = (
            "id",
            "name",
            "description",
            "status",
            "priority",
            "owner",
            "assigned_to",
            "members",
            "member_details",
            "created_at",
            "updated_at",
            "due_date",
            "is_overdue",
        )

        read_only_fields = (
            "id",
            "owner",
            "member_details",
            "created_at",
            "updated_at",
            "is_overdue",
        )

    def create(self, validated_data):
        members = validated_data.pop("members", [])

        workflow = Workflow.objects.create(
            **validated_data
        )

        for user in members:
            WorkflowMember.objects.get_or_create(
                workflow=workflow,
                user=user,
            )

        return workflow

    def update(self, instance, validated_data):
        members = validated_data.pop("members", None)

        instance = super().update(
            instance,
            validated_data,
        )

        if members is not None:
            WorkflowMember.objects.filter(
                workflow=instance
            ).exclude(
                user__in=members
            ).delete()

            for user in members:
                WorkflowMember.objects.get_or_create(
                    workflow=instance,
                    user=user,
                )

        return instance

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Workflow name cannot be empty."
            )

        if len(value) < 3:
            raise serializers.ValidationError(
                "Workflow name must contain at least 3 characters."
            )

        return value

    def validate_status(self, value):
        if value not in Workflow.Status.values:
            raise serializers.ValidationError(
                "Invalid workflow status."
            )

        return value

    def validate_priority(self, value):
        if value not in Workflow.Priority.values:
            raise serializers.ValidationError(
                "Invalid workflow priority."
            )

        return value

    def validate(self, attrs):
        instance = self.instance

        if instance and "status" in attrs:
            old_status = instance.status
            new_status = attrs["status"]

            allowed_transitions = {
                Workflow.Status.DRAFT: [
                    Workflow.Status.ACTIVE,
                ],
                Workflow.Status.ACTIVE: [
                    Workflow.Status.COMPLETED,
                    Workflow.Status.ARCHIVED,
                ],
                Workflow.Status.COMPLETED: [
                    Workflow.Status.ARCHIVED,
                ],
                Workflow.Status.ARCHIVED: [],
            }

            if (
                new_status != old_status
                and new_status not in allowed_transitions.get(
                    old_status,
                    [],
                )
            ):
                raise serializers.ValidationError(
                    {
                        "status": (
                            f"Cannot change status "
                            f"from {old_status} "
                            f"to {new_status}."
                        )
                    }
                )

        return attrs

class NotificationSerializer(
    serializers.ModelSerializer
):
    recipient = serializers.ReadOnlyField(
        source="recipient.username"
    )

    class Meta:
        model = Notification
        fields = (
            "id",
            "recipient",
            "notification_type",
            "title",
            "message",
            "related_issue",
            "is_read",
            "created_at",
        )

        read_only_fields = (
            "id",
            "recipient",
            "notification_type",
            "title",
            "message",
            "related_issue",
            "created_at",
        )