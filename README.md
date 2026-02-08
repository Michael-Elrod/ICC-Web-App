# ICC Web App

A construction project management platform built with Next.js 14 for managing jobs, phases, tasks, materials, and team collaboration. Features role-based access control, calendar visualization, Gantt-style timelines, and AWS cloud integration.

## Tech Stack

| Layer          | Technology                                            |
| -------------- | ----------------------------------------------------- |
| Framework      | Next.js 14 (App Router), React 18, TypeScript 5       |
| Styling        | Tailwind CSS 3 (class-based dark mode)                |
| Authentication | NextAuth 4 (Credentials provider, JWT sessions)       |
| Database       | MySQL 8+ via mysql2/promise (connection pooling, TLS) |
| File Storage   | AWS S3                                                |
| Email          | AWS SES                                               |
| UI Libraries   | FullCalendar, Chart.js, React DatePicker, React Icons |

## Architecture Overview

The app follows the Next.js App Router convention with colocated API routes, page components, and shared libraries. The frontend uses client-side React components with NextAuth session management. The backend is a set of RESTful API route handlers that interact with a MySQL database and AWS services.

### Key Patterns

- **Role-Based Access Control** -- Four user types: `Owner`, `Admin`, `User`, `Client` with progressively restricted permissions
- **Phase-Based Project Structure** -- Jobs contain phases; phases contain tasks, materials, and notes
- **Status Tracking** -- Tasks and materials are bucketed into `overdue`, `next_7_days`, and `7_days_plus` based on calculated dates
- **JWT Authentication** -- 30-day session tokens with middleware-protected routes
- **Database Transactions** -- Job creation and user registration use transactions for consistency

## Folder Tree

