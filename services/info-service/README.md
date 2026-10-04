# Info Service

This service responds to information and support-style quick-reply and text requests.

Main app configuration:
- Env var: INFO_SERVICE_URL
- Accepted URL formats: https://host or https://host/reply
- It must receive the header x-internal-key
- The app calls POST /reply on the service URL

Sample request:
```json
{
  "payload": "INFO_PAYMENT",
  "text": "What payment methods do you accept?",
  "channel": "messenger",
  "shopName": "Sample Shop"
}
```

Sample response:
```json
{
  "matched": true,
  "text": "We accept common methods. [EDIT: payment methods]",
  "quickReplies": [
    { "title": "Contact", "payload": "INFO_CONTACT" },
    { "title": "Main menu", "payload": "MAIN_MENU" }
  ]
}
```

Endpoints:
- POST /reply
- GET /health

It requires the shared INTERNAL_SERVICE_KEY header for requests.
