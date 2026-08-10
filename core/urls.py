from django.urls import path

from .views import (
    HealthCheckView,
    RedisHealthCheckView,

    TeamCreateView,
    TeamListView,
    TeamDetailView,
    TeamMemberListView,
    TeamMemberAddView,
    TeamMemberRemoveView,

    ProjectCreateView,
    ProjectListView,
    ProjectDetailView,
    ProjectMemberListView,
    ProjectMemberAddView,
    ProjectMemberRemoveView,

    IssueListCreateView,
    IssueDetailView,

    WorkflowActivityListView,
    WorkflowAttachmentDetailView,
    WorkflowAttachmentListCreateView,
    WorkflowCommentDetailView,
    WorkflowCommentListCreateView,
    WorkflowCreateView,
    WorkflowDetailView,
    WorkflowListView,
    WorkflowMemberAddView,
    WorkflowMemberListView,
    WorkflowMemberRemoveView,
)


urlpatterns = [
    path(
        "health/",
        HealthCheckView.as_view(),
        name="health-check",
    ),

    path(
        "health/redis/",
        RedisHealthCheckView.as_view(),
        name="redis-health-check",
    ),

    # =====================================================
    # TEAMS
    # =====================================================

    path(
        "teams/",
        TeamListView.as_view(),
        name="team-list",
    ),

    path(
        "teams/create/",
        TeamCreateView.as_view(),
        name="team-create",
    ),

    path(
        "teams/<int:pk>/",
        TeamDetailView.as_view(),
        name="team-detail",
    ),

    path(
        "teams/<int:pk>/members/",
        TeamMemberListView.as_view(),
        name="team-members",
    ),

    path(
        "teams/<int:pk>/members/add/",
        TeamMemberAddView.as_view(),
        name="team-member-add",
    ),

    path(
        "teams/<int:team_pk>/members/<int:pk>/",
        TeamMemberRemoveView.as_view(),
        name="team-member-remove",
    ),

    # =====================================================
    # PROJECTS
    # =====================================================

    path(
        "projects/",
        ProjectListView.as_view(),
        name="project-list",
    ),

    path(
        "projects/create/",
        ProjectCreateView.as_view(),
        name="project-create",
    ),

    path(
        "projects/<int:pk>/",
        ProjectDetailView.as_view(),
        name="project-detail",
    ),

    path(
        "projects/<int:pk>/members/",
        ProjectMemberListView.as_view(),
        name="project-members",
    ),

    path(
        "projects/<int:pk>/members/add/",
        ProjectMemberAddView.as_view(),
        name="project-member-add",
    ),

    path(
        "projects/<int:project_pk>/members/<int:pk>/",
        ProjectMemberRemoveView.as_view(),
        name="project-member-remove",
    ),

    path(
        "projects/<int:project_pk>/issues/",
        IssueListCreateView.as_view(),
        name="project-issues",
    ),

    path(
        "projects/<int:project_pk>/issues/<int:pk>/",
        IssueDetailView.as_view(),
        name="project-issue-detail",
    ),

    # =====================================================
    # WORKFLOWS
    # =====================================================

    path(
        "workflows/",
        WorkflowListView.as_view(),
        name="workflow-list",
    ),

    path(
        "workflows/create/",
        WorkflowCreateView.as_view(),
        name="workflow-create",
    ),

    path(
        "workflows/<int:pk>/",
        WorkflowDetailView.as_view(),
        name="workflow-detail",
    ),

    path(
        "workflows/<int:pk>/members/",
        WorkflowMemberListView.as_view(),
        name="workflow-members",
    ),

    path(
        "workflows/<int:pk>/members/add/",
        WorkflowMemberAddView.as_view(),
        name="workflow-member-add",
    ),

    path(
        "workflows/<int:workflow_pk>/members/<int:pk>/",
        WorkflowMemberRemoveView.as_view(),
        name="workflow-member-remove",
    ),

    path(
        "workflows/<int:pk>/activities/",
        WorkflowActivityListView.as_view(),
        name="workflow-activities",
    ),

    path(
        "workflows/<int:pk>/comments/",
        WorkflowCommentListCreateView.as_view(),
        name="workflow-comments",
    ),

    path(
        "workflows/<int:workflow_pk>/comments/<int:pk>/",
        WorkflowCommentDetailView.as_view(),
        name="workflow-comment-detail",
    ),

    path(
        "workflows/<int:pk>/attachments/",
        WorkflowAttachmentListCreateView.as_view(),
        name="workflow-attachments",
    ),

    path(
        "workflows/<int:workflow_pk>/attachments/<int:pk>/",
        WorkflowAttachmentDetailView.as_view(),
        name="workflow-attachment-detail",
    ),
]