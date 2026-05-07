# Barber Shop Appointment Swap System

A web application that lets barber shop clients swap their appointments with each other safely and atomically.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL via [Supabase](https://supabase.com) (free tier)
- **ORM**: Prisma
- **Auth**: NextAuth.js (email + password)
- **Email**: [Resend](https://resend.com) (free tier — 100 emails/day)
- **Hosting**: [Vercel](https://vercel.com) (free tier)
- **Styling**: Tailwind CSS

---

## One-Time Setup (≈ 20 minutes)

### 1. Database — Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, choose a name and strong password
3. Once ready, go to **Settings → Database**
4. Copy the **Connection string (URI)** under "Connection pooling" — use port `6543`
5. Replace `[YOUR-PASSWORD]` with your actual password

### 2. Email — Resend

1. Go to [resend.com](https://resend.com) and create a free account
2. Click **API Keys → Create API Key**
3. Copy the key (starts with `re_`)
4. For the `EMAIL_FROM` field, use `YourShopName <noreply@resend.dev>` (works without a custom domain on the free plan)

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="Barber Swap <noreply@resend.dev>"
NEXT_PUBLIC_SHOP_NAME="Your Shop Name"
```

### 4. Install & Run

```bash
npm install
npm run db:push      # creates all tables in Supabase
npm run dev          # starts at http://localhost:3000
```

---

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Under **Environment Variables**, add all five variables from your `.env.local`
4. Change `NEXTAUTH_URL` to your Vercel URL (e.g. `https://yourapp.vercel.app`)
5. Click **Deploy**

After deploy, share the URL with your barber to pass on to clients.

---

## How It Works

1. **Register** — clients create an account using the same name + email as their booking site profile
2. **Add Appointment** — enter the date and time from your booking confirmation
3. **List for Swap** — if you can't attend, click "List for swap" and select preferred alternative dates/times
4. **Browse & Request** — other clients browse the swap board and click "Request Swap", offering their own appointment in exchange
5. **Accept/Decline** — you get a notification and email; accept to complete the swap atomically, or decline
6. **Confirmation** — both parties receive email confirmation with their new appointment details

### Safety Guarantees

- Every swap runs in a **single database transaction** — either both appointments update or neither does
- Double-booking is impossible due to a unique constraint on `(date, timeSlot)`
- A listing can only accept one swap request at a time
- Past appointments cannot be listed or swapped

---

## Appointment Time Slots

The system has 14 daily slots (9:00 AM – 3:30 PM in 30-minute increments).
Edit `src/lib/constants.ts` → `TIME_SLOTS` array to match your barber's actual schedule.
