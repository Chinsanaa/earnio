# Earnio — System Architecture

> Deep dive: components, data flows, database schema, security model.  
> Quick map: [../context.md](../context.md) · Status & gaps: [APP_OVERVIEW.md](./APP_OVERVIEW.md)  
> Last updated: June 2026

---

## 📐 High-Level Overview

Earnio is a full-stack web application following the **SPA + REST API** pattern:

```
┌──────────────────────┐                ┌──────────────────────┐
│   Frontend (Web)     │ ────HTTPS───→ │   Backend (REST API) │
│   Next.js 16         │  Bearer JWT   │   Express 5          │
│   React 19           │ ←──Cookies─── │   TypeScript         │
│   Port 3000          │                │   Port 3001          │
└──────────────────────┘                └──────────────────────┘
           │                                       │
           └──────────────┬──────────────────────┘
                          │ JDBC / HTTP
                          ▼
                  ┌──────────────────┐
                  │   Supabase       │
                  │  PostgreSQL      │
                  │  Auth (JWT)      │
                  │  RLS Policies    │
                  └──────────────────┘
```

---

## 🏗 Frontend Architecture (`frontend/`)

### Technology Stack
- **Framework:** Next.js 16 (App Router, Server Components, Turbopack)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4 + custom design tokens
- **Icons:** Lucide React
- **State Management:** Context API (Auth context)
- **HTTP Client:** Fetch API with custom wrapper
- **Authentication:** JWT tokens in cookies + localStorage

### Directory Structure

```
frontend/
├── app/                          # App Router pages
│   ├── (auth)/                   # Auth group (login, signup)
│   │   ├── login/
│   │   │   ├── creator/page.tsx  # Creator login
│   │   │   └── sponsor/page.tsx  # Sponsor login
│   │   └── signup/
│   │       ├── creator/page.tsx  # Creator signup
│   │       └── sponsor/page.tsx  # Sponsor signup
│   ├── dashboard/                # Creator dashboard
│   ├── sponsorships/             # Sponsorship marketplace
│   ├── platforms/                # Platform connections
│   ├── wallet/                   # Wallet & payouts
│   ├── sponsor/                  # Sponsor app
│   ├── page.tsx                  # Home / landing page
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── landing/                  # Landing page sections
│   ├── auth/                     # Login/signup forms
│   ├── brand/                    # Earnio logo, branding
│   ├── layout/                   # App shells (CreatorShell, SponsorShell)
│   ├── ui/                       # Reusable UI components (buttons, cards, modals)
│   └── dashboard/                # Dashboard-specific components
│
├── lib/
│   ├── api/                      # API client and endpoints
│   │   ├── client.ts             # Fetch wrapper with auth
│   │   ├── dashboard.ts          # Dashboard endpoints
│   │   ├── platforms.ts          # Platform sync endpoints
│   │   ├── sponsorships.ts       # Sponsorship endpoints
│   │   └── wallet.ts             # Wallet endpoints
│   ├── auth.ts                   # Auth helpers (getMe, logout, etc.)
│   ├── types.ts                  # TypeScript interfaces
│   ├── hooks/                    # Custom React hooks
│   └── brand/                    # Brand constants (colors, slogans)
│
├── contexts/
│   └── AuthContext.tsx           # User auth state (login, logout, user)
│
├── middleware.ts                 # Edge middleware (auth redirect, role check)
├── proxy.ts                      # Auth middleware (old, edge-based protection)
└── tailwind.config.ts            # Tailwind config + design tokens
```

### Key Components

#### AuthContext (`lib/contexts/AuthContext.tsx`)

Manages user session state:
- `user` — Current logged-in user (or null)
- `isAuthenticated` — Boolean flag
- `login()` — Sign in and get tokens
- `signup()` — Create new account
- `logout()` — Clear tokens and session
- Persists login across browser restarts via sessionStorage + localStorage

#### API Client (`lib/api/client.ts`)

Wraps `fetch()` with:
- Bearer token injection in Authorization header
- Automatic token refresh on 401 response
- CORS credentials (cookies)
- 30-second timeout
- Offline detection
- Error handling with AppError type

