from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = "Create the initial application user if it does not exist"

    def handle(self, *args, **options):
        username = "pushpa"
        email = "pushpa@example.com"
        password = "Workflow@09"

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "role": User.Role.DEVELOPER,
            },
        )

        if created:
            user.set_password(password)
            user.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f"Initial user '{username}' created successfully."
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"User '{username}' already exists."
                )
            )