# App Release Dashboard

A unified Astro application for tracking mobile app releases across iOS and Android platforms.

## Features

- Single codebase with Astro SSR
- SQLite database for local development
- PostgreSQL support for production
- RESTful API endpoints
- React components for interactive UI
- Auto-organization detection based on app names
- Responsive design

## Tech Stack

- **Framework**: Astro with SSR
- **Frontend**: React components
- **Backend**: Astro API routes
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Language**: TypeScript

## Project Structure

```
src/
├── components/      # React components
├── lib/            # Database and utilities
├── pages/          # Astro pages and API routes
│   └── api/        # API endpoints
├── styles/         # CSS files
└── types/          # TypeScript types
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Run development server:
```bash
npm run dev
```

The app will be available at http://localhost:4321

## API Endpoints

- `GET /api/releases` - Get all releases
- `POST /api/releases` - Create a new release
- `GET /api/releases/[id]` - Get a specific release
- `PUT /api/releases/[id]` - Update a release
- `DELETE /api/releases/[id]` - Delete a release

## Deployment

The app can be deployed to various platforms:

### Render
Push to your repository and connect to Render. The `render.yaml` is pre-configured.

### Railway
Use the Railway CLI or connect your GitHub repo. The `railway.json` is included.

### Vercel
Deploy with Vercel CLI or GitHub integration. The `vercel.json` is configured.

### Environment Variables

- `DATABASE_URL` - Database connection string
- `FRONTEND_URL` - Frontend URL for CORS (defaults to http://localhost:4321)
- `PORT` - Server port (defaults to 4321)

## Development

The app uses Astro's SSR mode with the Node.js adapter. API routes are located in `src/pages/api/` and use Astro's API route handlers.

## Database

The app uses SQLite for local development and can be configured to use PostgreSQL in production by setting the `DATABASE_URL` environment variable.
