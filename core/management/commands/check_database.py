from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Check PostgreSQL database connectivity"

    def handle(self, *args, **options):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()

            self.stdout.write(
                self.style.SUCCESS("Database connection: OK")
            )
        except Exception as exc:
            self.stdout.write(
                self.style.ERROR(f"Database connection failed: {exc}")
            )