```
ICC-Web-App/
├── app/                                    # Next.js App Router (pages + API)
│   ├── layout.tsx                          # Root HTML layout, fonts, metadata
│   ├── page.tsx                            # Login page (redirects if authenticated)
│   ├── globals.css                         # Tailwind base + custom styles
│   ├── utils.tsx                           # Date formatting, validation helpers
│   ├── generate-hash.tsx                   # Password hash generation utility
│   │
│   ├── api/                                # Backend API route handlers
│   │   ├── auth/[...nextauth]/route.ts     # NextAuth sign-in/callback/session
│   │   ├── register/route.ts              # User registration (invite code required)
│   │   ├── reset-password/route.ts        # Password reset token flow
│   │   ├── invite/route.ts                # Send invitation emails via SES
│   │   ├── calendar/route.ts              # Calendar event data
│   │   ├── unsubscribe/route.ts           # Email notification opt-out
│   │   ├── settings/
│   │   │   ├── route.ts                   # General settings
│   │   │   └── password/route.ts          # Change password
│   │   ├── users/
│   │   │   ├── route.ts                   # List all users
│   │   │   ├── [userId]/route.ts          # Update user
│   │   │   ├── clients/route.ts           # List client users
│   │   │   └── non-clients/route.ts       # List non-client users
│   │   └── jobs/
│   │       ├── route.ts                   # List/filter jobs
│   │       ├── new/route.ts               # Create job (FormData + file uploads)
│   │       └── [id]/
│   │           ├── route.ts               # Get/update/delete job
│   │           ├── close/route.ts         # Archive job
│   │           ├── floorplan/route.ts     # Manage floorplan images
│   │           ├── copy-floorplans/route.ts # Copy floorplans between jobs
│   │           ├── tasks/[taskId]/route.ts  # Task CRUD
│   │           ├── materials/[materialId]/route.ts # Material CRUD
│   │           └── phases/
│   │               ├── route.ts           # List/create phases
│   │               └── [phaseId]/
│   │                   ├── route.ts       # Update/delete phase
│   │                   ├── tasks/route.ts     # Phase tasks
│   │                   ├── materials/route.ts # Phase materials
│   │                   └── notes/route.ts     # Phase notes
│   │
│   ├── jobs/                               # Job management pages
│   │   ├── page.tsx                        # Job overview listing
│   │   ├── layout.tsx                      # Jobs section layout
│   │   ├── active/page.tsx                 # Active jobs view
│   │   ├── closed/page.tsx                 # Closed/archived jobs view
│   │   ├── new/page.tsx                    # Create new job form
│   │   └── [id]/
│   │       ├── page.tsx                    # Job detail (phases, tasks, materials)
│   │       └── layout.tsx                  # Job detail layout
│   │
│   ├── calendar/page.tsx                   # FullCalendar with job phases/tasks
│   ├── contacts/page.tsx                   # User/contact management
│   ├── settings/page.tsx                   # Profile and password settings
│   ├── forgot-password/page.tsx            # Password reset request
│   ├── reset-password/page.tsx             # Password reset (token-based)
│   ├── unsubscribe/page.tsx                # Email notification preferences
│   │
│   ├── lib/                                # Core server-side utilities
│   │   ├── db.ts                           # MySQL connection pool (10 max, TLS)
│   │   ├── auth.ts                         # NextAuth config, credentials provider
│   │   ├── email.ts                        # SES email templates (reset, invite)
│   │   └── s3.ts                           # S3 upload/delete operations
│   │
│   ├── types/                              # TypeScript type definitions
│   │   ├── database.ts                     # DB entity types (User, Job, Phase, Task, Material, Note)
│   │   ├── views.ts                        # API response / view model types
│   │   ├── props.ts                        # React component prop interfaces
│   │   └── next-auth.d.ts                  # NextAuth session/JWT type extensions
│   │
│   └── providers/                          # React context providers
│       ├── AuthProvider.tsx                # SessionProvider + ThemeProvider wrapper
│       └── ThemeProvider.tsx               # next-themes dark mode provider
│
├── components/                             # Reusable React components
│   ├── calendar/
│   │   ├── EventPopup.tsx                  # Calendar event detail modal
│   │   └── Legend.tsx                      # Phase color legend
│   ├── contact/
│   │   ├── ContactCard.tsx                 # Contact display card
│   │   ├── EditUserModal.tsx               # Edit user modal
│   │   └── InviteModal.tsx                 # Send invitation modal
│   ├── job/
│   │   ├── JobFrame.tsx                    # Job card with status indicators
│   │   ├── LargeJobFrame.tsx               # Expanded job card
│   │   ├── JobButton.tsx                   # Action button
│   │   ├── StatusButton.tsx                # Status toggle button
│   │   ├── PhaseCard.tsx                   # Phase display card
│   │   ├── TasksCard.tsx                   # Tasks list card
│   │   ├── MaterialsCard.tsx               # Materials list card
│   │   ├── NoteCard.tsx                    # Note display card
│   │   ├── FloorplanViewer.tsx             # Floorplan image viewer
│   │   ├── FloorplanViewerID.tsx           # Floorplan viewer (by ID)
│   │   ├── CloseJobModal.tsx               # Archive job confirmation
│   │   ├── CopyJobModal.tsx                # Copy job/floorplans modal
│   │   └── DeleteJobModal.tsx              # Delete job confirmation
│   ├── login/
│   │   └── AuthForm.tsx                    # Login credentials form
│   ├── new/
│   │   ├── NewJobCard.tsx                  # Job creation form
│   │   ├── NewPhaseCard.tsx                # Phase form (nested in job creation)
│   │   ├── NewTaskCard.tsx                 # Task form (nested in phase)
│   │   ├── NewMaterialCard.tsx             # Material form (nested in phase)
│   │   ├── NewNoteCard.tsx                 # Note form (nested in phase)
│   │   ├── ClientSearch.tsx                # Client autocomplete selector
│   │   ├── ContactSearchSelect.tsx         # Contact assignment selector
│   │   └── NewClientModal.tsx              # Create new client inline
│   ├── reset/
│   │   ├── ForgotPasswordForm.tsx          # Password reset request form
│   │   └── ResetPasswordForm.tsx           # Password reset form (with token)
│   ├── tabs/
│   │   ├── NavTabs.tsx                     # Navigation tab bar
│   │   └── ContentTabs.tsx                 # Content section tabs
│   └── util/
│       ├── LayoutContent.tsx               # Main layout wrapper with sidebar
│       ├── SideBar.tsx                     # Navigation sidebar
│       ├── StatusBar.tsx                   # Status count indicators
│       ├── Timeline.tsx                    # Gantt-style timeline chart
│       ├── CardFrame.tsx                   # Card container component
│       ├── SmallCardFrame.tsx              # Compact card container
│       ├── DarkModeToggle.tsx              # Theme switcher
│       ├── EditPhaseModal.tsx              # Phase edit modal
│       └── PasswordModal.tsx               # Change password modal
│
├── handlers/                               # Form/data handler utilities
│   └── new/
│       ├── jobs.tsx                         # Job creation handler logic
│       ├── phases.tsx                       # Phase creation handler logic
│       ├── tasks.tsx                        # Task creation handler logic
│       └── materials.tsx                    # Material creation handler logic
│
├── data/                                   # Static data templates
│   ├── Slab.tsx                            # Slab foundation phase template
│   └── Crawl Space.tsx                     # Crawl space foundation template
│
├── middleware.ts                           # Route protection (NextAuth middleware)
├── next.config.js                          # Next.js config (images, CORS, CSS)
├── tailwind.config.ts                      # Tailwind config (dark mode, fonts)
├── tsconfig.json                           # TypeScript config (strict, path aliases)
├── package.json                            # Dependencies and scripts
└── .eslintrc.json                          # ESLint configuration
```