Example usage:
```typescript
const data = await apiClient.get('/api/dashboard/summary', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### App Shells

**CreatorShell** (`components/layout/CreatorShell.tsx`):
- Desktop: Sidebar navigation (min-width: 768px)
- Mobile: Bottom tab bar (< 768px)
- Header with theme toggle, profile dropdown
- Single-tab navigation system

**SponsorShell** (`components/layout/SponsorShell.tsx`):
- Similar layout; sponsor-specific navigation

#### Middleware (`middleware.ts`)

Edge runtime middleware that:
1. Checks for `ct-access-token` cookie
2. Reads `ct-user-type` cookie (creator|sponsor)
3. Redirects unauthenticated users to `/login`
4. Redirects users to correct dashboard based on role:
   - Creator → `/dashboard`
   - Sponsor → `/sponsor/dashboard`

### Authentication Flow

**Login/Signup:**
1. User submits email/password
2. Frontend calls `POST /api/auth/signup` or `POST /api/auth/login`
3. Backend verifies, returns `{ accessToken, user }`
4. Frontend stores access token in memory + httpOnly cookie `ct-access-token`
5. Backend also sets httpOnly refresh cookie `ct-refresh-token`
6. Frontend stores `ct-user-type` cookie for role-based routing
7. Middleware redirects to `/dashboard` (or `/sponsor/dashboard`)

**Session Persistence:**
1. On app load, check sessionStorage for stored user
2. If found, restore user state without API call
3. If not, fetch `/api/auth/me` to check if tokens still valid
4. If 401, user is logged out; show login page

**Token Refresh:**
1. When API returns 401, frontend calls `POST /api/auth/refresh`
2. Backend validates httpOnly refresh cookie
3. Backend returns new access token
4. Frontend retries original request with new token
5. If refresh fails, user is logged out

---

## 🔌 Backend Architecture (`backend/`)

### Technology Stack
- **Framework:** Express 5 with TypeScript
- **Database:** Supabase (PostgreSQL 15+)
- **Authentication:** JWT (Supabase Auth)
- **Email:** Resend
- **Environment:** Node.js 20+

### Directory Structure

```
backend/
├── src/
│   ├── app.ts                    # Express app factory
│   ├── index.ts                  # Server entry point
│   │
│   ├── routes/                   # HTTP endpoint handlers
│   │   ├── auth.ts               # POST /signup, /login, /refresh, /logout, /me
│   │   ├── dashboard.ts          # GET /dashboard/summary, /trends
│   │   ├── platforms.ts          # GET/POST /platforms, /sync
│   │   ├── sponsorships.ts       # GET/POST /sponsorships, /apply
│   │   ├── sponsor.ts            # Sponsor-specific endpoints
│   │   ├── wallet.ts             # GET/POST /wallet, /payouts
│   │   ├── notifications.ts      # GET /notifications
│   │   ├── sync.ts               # POST /sync/cron (background job)
│   │   ├── health.ts             # GET /health
│   │   └── legal.ts              # GET /privacy-policy, /terms
│   │
│   ├── services/                 # Business logic
│   │   ├── authService.ts        # User auth, signup, login, session
│   │   ├── dashboardService.ts   # Earnings aggregation
│   │   ├── platformService.ts    # Platform sync logic
│   │   ├── sponsorshipService.ts # Campaign and application logic
│   │   ├── walletService.ts      # Balance, payouts, transactions
│   │   └── notificationService.ts
│   │
│   ├── database/
│   │   └── supabase.ts           # Supabase client + RLS
│   │
│   ├── proxy/
│   │   └── authProxy.ts          # JWT verification middleware
│   │
│   ├── jobs/
│   │   └── syncScheduler.ts      # Background sync scheduler
│   │
│   ├── platforms/
│   │   └── mockPlatformProvider.ts # Fake TikTok/YouTube/Instagram
│   │
│   ├── emails/
│   │   └── templates.ts          # Email HTML templates
│   │
│   ├── types.ts                  # TypeScript types
│   ├── errors.ts                 # Custom error classes
│   └── config.ts                 # Environment config
│
├── tests/
│   ├── auth.test.ts              # Auth endpoint tests
│   ├── dashboard.test.ts         # Dashboard endpoint tests
│   └── sync.test.ts              # Sync cron tests
│
├── .env.example                  # Environment variable template
└── package.json
```

### Core Services

#### AuthService (`services/authService.ts`)

Handles:
- Email/password signup (create Supabase user + profile row)
- Email/password login (verify credentials, return JWT)
- Logout (clear refresh token)
- Refresh token validation
- Get current user (`/api/auth/me`)
- User metadata (name, username, user_type, terms_accepted_at)

#### DashboardService (`services/dashboardService.ts`)

Aggregates creator earnings:
- Total earned, pending payout, fees charged
- Monthly trends (last 12 months)
- Per-platform breakdown (TikTok, YouTube, Instagram)
- Recent transaction list
- Platform connection status

#### PlatformService (`services/platformService.ts`)

Manages platform integrations:
- List connected accounts
- Add platform account (username validation)
- Sync earnings from mock provider
- Store sync history
- Update platform earnings in database

#### SponsorshipService (`services/sponsorshipService.ts`)

Sponsorship marketplace logic:
- List active campaigns (paginated)
- Get campaign details
- Submit application (creator can apply to campaign)
- View my applications (track status)
- Create campaign (sponsor only)
- Manage campaign (sponsor only)
- Approve/reject applications (sponsor only)

#### WalletService (`services/walletService.ts`)

Wallet & payout management:
- Get balance (available, pending, earned, fees)
- Transaction history
- Add bank account
- Request payout (50,000 MNT minimum)
- Track payout status

### Middleware

#### verifyToken (`proxy/authProxy.ts`)

JWT verification middleware:
```typescript
app.use('/api', verifyToken); // Protects all /api routes

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

