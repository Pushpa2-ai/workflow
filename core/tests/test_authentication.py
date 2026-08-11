import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
def test_unauthenticated_request_returns_401():
    client = APIClient()

    response = client.get("/api/projects/")

    assert response.status_code == 401


@pytest.mark.django_db
def test_valid_token_allows_authenticated_request():
    user = User.objects.create_user(
        username="pytest_user",
        password="Test@12345",
    )

    client = APIClient()

    response = client.post(
        "/api/auth/token/",
        {
            "username": "pytest_user",
            "password": "Test@12345",
        },
        format="json",
    )

    assert response.status_code == 200
    assert "access" in response.data

    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
    )

    response = client.get("/api/projects/")

    assert response.status_code == 200


@pytest.mark.django_db
def test_invalid_credentials_return_401():
    User.objects.create_user(
        username="pytest_invalid_user",
        password="Correct@12345",
    )

    client = APIClient()

    response = client.post(
        "/api/auth/token/",
        {
            "username": "pytest_invalid_user",
            "password": "WrongPassword",
        },
        format="json",
    )

    assert response.status_code == 401