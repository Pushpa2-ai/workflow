import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from core.models import (
    Team,
    Project,
    ProjectMember,
    Issue,
    Notification,
)

User = get_user_model()


@pytest.fixture
def notification_setup():
    user = User.objects.create_user(
        username="notification_creator",
        email="notification_creator@example.com",
        password="Test@12345",
    )

    assignee = User.objects.create_user(
        username="notification_assignee",
        email="notification_assignee@example.com",
        password="Test@12345",
    )

    team = Team.objects.create(
        name="Notification Team",
        description="Team for notification tests.",
        owner=user,
    )

    project = Project.objects.create(
        name="Notification Project",
        description="Project for notification tests.",
        team=team,
        owner=user,
    )

    ProjectMember.objects.create(
        project=project,
        user=user,
    )

    issue = Issue.objects.create(
        project=project,
        title="Notification Test Issue",
        description="Issue for notification tests.",
        status="TODO",
        priority="HIGH",
        assignee=assignee,
        created_by=user,
    )

    return {
        "user": user,
        "assignee": assignee,
        "team": team,
        "project": project,
        "issue": issue,
    }


def authenticate(client, user):
    response = client.post(
        "/api/auth/token/",
        {
            "username": user.username,
            "password": "Test@12345",
        },
        format="json",
    )

    assert response.status_code == 200

    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
    )


@pytest.mark.django_db
def test_notification_creation(notification_setup):
    assignee = notification_setup["assignee"]
    issue = notification_setup["issue"]

    notification = Notification.objects.create(
        recipient=assignee,
        notification_type=Notification.NotificationType.ISSUE_ASSIGNED,
        title="New issue assigned",
        message=f"You have been assigned the issue '{issue.title}'.",
        related_issue=issue,
    )

    assert notification.recipient == assignee
    assert (
        notification.notification_type
        == Notification.NotificationType.ISSUE_ASSIGNED
    )
    assert notification.related_issue == issue
    assert notification.is_read is False


@pytest.mark.django_db
def test_notification_api_returns_user_notifications(
    notification_setup,
):
    assignee = notification_setup["assignee"]
    issue = notification_setup["issue"]

    Notification.objects.create(
        recipient=assignee,
        notification_type=Notification.NotificationType.ISSUE_ASSIGNED,
        title="New issue assigned",
        message="You have been assigned an issue.",
        related_issue=issue,
    )

    client = APIClient()

    authenticate(client, assignee)

    response = client.get(
        "/api/notifications/"
    )

    assert response.status_code == 200

    response_data = response.data

    if isinstance(response_data, dict):
        results = response_data.get(
            "results",
            response_data,
        )
    else:
        results = response_data

    assert len(results) >= 1

    assert any(
        item["notification_type"] == "ISSUE_ASSIGNED"
        for item in results
    )


@pytest.mark.django_db
def test_notification_can_be_marked_as_read(
    notification_setup,
):
    assignee = notification_setup["assignee"]
    issue = notification_setup["issue"]

    notification = Notification.objects.create(
        recipient=assignee,
        notification_type=Notification.NotificationType.ISSUE_ASSIGNED,
        title="New issue assigned",
        message="You have been assigned an issue.",
        related_issue=issue,
    )

    client = APIClient()

    authenticate(client, assignee)

    response = client.patch(
        f"/api/notifications/{notification.id}/read/",
        {},
        format="json",
    )

    assert response.status_code in [200, 204]

    notification.refresh_from_db()

    assert notification.is_read is True


@pytest.mark.django_db
def test_notification_endpoint_requires_authentication():
    client = APIClient()

    response = client.get(
        "/api/notifications/"
    )

    assert response.status_code == 401