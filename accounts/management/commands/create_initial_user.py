from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = "Create initial application users if they do not exist"

    def handle(self, *args, **options):
        users = [
            {
                "username": "pushpa",
                "email": "pushpa@example.com",
                "password": "Workflow@09",
                "role": User.Role.DEVELOPER,
            },
            {
                "username": "demo",
                "email": "demo@workflow.app",
                "password": "Demo@Workflow09",
                "role": User.Role.ADMIN,
            },
        ]

        for user_data in users:
            username = user_data["username"]

            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": user_data["email"],
                    "role": user_data["role"],
                },
            )

            if created:
                user.set_password(user_data["password"])
                user.save()

                self.stdout.write(
                    self.style.SUCCESS(
                        f"User '{username}' created successfully."
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"User '{username}' already exists."
                    )
                )