# Customer Booking Platform

Full-stack booking platform for property owners, guests, and admins.

The repository contains:

- `backend/`: NestJS API with MongoDB, JWT authentication, role-based access control, bookings, properties, and image uploads.
- `frontend/`: Next.js application for guests, owners, and admins.

## Architecture

### Backend

- Framework: NestJS
- Database: MongoDB via Mongoose
- Auth: JWT bearer tokens
- File uploads: Cloudinary
- Global API prefix: `/api/v1`
- Default port: `3000`

### Frontend

- Framework: Next.js 14 App Router
- Styling: Tailwind CSS
- State: Zustand
- Forms: React Hook Form + Zod
- API client: Axios

## Repository Structure

```text
customer-booking/
	backend/
	frontend/
	README.md
```

## Prerequisites

Install these before running the project:

- Node.js 18 or newer
- `pnpm`
- MongoDB running locally or a reachable MongoDB instance
- A Cloudinary account for image uploads

If you are running from a Windows machine against the WSL workspace, run package commands from a WSL shell instead of `cmd` or PowerShell in the UNC path.

## Setup

### 1. Install dependencies

Run these commands from WSL:

```bash
cd /home/ogalo/customer-booking/backend
pnpm install

cd /home/ogalo/customer-booking/frontend
pnpm install
```

### 2. Configure backend environment variables

Create `backend/.env` with values like these:

```env
MONGO_URI=mongodb://localhost:27017/airbnb-booking
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=7d
PORT=3000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Notes:

- `MONGO_URI` must point to a working MongoDB instance.
- Cloudinary credentials are required for property image uploads.
- The backend listens on `PORT`, and the frontend expects the API at `/api/v1`.

### 3. Configure frontend environment variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Important:

- The frontend automatically appends `/api/v1` if you provide only `http://localhost:3000`.
- If you prefer, you can also set `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`.

## How To Run The Backend

From WSL:

```bash
cd /home/ogalo/customer-booking/backend
pnpm start:dev
```

Backend URLs:

- API base URL: `http://localhost:3000/api/v1`
- Auth endpoints:
	- `POST /api/v1/auth/register`
	- `POST /api/v1/auth/login`

Useful backend commands:

```bash
pnpm start:dev
pnpm build
pnpm start:prod
pnpm test
pnpm test:e2e
pnpm lint
```

## How To Run The Frontend

Because the backend defaults to port `3000`, the easiest local setup is to run the frontend on `3001`.

From WSL:

```bash
cd /home/ogalo/customer-booking/frontend
pnpm dev -- --port 3001
```

Frontend URL:

- App: `http://localhost:3001`

Useful frontend commands:

```bash
pnpm dev -- --port 3001
pnpm build
pnpm start -- --port 3001
pnpm lint
```

If you want the frontend on port `3000`, change one of these:

- Move the backend to another port by changing `backend/.env`.
- Update `NEXT_PUBLIC_API_URL` to match the backend port.

## Recommended Local Run Order

1. Start MongoDB.
2. Start the backend.
3. Start the frontend on port `3001`.
4. Open `http://localhost:3001`.
5. Register a user and choose a role such as `user` or `owner`.

## Core Roles And Flows

### Guest / User

- Register and log in
- Browse approved properties
- Create bookings
- View, cancel, and delete eligible bookings

### Owner

- Register and log in as an owner
- Create and edit properties
- Upload listing images
- Review bookings for owned properties
- Confirm or complete bookings

### Admin

- Access admin dashboard routes
- Review property status data
- Approve or reject pending properties

## Assumptions I Made

- I assumed this system is intended to manage multiple Airbnb owners on a shared platform, not a system for one Airbnb owner only.
- I assumed MongoDB and Cloudinary are acceptable infrastructure dependencies for local development and image handling.
- I assumed role-based dashboards are part of the intended product design: guest, owner, and admin.

## Improvements I Would Make With More Time

- Enable real-time reviews for each property
- Enable sending emails for real-time updates to all relevant parties, such as booking confirmations, cancellations, property approval updates, and owner notifications.
- Add dedicated admin APIs for listing all users and all properties across statuses instead of deriving admin screens from existing endpoints.
- Add refresh-token support and more durable session handling.
- Add seeded demo data and `.env.example` files for faster onboarding.
- Add stronger automated coverage for role-based flows, bookings, and upload behavior.
- Add production-ready observability, including request logging, error reporting, and health checks.

## Known Development Notes

- The backend currently uses `/api/v1` as the global prefix.
- The frontend middleware uses auth cookies for route protection.
- Property uploads depend on working Cloudinary credentials.
- Running both apps on the same port will cause a conflict unless one port is changed.

## Quick Start

```bash
# terminal 1
cd /home/ogalo/customer-booking/backend
pnpm start:dev

# terminal 2
cd /home/ogalo/customer-booking/frontend
pnpm dev -- --port 3001
```

Then open `http://localhost:3001`.
