import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from core.models import Team, Project, ProjectMember

User = get_user_model()


@pytest.mark.django_db
def test_team_and_project_relationship():
    user = User.objects.create_user(
        username="project_test_user",
        password="Test@12345",
    )

    team = Team.objects.create(
        name="Pytest Team",
        description="Team created for pytest.",
        owner=user,
    )

    project = Project.objects.create(
        name="Pytest Project",
        description="Project created for pytest.",
        team=team,
        owner=user,
    )

    assert project.team == team
    assert project.owner == user
    assert team.projects.filter(
        id=project.id
    ).exists()


@pytest.mark.django_db
def test_authenticated_user_can_create_project():
    user = User.objects.create_user(
        username="project_creator",
        password="Test@12345",
    )

    team = Team.objects.create(
        name="Creation Team",
        description="Team for project creation test.",
        owner=user,
    )

    client = APIClient()

    response = client.post(
        "/api/auth/token/",
        {
            "username": "project_creator",
            "password": "Test@12345",
        },
        format="json",
    )

    assert response.status_code == 200

    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
    )

    response = client.post(
        "/api/projects/create/",
        {
            "name": "API Created Project",
            "description": "Created through the API.",
            "team": team.id,
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["name"] == "API Created Project"

    assert Project.objects.filter(
        name="API Created Project",
        team=team,
        owner=user,
    ).exists()


@pytest.mark.django_db
def test_authenticated_user_can_list_projects():
    user = User.objects.create_user(
        username="project_list_user",
        password="Test@12345",
    )

    team = Team.objects.create(
        name="List Team",
        description="Team for project list test.",
        owner=user,
    )

    project = Project.objects.create(
        name="List Test Project",
        description="Project for list test.",
        team=team,
        owner=user,
    )

    ProjectMember.objects.create(
        project=project,
        user=user,
    )

    client = APIClient()

    response = client.post(
        "/api/auth/token/",
        {
            "username": "project_list_user",
            "password": "Test@12345",
        },
        format="json",
    )

    assert response.status_code == 200

    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
    )

    response = client.get(
        "/api/projects/"
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

    assert any(
        item["id"] == project.id
        for item in results
    )


@pytest.mark.django_db
def test_authenticated_user_can_retrieve_project():
    user = User.objects.create_user(
        username="project_detail_user",
        password="Test@12345",
    )

    team = Team.objects.create(
        name="Detail Team",
        description="Team for project detail test.",
        owner=user,
    )

    project = Project.objects.create(
        name="Detail Test Project",
        description="Project for detail test.",
        team=team,
        owner=user,
    )

    client = APIClient()

    response = client.post(
        "/api/auth/token/",
        {
            "username": "project_detail_user",
            "password": "Test@12345",
        },
        format="json",
    )

    assert response.status_code == 200

    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
    )

    response = client.get(
        f"/api/projects/{project.id}/"
    )

    assert response.status_code == 200
    assert response.data["id"] == project.id
    assert response.data["name"] == "Detail Test Project"