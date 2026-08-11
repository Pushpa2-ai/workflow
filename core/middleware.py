import logging
import time

logger = logging.getLogger("core")


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.perf_counter()

        try:
            response = self.get_response(request)

            duration = time.perf_counter() - start_time

            logger.info(
                "%s %s -> %s (%.3fs)",
                request.method,
                request.path,
                response.status_code,
                duration,
            )

            return response

        except Exception:
            duration = time.perf_counter() - start_time

            logger.exception(
                "%s %s -> 500 (%.3fs)",
                request.method,
                request.path,
                duration,
            )

            raise