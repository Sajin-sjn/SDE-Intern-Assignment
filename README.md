# SDE-Intern-Assignment
# Mini Learning Platform

A web-based learning management system built with Django (Django REST Framework) and React, enabling users to watch educational videos, manage their video lists, and track watching progress with resume playback functionality, similar to YouTube. Users can register, log in, add videos to a personalized list, and resume videos from their last watched position. Admins can upload and manage video content. The platform tracks watched intervals to calculate unique progress and supports seamless playback resumption.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Usage](#usage)
- [Design Decisions and Code Explanation](#design-decisions-and-code-explanation)
- [Progress Tracking and Interval Management](#progress-tracking-and-interval-management)
  - [Tracking Watched Intervals](#tracking-watched-intervals)
  - [Merging Intervals for Unique Progress](#merging-intervals-for-unique-progress)
  - [Challenges and Solutions](#challenges-and-solutions)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Authentication**:
  - Register and log in with username, email, and password.
  - Token-based authentication with error modals (e.g., "Username already exists").
- **Video Management**:
  - Browse and add videos to "My List".
  - Admins upload videos (MP4/WebM) with metadata (title, description, duration).
  - Remove videos from "My List".
- **Video Playback**:
  - HTML5 video player with resume from last watched position (e.g., pause at 5s, resume at 5s).
  - Save position on pause, seek, or page unload (tab close/navigation).
- **Progress Tracking**:
  - Track watched intervals and calculate unique progress percentage.
  - Display progress bars, last watched time, and total duration.
- **Responsive UI**:
  - Bootstrap-based, mobile-friendly interface with modals for errors.
- **Admin Dashboard**:
  - Manage video content (create, update, delete) via `/admin`.

## Tech Stack

- **Backend**:
  - Django 4.x: Web framework for API and logic.
  - Django REST Framework: API development and token authentication.
  - SQLite: Default database (configurable for PostgreSQL).
  - Python Packages: `django`, `djangorestframework`, `django-rest-auth-token`.
- **Frontend**:
  - React 18: UI with component-based architecture.
  - Axios: API requests.
  - React Router: Client-side routing.
  - Bootstrap 5.3.3: Styling and modals.
  - Bootstrap Icons: Icons for UI.
- **Development Tools**:
  - Vite: Frontend build tool.
  - npm: Package management.

## Prerequisites

- **Software**:
  - Python 3.8+
  - Node.js 16+
  - npm 8+
  - Git (for cloning)
- **Hardware**:
  - 4GB RAM
  - 2GB free disk space
- **Environment**:
  - Ensure `python` and `npm` are in your PATH.
  - No external accounts needed for local setup.

## Installation

1. Clone the Repository:

2. Backend Setup:
- Create a virtual environment:
  ```
  python -m venv venv
  source venv/bin/activate  # Windows: venv\Scripts\activate
  ```
- Install dependencies:
  ```
  pip install django djangorestframework django-rest-auth-token
  ```
- Apply migrations:
  ```
  python manage.py makemigrations
  python manage.py migrate
  ```
- Create an admin user:
  ```
  python manage.py createsuperuser
  ```
- (Optional) Load sample data:
  ```
  python manage.py loaddata sample_data.json
  ```

3. Frontend Setup:
- Install dependencies:
  ```
  npm install
  ```
- Verify Bootstrap in `public/index.html`:
  ```
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  ```

## Running the Project

1. Start Backend:
- API available at `http://localhost:8000`.

2. Start Frontend:
- App available at `http://localhost:5173` (Vite default).

3. Access the App:
- Open `http://localhost:5173` in a browser.
- Register or log in.
- Admin: Access `http://localhost:8000/admin/` with superuser credentials.

## Usage

1. Register/Login:
- Navigate to `/signup` to create an account.
- Log in at `/login`.
- Errors (e.g., duplicate username) appear in Bootstrap modals.

2. Manage Videos:
- Dashboard (`/dashboard`): Browse videos, add to "My List".
- My List (`/my-list`): View saved videos, play, or remove.

3. Watch Videos:
- Play a video in "My List".
- Pause, seek, or close the tab; progress and position are saved.
- Resume playback from the last position (e.g., 5s in a 10s video).
- View progress bars and last watched time.

4. Admin Tasks:
- Log in as admin at `/admin`.
- Upload videos (MP4/WebM) with metadata.
- Edit or delete videos.

5. Example:
- Register as `user1`.
- Add a 10s video to "My List".
- Play, pause at 5s, refresh or close tab.
- Reopen; video resumes at ~5s.
- Progress shows ~50%.

## Design Decisions and Code Explanation

### Backend
- **Django REST Framework**:
- Chosen for rapid API development and built-in token authentication.
- `TokenAuthentication` ensures secure API access.
- Custom `CustomAuthToken` view returns user details (`user_id`, `username`, `is_admin`) with tokens.
- **Models**:
- `Video`: Stores video metadata (`title`, `description`, `duration`, `video_file`).
- `UserVideoList`: Tracks user’s video list with `unique_together` constraint.
- `VideoProgress`: Stores progress (`progress`, `last_watched_position`) per user-video pair.
- `VideoProgressInterval`: Records watched intervals (`start_time`, `end_time`) with validation.
- **Serializers**:
- `VideoSerializer` includes `is_in_user_list` to optimize frontend checks.
- `VideoProgressSerializer` handles nested intervals for progress updates.
- **Views**:
- `VideoProgressViewSet.update_progress`: Custom action to update `current_time` and intervals atomically.
- Uses `transaction.atomic()` to ensure database consistency.
- **Utils**:
- `merge_intervals`: Merges overlapping intervals for progress calculation.
- `calculate_unique_duration`: Sums non-overlapping watched time.

### Frontend
- **React with Context**:
- `AuthContext.jsx` manages user state, token, and API interceptors.
- Centralizes authentication logic (`login`, `register`, `logout`).
- **Video Playback**:
- `<video>` element with event handlers (`onPlay`, `onPause`, `onSeeking`, `onTimeUpdate`, `onLoadedMetadata`).
- `playbackData` (useRef) tracks per-video state (`isPlaying`, `videoElement`, `lastSavedPosition`).
- **Progress Tracking**:
- `progressData` stores server-fetched progress (`last_watched_position`, `intervals`).
- `saveProgress` sends `current_time` and new intervals to `/api/progress/update_progress/`.
- **Resume Playback**:
- `onLoadedMetadata` sets `currentTime` to `last_watched_position` if valid.
- Saves position on `pause`, `seeking`, `timeupdate` (every 15s), and page unload (`beforeunload`).
- **UI**:
- Bootstrap for modals (e.g., registration errors) and responsive cards.
- Progress bars visualize `progress` percentage.

### Why These Choices?
- **Django + React**: Separates backend (API) from frontend (UI), enabling scalability.
- **SQLite**: Simple for development; PostgreSQL for production.
- **Token Authentication**: Lightweight and secure.
- **Interval-Based Progress**: Precise tracking of watched segments.
- **Bootstrap**: Quick styling with modals.
- **Vite**: Faster development server.

## Progress Tracking and Interval Management

### Tracking Watched Intervals
- **Frontend (`MyList.jsx`)**:
- `handlePlay`: Records `startTime` when video plays.
- `handlePause`/`handleSeeking`: Adds `[startTime, currentTime]` to `pendingIntervals`.
- `handleTimeUpdate`: Saves intervals every 15s.
- `beforeunload`/`useEffect` cleanup: Saves `lastSavedPosition` on tab close/navigation.
- `saveProgress`: Sends `current_time` and `pendingIntervals` to backend.
- **Backend (`VideoProgressViewSet`)**:
- `POST /api/progress/update_progress/`:
 - Validates `current_time` (0 ≤ time ≤ duration).
 - Stores intervals in `VideoProgressInterval`.
 - Updates `last_watched_position` in `VideoProgress`.
- **Example**:
- Pause at 5s → `pendingIntervals: [[0, 5]]` → API: `{ "current_time": 5, "intervals": [{"start_time": 0, "end_time": 5}] }`.
- Reload → `onLoadedMetadata` sets `currentTime` to 5s.

### Merging Intervals for Unique Progress
- **Frontend (`getNewIntervals`)**:
- Rounds `pendingIntervals` to 0.1s.
- Filters invalid intervals.
- Computes non-overlapping segments vs. `existingIntervals`.
- **Backend (`utils.py`)**:
- `merge_intervals`:
 ```
 def merge_intervals(intervals):
     sorted_intervals = sorted(intervals, key=lambda x: x[0])
     merged = []
     current_interval = list(sorted_intervals[0])
     for interval in sorted_intervals[1:]:
         if interval[0] <= current_interval[1]:
             current_interval[1] = max(current_interval[1], interval[1])
         else:
             merged.append(current_interval)
             current_interval = list(interval)
     merged.append(current_interval)
     return merged
 ```
- `calculate_unique_duration`: Sums merged interval durations.
- Progress = `(unique_duration / video.duration) * 100`.
- **Example**:
- Intervals: `[0, 3], [2, 5]` → Merged: `[0, 5]` → Duration: 5s.
- 10s video → Progress: `(5 / 10) * 100 = 50%`.

### Challenges and Solutions
- **Duplicate Username Modal**:
- **Issue**: `400` error (`{"error": {"username": ["A user with that username already exists."]}}`) not shown in modal.
- **Solution**: Parsed `error.username[0]` in `AuthContext.jsx`, set string `error` in `SignUp.jsx`.
- **Video Resume Failure**:
- **Issue**: Resume only on initial play (`currentTime === 0`).
- **Solution**: Added `onLoadedMetadata` to set `currentTime` after metadata load, saved `lastSavedPosition` on all events.
- **Frequent API Calls**:
- **Issue**: Rapid `timeupdate` events overloaded backend.
- **Solution**: Limited saves to 15s intervals, used `lastSavedPosition`.
- **Overlapping Intervals**:
- **Issue**: Backend rejected overlaps in `VideoProgressInterval`.
- **Solution**: Frontend filtered overlaps; backend merged intervals.

## Project Structure

## Project Structure
```markdown
SDE-Intern-Assignment/
├── myapp-backend/
│   ├── app/
│   │   ├── migrations/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── utils.py
│   │   └── views.py
│   ├── project/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── ...
│   ├── media/
│   │   └── videos/
│   └── manage.py
├── myapp-frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── SignUp.jsx
│   │   │   └── MyList.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md


## API Endpoints
- **Auth**:
  - `POST /api/users/register/`:
    ```
    Request: { "username", "email", "password" }
    Response: { "token", "user_id", "username", "is_admin" }
    ```
  - `POST /api/login/`:
    ```
    Request: { "username", "password" }
    Response: { "token", "user_id", "username", "is_admin" }
    ```
- **Videos**:
  - `GET /api/videos/`: `[{ "id", "title", "video_file", "is_in_user_list", ... }]`
  - `POST /api/videos/` (admin): Upload video.
  - `PUT/DELETE /api/videos/:id/` (admin): Update/delete.
- **User List**:
  - `GET /api/my-list/`: User’s videos.
  - `POST /api/my-list/`: Add video (`{ "video_id" }`).
  - `DELETE /api/my-list/:videoId/remove/`: Remove video.
- **Progress**:
  - `GET /api/progress/`: `[{ "video", "progress", "last_watched_position", "intervals" }]`
  - `POST /api/progress/update_progress/`:
    ```
    Request: { "video_id", "current_time", "intervals": [{ "start_time", "end_time" }] }
    ```

## Testing
1. Backend:
cd myapp-backend
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
curl -X POST http://localhost:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'
python manage.py shell
>>> from api.models import VideoProgress
>>> print(VideoProgress.objects.values('video__id', 'last_watched_position'))


2. Frontend:
- Registration: Duplicate username → "Username already exists" modal.
- Playback: Pause 10s video at 5s, refresh → resumes at ~5s.
- Progress: ~50% for 5s/10s.
- Console:
  ```
  Resuming video 1 at 5s
  Saving progress for video 1 { currentTime: 5, ... }
  ```
3. End-to-End:
- Register, add video, pause at 5s, close tab, reopen → resume at 5s.
- Admin: Upload video, verify in dashboard.


