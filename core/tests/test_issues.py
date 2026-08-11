import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from core.models import (
    Team,
    Project,
    ProjectMember,
    Issue,
)

User = get_user_model()


@pytest.fixture
def issue_setup():
    user = User.objects.create_user(
        username="issue_test_user",
        email="issue_test_user@example.com",
        password="Test@12345",
    )

    assignee = User.objects.create_user(
        username="issue_assignee",
        email="issue_assignee@example.com",
        password="Test@12345",
    )

    team = Team.objects.create(
        name="Issue Test Team",
        description="Team for issue tests.",
        owner=user,
    )

    project = Project.objects.create(
        name="Issue Test Project",
        description="Project for issue tests.",
        team=team,
        owner=user,
    )

    ProjectMember.objects.create(
        project=project,
        user=user,
    )

    return {
        "user": user,
        "assignee": assignee,
        "team": team,
        "project": project,
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
def test_authenticated_user_can_create_issue(issue_setup):
    user = issue_setup["user"]
    project = issue_setup["project"]
    assignee = issue_setup["assignee"]

    client = APIClient()

    authenticate(client, user)

    response = client.post(
        f"/api/projects/{project.id}/issues/",
        {
            "title": "Pytest Issue",
            "description": "Issue created through pytest.",
            "status": "TODO",
            "priority": "HIGH",
            "assignee": assignee.id,
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["title"] == "Pytest Issue"

    assert Issue.objects.filter(
        project=project,
        title="Pytest Issue",
        created_by=user,
        assignee=assignee,
    ).exists()


@pytest.mark.django_db
def test_issue_search(issue_setup):
    user = issue_setup["user"]
    project = issue_setup["project"]

    Issue.objects.create(
        project=project,
        title="Authentication Bug",
        description="JWT authentication issue.",
        status="TODO",
        priority="HIGH",
        created_by=user,
    )

    Issue.objects.create(
        project=project,
        title="Dashboard Issue",
        description="Dashboard layout problem.",
        status="TODO",
        priority="LOW",
        created_by=user,
    )

    client = APIClient()

    authenticate(client, user)

    response = client.get(
        f"/api/projects/{project.id}/issues/?search=Authentication"
    )

    assert response.status_code == 200

    results = response.data["results"]

    assert len(results) == 1
    assert results[0]["title"] == "Authentication Bug"


@pytest.mark.django_db
def test_issue_filters(issue_setup):
    user = issue_setup["user"]
    project = issue_setup["project"]
    assignee = issue_setup["assignee"]

    Issue.objects.create(
        project=project,
        title="High Priority Issue",
        description="High priority.",
        status="TODO",
        priority="HIGH",
        assignee=assignee,
        created_by=user,
    )

    Issue.objects.create(
        project=project,
        title="Done Issue",
        description="Completed issue.",
        status="DONE",
        priority="LOW",
        created_by=user,
    )

    client = APIClient()

    authenticate(client, user)

    # Status filter
    response = client.get(
        f"/api/projects/{project.id}/issues/?status=TODO"
    )

    assert response.status_code == 200

    results = response.data["results"]

    assert len(results) == 1
    assert results[0]["title"] == "High Priority Issue"

    # Priority filter
    response = client.get(
        f"/api/projects/{project.id}/issues/?priority=HIGH"
    )

    assert response.status_code == 200

    results = response.data["results"]

    assert len(results) == 1
    assert results[0]["title"] == "High Priority Issue"

    # Assignee filter
    response = client.get(
        f"/api/projects/{project.id}/issues/?assignee={assignee.id}"
    )

    assert response.status_code == 200

    results = response.data["results"]

    assert len(results) == 1
    assert results[0]["title"] == "High Priority Issue"


@pytest.mark.django_db
def test_issue_pagination(issue_setup):
    user = issue_setup["user"]
    project = issue_setup["project"]

    for number in range(5):
        Issue.objects.create(
            project=project,
            title=f"Pagination Issue {number}",
            description="Pagination test.",
            status="TODO",
            priority="MEDIUM",
            created_by=user,
        )

    client = APIClient()

    authenticate(client, user)

    response = client.get(
        f"/api/projects/{project.id}/issues/"
        "?page=1&page_size=2"
    )

    assert response.status_code == 200

    assert response.data["count"] == 5
    assert len(response.data["results"]) == 2