## Data Model

```
Job (1) ──── (*) Phase (1) ──── (*) Task
                          ├──── (*) Material
                          └──── (*) Note

User ──── (*) user_task ──── Task
User ──── (*) user_material ──── Material
User (Client) ──── (*) Job
```

**User types:** `Owner` | `Admin` | `User` | `Client`
**Job status:** `active` | `closed`
**Item status:** `Incomplete` | `Complete`

## API Routes

| Method | Endpoint                                  | Description                 |
| ------ | ----------------------------------------- | --------------------------- |
| POST   | `/api/auth/[...nextauth]`                 | NextAuth authentication     |
| POST   | `/api/register`                           | Register with invite code   |
| POST   | `/api/reset-password`                     | Request password reset      |
| POST   | `/api/invite`                             | Send invitation email       |
| POST   | `/api/unsubscribe`                        | Email opt-out               |
| GET    | `/api/users`                              | List all users              |
| PUT    | `/api/users/:userId`                      | Update user                 |
| GET    | `/api/users/clients`                      | List clients                |
| GET    | `/api/users/non-clients`                  | List non-clients            |
| PUT    | `/api/settings/password`                  | Change password             |
| GET    | `/api/jobs`                               | List jobs (overview/detail) |
| POST   | `/api/jobs/new`                           | Create job + floorplans     |
| GET    | `/api/jobs/:id`                           | Job detail                  |
| PUT    | `/api/jobs/:id`                           | Update job                  |
| DELETE | `/api/jobs/:id`                           | Delete job                  |
| POST   | `/api/jobs/:id/close`                     | Archive job                 |
| POST   | `/api/jobs/:id/floorplan`                 | Upload floorplans           |
| POST   | `/api/jobs/:id/copy-floorplans`           | Copy floorplans             |
| CRUD   | `/api/jobs/:id/phases`                    | Phase management            |
| CRUD   | `/api/jobs/:id/phases/:phaseId/tasks`     | Task management             |
| CRUD   | `/api/jobs/:id/phases/:phaseId/materials` | Material management         |
| CRUD   | `/api/jobs/:id/phases/:phaseId/notes`     | Note management             |
| POST   | `/api/calendar`                           | Calendar event data         |

## Environment Variables

| Variable                    | Purpose                  |
| --------------------------- | ------------------------ |
| `NEXTAUTH_SECRET`           | JWT signing key          |
| `NEXTAUTH_URL`              | App base URL             |
| `DB_HOST`                   | MySQL host               |
| `DB_USER`                   | MySQL user               |
| `DB_PASSWORD`               | MySQL password           |
| `DB_NAME`                   | MySQL database name      |
| `JWT_SECRET`                | Additional JWT secret    |
| `AMPLIFY_REGION`            | AWS region               |
| `AMPLIFY_ACCESS_KEY_ID`     | AWS access key           |
| `AMPLIFY_SECRET_ACCESS_KEY` | AWS secret key           |
| `SES_FROM_EMAIL`            | Sender email for SES     |
| `S3_ACCESS_KEY_ID`          | S3 access key            |
| `S3_SECRET_ACCESS_KEY`      | S3 secret key            |
| `S3_BUCKET_NAME`            | S3 bucket for floorplans |
| `S3_REGION`                 | S3 bucket region         |
| `NEXT_PUBLIC_APP_URL`       | Public-facing app URL    |

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- AWS account (S3, SES configured)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```
