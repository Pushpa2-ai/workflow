from celery import shared_task
from .models import Notification


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def workflow_background_test(self):
    return {
        "status": "completed",
        "message": "Workflow background task executed successfully.",
    }


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def create_notification(
    self,
    recipient_id,
    notification_type,
    title,
    message,
    issue_id=None,
):
    notification = Notification.objects.create(
        recipient_id=recipient_id,
        notification_type=notification_type,
        title=title,
        message=message,
        related_issue_id=issue_id,
    )

    return {
        "status": "created",
        "notification_id": notification.id,
    }