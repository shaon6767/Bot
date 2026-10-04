# Orders Service

This service responds to order-related quick-reply and text requests. It is intentionally small and server-to-server only.

Main app configuration:
- Env var: ORDERS_SERVICE_URL
- Accepted URL formats: https://host or https://host/reply
- It must receive the header x-internal-key
- The app calls POST /reply on the service URL

Sample request:
```json
{
  "payload": "ORD_DELIVERY",
  "text": "Where is my order?",
  "channel": "messenger",
  "shopName": "Sample Shop"
}
```

Sample response:
```json
{
  "matched": true,
  "text": "Delivery times vary by location. [EDIT: delivery time]",
  "quickReplies": [
    { "title": "Track order", "payload": "ORD_TRACK" },
    { "title": "Main menu", "payload": "MAIN_MENU" }
  ]
}
```

Endpoints:
- POST /reply
- GET /health

It uses a shared INTERNAL_SERVICE_KEY for access control.
