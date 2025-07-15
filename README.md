# App Release Dashboard

A simple dashboard for managing Android and iOS app releases, with data sourced from GitLab CI jobs.

## Architecture

- **Backend**: Python FastAPI
- **Frontend**: React with TypeScript and Material-UI
- **Database**: SQLite (default) or PostgreSQL

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file:
```bash
cp .env.example .env
```

5. Run the backend:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The dashboard will be available at `http://localhost:3000`

## GitLab CI Integration

To send release data from GitLab CI to the dashboard, add a webhook call in your `.gitlab-ci.yml`:

```yaml
variables:
  APP_NAME: "MyApp"
  PLATFORM: "android"  # or "ios"
  VERSION: "1.0.0"
  BUILD_NUMBER: "${CI_PIPELINE_ID}"
  RELEASE_NOTES: "Bug fixes and improvements"
  ARTIFACT_URL: "${CI_JOB_URL}/artifacts/download"

.notify_dashboard:
  script:
    - |
      curl -X POST http://your-dashboard-url/webhook/gitlab \
        -H "Content-Type: application/json" \
        -d '{
          "object_kind": "build",
          "build_status": "'${CI_JOB_STATUS}'",
          "build_id": "'${CI_JOB_ID}'",
          "pipeline_id": "'${CI_PIPELINE_ID}'",
          "ref": "'${CI_COMMIT_REF_NAME}'",
          "sha": "'${CI_COMMIT_SHA}'",
          "project": {
            "name": "'${CI_PROJECT_NAME}'"
          },
          "variables": {
            "APP_NAME": "'${APP_NAME}'",
            "PLATFORM": "'${PLATFORM}'",
            "VERSION": "'${VERSION}'",
            "BUILD_NUMBER": "'${BUILD_NUMBER}'",
            "RELEASE_NOTES": "'${RELEASE_NOTES}'",
            "ARTIFACT_URL": "'${ARTIFACT_URL}'"
          }
        }'

build_android:
  stage: build
  variables:
    PLATFORM: "android"
  script:
    - echo "Building Android app..."
    # Your build commands here
  after_script:
    - !reference [.notify_dashboard, script]

build_ios:
  stage: build
  variables:
    PLATFORM: "ios"
  script:
    - echo "Building iOS app..."
    # Your build commands here
  after_script:
    - !reference [.notify_dashboard, script]
```

## API Endpoints

- `POST /webhook/gitlab` - Receive webhook data from GitLab CI
- `GET /releases` - Get all releases with optional filters
- `GET /releases/{id}` - Get a specific release
- `GET /stats` - Get dashboard statistics

## Features

- Real-time dashboard showing release statistics
- Filter releases by platform, app name, and status
- View release history with details
- Success rate tracking
- Direct links to GitLab jobs and artifacts
- Auto-refresh every 30 seconds