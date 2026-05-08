# AI Tutor Screener

AI Tutor Screener is a full-stack hiring workflow for screening tutor candidates through a short voice-first interview and generating a structured recruiter report.

The system evaluates communication-focused dimensions instead of deep math correctness:

- Clarity
- Warmth
- Simplicity
- Patience
- Fluency

## What This Project Solves

Manual tutor screening calls are expensive, slow, and hard to scale. This app automates the first interview round by:

- Running a guided voice interview in the browser.
- Asking adaptive follow-up questions for vague or off-topic answers.
- Producing a structured report with evidence quotes.
- Separating candidate and admin roles securely.

## Key Features

- Candidate registration and login (JWT-based auth).
- Admin-only dashboard and report access.
- Voice-driven candidate interview using browser speech APIs.
- Adaptive interview mode shown in UI:
	- Exploring
	- Clarifying
	- Refocusing
- Deterministic local scoring engine (no external LLM/API key required).
- Rubric-style report output with:
	- Overall score
	- Recommendation (Proceed/Hold/Reject)
	- Dimension-wise score, evidence, quote, and confidence
	- Strengths, areas of concern, summary, and full transcript
- Candidate-focused completion page with professional next-step messaging.

## Tech Stack

### Frontend

- Next.js (App Router)
- React
- Tailwind CSS
- Browser Web Speech APIs (SpeechRecognition + SpeechSynthesis)

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT + bcryptjs

## Architecture Summary

The system is split into two applications:

- Frontend app (Next.js): interview UX, auth pages, admin pages
- Backend API (Express): auth, interview session management, report generation, report retrieval

### High-Level Flow

1. Candidate registers/logs in.
2. Candidate starts a new interview session.
3. Interview runs voice-first in browser.
4. Candidate responses are posted to backend.
5. Backend decides next question adaptively (explore/clarify/refocus).
6. On completion, backend generates structured report via local scoring engine.
7. Admin views report and rubric breakdown.

### Components and Responsibilities

- `frontend/app/interview/page.js`
	- Voice capture and playback
	- Adaptive mode badge
	- Sends responses and final completion request

- `backend/controllers/interviewController.js`
	- Session lifecycle: start/respond/complete
	- Ownership checks (candidate can only access own session)
	- Report generation and normalization before persistence

- `backend/services/interviewScoringService.js`
	- Adaptive follow-up logic
	- Local deterministic scoring and recommendation
	- Confidence and fairness guardrails

- `backend/models/Report.js`
	- Structured report schema for recruiter consumption

- `frontend/app/admin/report/[id]/page.js`
	- Dimension cards with score, quote evidence, and confidence tags

### Data Model (Core)

- User
	- name, email, passwordHash, role

- Session
	- candidateId, conversation, status, currentQuestionIndex, reportId

- Report
	- sessionId, candidate info, overallScore, recommendation
	- dimensions: clarity/warmth/simplicity/patience/fluency
	- per-dimension: score, evidence, quote, confidence
	- strengths, areasOfConcern, summary, fullTranscript

## Security Notes

- Role-based route protection on backend.
- Candidate and admin auth separation.
- Candidate auto-logout support on token expiry.
- No external AI API keys required for runtime scoring.

Important:

- Keep `.env` out of version control.
- Rotate secrets before submission or deployment:
	- `MONGO_URI`
	- `JWT_SECRET`
	- `ADMIN_PASSWORD`

## Local Setup

## 1) Backend

From the `backend` directory:

```bash
npm install
node app.js
```

Required `.env` keys in `backend/.env`:

```env
MONGO_URI=<your_mongodb_uri>
PORT=5000
JWT_SECRET=<your_jwt_secret>
ADMIN_NAME=BrightPath Admin
ADMIN_EMAIL=admin@brightpath.local
ADMIN_PASSWORD=<strong_password>
```

## 2) Frontend

From the `frontend` directory:

```bash
npm install
npm run dev
```

Required `.env.local` keys in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Open `http://localhost:3000`.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin/login`

### Interview (candidate only)

- `POST /api/interview/start`
- `POST /api/interview/respond`
- `POST /api/interview/complete`
- `GET /api/interview/session/:sessionId`

### Assessment (admin only)

- `GET /api/assessment/all`
- `GET /api/assessment/sessions`
- `GET /api/assessment/report/:id`

## Manual Test Checklist

1. Candidate registers and logs in.
2. Candidate starts interview and answers by voice.
3. Adaptive mode changes across answers (Exploring/Clarifying/Refocusing).
4. Interview completes and lands on thank-you page.
5. Admin logs in and opens report.
6. Report shows score + quote + confidence for each dimension.
7. Candidate token cannot access admin endpoints.

## Tradeoffs and Design Choices

- Used deterministic local scoring for reliability, speed, and zero API-key dependency.
- Prioritized transparency: recruiters can inspect evidence quote and confidence rather than a black-box pass/fail.
- Built adaptive follow-up behavior with bounded logic to keep interview flow natural while remaining predictable.

## Future Improvements

- Add automated test suite for scoring and normalization paths.
- Add interview analytics (follow-up count, mode distribution, response quality markers).
- Add richer admin filters and compare reports across candidates.
