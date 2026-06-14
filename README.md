# Cafe POS System

A point-of-sale and back-office management system for a cafe or small restaurant, built with Next.js. It covers order taking, kitchen display, catalog and staff management, and sales reporting in a single application.

## Features

**POS Terminal**
- Table and floor layout for dine-in orders, plus quick checkout for walk-ins
- Product catalog with categories, search, and live cart totals
- Coupons and promotions (percentage or fixed discounts, per-product or per-order)
- Multiple payment methods (cash, card, UPI) with change calculation
- Printable receipts and emailed receipts with a PDF attachment

**Kitchen Display System (KDS)**
- Live ticket board showing items to cook, in progress, and completed
- Real-time updates across devices via Server-Sent Events (SSE)

**Admin Dashboard**
- Catalog management: categories, products, floors, and tables
- Customer directory
- Coupon and promotion management
- Payment method configuration
- User management with role-based access (Admin / Employee)
- Sales, item, employee, and discount reports with CSV/Excel export

**Accounts & Access**
- Email/password authentication via Better Auth
- First registered user automatically becomes an Admin
- Route protection for admin-only and authenticated areas

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) with React 19 and TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) (Radix-based components)
- [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- [Better Auth](https://www.better-auth.com/) for authentication and sessions
- [Resend](https://resend.com/) for transactional email, [PDFKit](https://pdfkit.org/) for receipt PDFs
- [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible storage) for product images

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) 1.2 or later (the project uses `bun.lock`)
- A PostgreSQL database
- A [Resend](https://resend.com/) account and verified sending domain (for receipt emails)
- A Cloudflare R2 bucket (for product image uploads)

### 1. Install dependencies

```bash
bun install
```

This also runs `prisma generate` automatically via the `postinstall` script.

### 2. Configure environment variables

Create a `.env` file in the project root with the following variables:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret used to sign session tokens |
| `BETTER_AUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket used for uploaded images |
| `R2_ACCOUNT_ID` | Cloudflare account ID (used to build the R2 endpoint) |
| `R2_PUBLIC_DOMAIN` | Public base URL for serving uploaded files |
| `RESEND_API_KEY` | API key for sending email via Resend |
| `RESEND_DOMAIN` | Verified domain used as the receipt sender address |

### 3. Set up the database

Push the Prisma schema to your database:

```bash
bun run db:push
```

Then seed it with demo data (categories, products, floors, tables, staff accounts, and about 30 days of order history):

```bash
bun run db:seed
```

The seed script prints a list of demo accounts when it finishes. All demo accounts share the password `Demo@1234`:

| Role | Email |
| --- | --- |
| Admin | `admin@cafepos.com` |
| Employee | `priya@cafepos.com` |
| Employee | `rahul@cafepos.com` |
| Employee | `sara@cafepos.com` |
| Employee | `vikram@cafepos.com` |

### 4. Run the development server

```bash
bun run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). The POS terminal is at `/pos`, the kitchen display at `/kds`, and the admin dashboard at `/admin`.

## Available scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Build the app for production |
| `bun run start` | Start the production server |
| `bun run lint` | Run ESLint |
| `bun run format` | Format the codebase with Prettier |
| `bun run typecheck` | Run the TypeScript compiler without emitting files |
| `bun run db:generate` | Regenerate the Prisma client |
| `bun run db:push` | Push the Prisma schema to the database |
| `bun run db:migrate` | Create and apply a Prisma migration |
| `bun run db:studio` | Open Prisma Studio |
| `bun run db:seed` | Seed the database with demo data |

## Project structure

```
app/
  (auth)/        Login and signup pages
  (pos)/         POS terminal and kitchen display (KDS)
  admin/         Admin dashboard, catalog, reports, and settings
  api/           REST and SSE API routes
components/      Shared and feature-specific UI components
lib/             Database client, auth config, pricing, reports, utilities
prisma/          Database schema and seed script
```

## Authentication and roles

The first account ever created is automatically promoted to `ADMIN`; every account after that defaults to `EMPLOYEE`. Admins have access to the `/admin` section (catalog, reports, users, payment methods, and discounts), while employees can use the POS terminal, the kitchen display, and order history.
