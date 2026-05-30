# Bezon Monorepo (v4.0)

A unified multi-actor e-commerce platform built with React, TypeScript, Tailwind CSS v4, Express, and Prisma ORM + PostgreSQL.

---

## Workspace Layout
- `apps/web`: Single Vite + React + TS frontend for all 4 roles (Customer, Seller, Delivery, Admin).
- `apps/api`: Express + TypeScript API server using Prisma ORM.

---

## Start Commands

Start both backend API and unified Web App concurrently:
```bash
npm run dev
```

Or run them individually:
```bash
# Start backend API (runs on port 5000)
npm run dev:api

# Start unified frontend Web app (runs on port 3000)
npm run dev:web
```

---

## Prisma ORM Database Commands

All database management operations are executed through Prisma 7 CLI tools. Run these scripts from the root directory:

### 1. Generate Prisma Client
Re-generates type definitions whenever `prisma/schema.prisma` is modified:
```bash
npm run prisma:generate --workspace=@bezon/api
```

### 2. Run Database Migrations
Applies model schemas to the PostgreSQL database, generating migration logs:
```bash
npm run prisma:migrate --workspace=@bezon/api
```

### 3. Check Migration Status
Checks if the local PostgreSQL database is in sync with the Prisma migrations:
```bash
npm run prisma:status --workspace=@bezon/api
```

### 4. Seed Database
Seeds PostgreSQL with the initial demo credentials (Admin, Sellers, Delivery partners, and Customers):
```bash
npm run db:seed --workspace=@bezon/api
```

---

## Git Branches
- `main`: Production-ready release branch.
- `staging`: Integration branch for testing before merging to main.
- `dev-*`: Feature branches for active development.
