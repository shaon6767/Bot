# Chat Commerce

Chat Commerce is a product and order dashboard for small businesses that sell through Facebook Messenger and Instagram. It helps businesses manage their catalog, answer common customer questions, and turn chats into orders in one workspace.

## Screenshots

**Landing page**

![Chat Commerce landing page](./dashboard/public/screenshots/landing.png)

**Interactive demo**

![Chat Commerce interactive demo](./dashboard/public/screenshots/demo.png)

## Features

- Browse products and place sample orders in the interactive chat demo.
- Manage products, review orders, and update order statuses.
- Configure Messenger and Instagram business settings.
- Register, sign in, and recover an account password.
- Handle common questions and product orders through automated replies.

## How It Works

Businesses manage products and orders from the dashboard, which sends authenticated requests to the API. The API stores business data in MongoDB and processes Messenger and Instagram webhooks, matching incoming chats to replies or product orders. The public demo is simulated and works without an API or Meta account.

## Tech Stack

- Next.js, React, TypeScript, and Tailwind CSS
- Node.js and Express
- MongoDB with Mongoose
- Meta Messenger and Instagram APIs

## Challenges & Solutions

- **Verifying Meta webhooks:** The API validates signatures against the raw request body before parsing events.
- **Handling webhook retries:** A unique Meta message ID prevents duplicate incoming events from creating duplicate messages or orders.
- **Keeping reply services responsive:** Service calls have a timeout and fall back to local handling if a service is unavailable.

## Limitations

- The public demo is simulated; it does not connect to Meta or create real orders.
- Live messaging requires a configured Meta app, webhook, and business credentials.
- Some reply-service text is sample content and needs business-specific details.
- Orders use a simple text format and do not process payments or fulfill shipments.

## Setup

**Prerequisites:** Node.js 20.9 or newer, npm, and MongoDB.

Install the dashboard and API dependencies in separate terminals:

```sh
cd dashboard
npm install
```

```sh
cd backend
npm install
```

Create `backend/.env` with the required API configuration:

```dotenv
PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/chat-commerce
JWT_SECRET=replace-with-a-long-random-secret
META_APP_SECRET=your-meta-app-secret
META_VERIFY_TOKEN=your-webhook-verification-token
```

Start MongoDB, then run the API and dashboard in separate terminals:

```sh
# Terminal 1
cd backend
npm run dev
```

```sh
# Terminal 2
cd dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The public demo works without the API; account and dashboard features require it. The dashboard uses `http://localhost:5000` by default. Set `NEXT_PUBLIC_API_URL` in `dashboard/.env.local` to use another API URL.
