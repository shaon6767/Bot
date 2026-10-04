# Orders Service

This service responds to order-related quick-reply and text requests. It is intentionally small and server-to-server only.

Endpoints:
- POST /reply
- GET /health

It uses a shared INTERNAL_SERVICE_KEY for access control.