#### Role Enforcement (`services/`)

Services call `assertCreator(userId)` or `assertSponsor(userId)` to enforce role:
```typescript
function assertSponsor(userId) {
  const user = await supabase.from('users').select('user_type').eq('id', userId).single();
  if (user.user_type !== 'sponsor') {
    throw new AppError('Only sponsors can create campaigns', 403);
  }
}
```

#### Error Handler

Global error handler that:
- Catches all errors and formats as JSON
- Returns appropriate HTTP status codes
- Logs errors
- Never exposes sensitive info in responses

### Background Jobs

#### Sync Scheduler (`jobs/syncScheduler.ts`)

Periodic platform earnings sync:
- **In-process:** `setInterval()` every 6 hours (development only)
- **External cron:** `POST /api/sync/cron` endpoint with secret header (production)
- Queries all users
- Calls mock platform provider to get earnings
- Updates earnings table
- Sends notification to user

---

## 🗄 Database Architecture (`supabase/migrations/`)

### Tables

```sql
-- Users table (linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  user_type TEXT CHECK (user_type IN ('creator', 'sponsor')),
  avatar_url TEXT,
  terms_accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Platform accounts (TikTok, YouTube, Instagram)
CREATE TABLE platform_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('tiktok', 'youtube', 'instagram')),
  username TEXT NOT NULL,
  follower_count BIGINT DEFAULT 0,
  connected_at TIMESTAMP DEFAULT NOW(),
  last_synced_at TIMESTAMP,
  UNIQUE(user_id, platform)
);

-- Earnings (from platform sync)
CREATE TABLE earnings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform_account_id UUID REFERENCES platform_accounts(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'MNT',
  earned_at TIMESTAMP NOT NULL,
  synced_at TIMESTAMP DEFAULT NOW(),
  source TEXT DEFAULT 'platform_sync'
);

-- Sponsorships (campaigns)
CREATE TABLE sponsorships (
  id UUID PRIMARY KEY,
  sponsor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  brief TEXT,
  budget DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'MNT',
  requirements TEXT,
  deadline TIMESTAMP,
  status TEXT CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Applications (creator applies to sponsorship)
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  sponsorship_id UUID REFERENCES sponsorships(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pitch TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  sponsor_notes TEXT,
  applied_at TIMESTAMP DEFAULT NOW(),
  decided_at TIMESTAMP,
  UNIQUE(sponsorship_id, creator_id)
);

-- Wallet transactions
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'MNT',
  type TEXT CHECK (type IN ('sponsorship_earned', 'platform_fee', 'pending_payout', 'completed_payout')),
  description TEXT,
  related_id UUID, -- sponsorship_id, application_id, or bank_account_id
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bank accounts (for payouts)
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'application_decision', 'payout_requested', 'earnings_synced', etc.
  title TEXT NOT NULL,
  message TEXT,
  related_id UUID, -- link to related entity
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Row-Level Security (RLS) Policies

All tables have RLS enabled:

```sql
-- Example: users can only read/write their own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update ON users
  FOR UPDATE USING (auth.uid() = id);

-- Example: creators can only see their own earnings
CREATE POLICY earnings_select ON earnings
  FOR SELECT USING (auth.uid() = user_id);

-- Example: sponsors can only see their own campaigns
CREATE POLICY sponsorships_select ON sponsorships
  FOR SELECT USING (auth.uid() = sponsor_id);
```

### Triggers

**Auto-create user profile on signup:**
```sql
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'user_type'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 🔄 Data Flow Examples

### Example 1: Creator Login Flow

```
1. User enters email/password on /login/creator
2. Frontend calls POST /api/auth/login with { email, password }
3. Backend:
   - Calls supabase.auth.signInWithPassword()
   - Gets back { session: { access_token, refresh_token }, user }
   - Creates JWT from access_token
   - Sets httpOnly cookies: ct-access-token, ct-refresh-token, ct-user-type
   - Returns { accessToken, user }
4. Frontend:
   - Stores accessToken in memory
   - Middleware sees cookie; stores ct-user-type
   - Redirects to /dashboard
5. Dashboard loads:
   - Middleware checks ct-user-type = 'creator'
   - React calls GET /api/dashboard/summary with Bearer token
   - Backend verifies JWT, queries user's earnings, returns data
   - Component renders dashboard with real data
```

### Example 2: Platform Sync Flow

```
1. Creator clicks "Sync now" on /platforms
2. Frontend calls POST /api/platforms/sync with { platform: 'tiktok', username: 'user123' }
3. Backend:
   - Verifies user is logged in and is a creator
   - Calls mockPlatformProvider.getEarnings('tiktok', 'user123')
   - Gets back { followers: 50000, earnings: 1500, platform: 'tiktok' }
   - Inserts rows into platform_accounts and earnings tables
   - Calls notificationService.notify('earnings_synced', user_id)
4. Notification:
   - Creates row in notifications table
   - Sends email via Resend if configured
5. Frontend:
   - Receives success response
   - Refetches dashboard summary
   - Shows "Sync complete" toast
   - Dashboard earnings updated
```

### Example 3: Apply to Sponsorship Flow

```
1. Creator views sponsorship detail at /sponsorships/[id]
2. Creator enters pitch text and clicks "Apply"
3. Frontend calls POST /api/sponsorships/apply with { sponsorship_id, pitch }
4. Backend:
   - Verifies creator hasn't already applied (UNIQUE constraint)
   - Inserts row into applications table with status='pending'
   - Queries sponsor's user_id
   - Calls notificationService.notify('new_application', sponsor_id)
5. Sponsor gets notification:
   - Email sent to sponsor
   - In-app notification appears
   - Sponsor navigates to /sponsor/campaigns/[id] to review
6. Sponsor approves application:
   - Frontend calls POST /api/sponsor/applications/[id]/approve
   - Backend:
     - Updates applications row: status='approved'
     - Creates wallet_transaction: type='sponsorship_earned', amount=budget*0.8
     - Creates notification for creator
7. Creator gets notification:
   - Email + in-app notification that application was approved
   - Dashboard earnings updated
```

---

## 🔐 Security Architecture

### Authentication
- **Supabase Auth** handles password hashing, JWT generation, session management
- **JWT tokens** signed with Supabase secret; verified on every API request
- **Refresh tokens** stored in httpOnly cookies (not accessible from JS)
- **Access tokens** 1-hour TTL; automatically refreshed on 401

### Authorization
- **RLS policies** at database level enforce data isolation
- **Role checks** in services (`assertCreator`, `assertSponsor`)
- **Middleware** redirects users to correct app based on role
- **No permission escalation** — users can't change their `user_type`

### Input Validation
- **Email format** validated on signup
- **Username uniqueness** enforced in database
- **Amount validation** for payouts (minimum 50,000 MNT)
- **Enum checks** for status fields (draft|active|closed, etc.)

### Data Protection
- **Bank account masking** — only last 4 digits shown in API responses
- **Password hashing** — Supabase Auth handles bcrypt
- **CORS** — Only allowed from `FRONTEND_URL`
- **HTTPS only** — Enforced in production

---

## 📊 Deployment Topology

### Local Development
- Frontend: `npm run dev` → http://localhost:3000
- Backend: `npm run dev` → http://localhost:3001
- Database: Supabase (cloud or local)
- Email: Optional (disabled if no RESEND_API_KEY)

### Production
- Frontend: Vercel → https://earnio.app
- Backend: Render → https://api.earnio.app
- Database: Supabase (managed PostgreSQL)
- Email: Resend (transactional email service)
- Sync: External cron (GitHub Actions, AWS Lambda, etc.)

---

## 🚀 Scalability Considerations

### Current Bottlenecks
- **In-process sync scheduler** — doesn't scale beyond single instance
- **Mock platform provider** — deterministic; needs replacement with real APIs
- **Notifications** — polling every 60s; could use WebSockets for real-time
- **Database** — single Supabase instance; could need read replicas at scale

### Future Improvements
- Migrate sync to job queue (BullMQ, AWS SQS)
- Add caching layer (Redis for session storage)
- Implement WebSocket notifications
- Add database read replicas
- Consider CDN for static assets
- Implement API rate limiting

---

## 📚 Key Patterns

### Error Handling
- All errors inherit from `AppError` with `statusCode`, `message`, `code`
- Services throw `AppError`; routes catch and return JSON
- Frontend `apiClient` handles 401 by refreshing and retrying

### State Management
- **Frontend:** AuthContext for user state, localStorage for persistence
- **Backend:** Stateless (no session storage); relies on JWT
- **Database:** Source of truth for all data

### Testing
- **Backend:** Integration tests with real Supabase
- **Frontend:** None yet (planned with Jest)
- **E2E:** None yet (planned with Playwright)

---

*For feature checklist see [FEATURES.md](./FEATURES.md). For ops see [APP_OVERVIEW.md](./APP_OVERVIEW.md). Master index: [../context.md](../context.md).*
