# NestJS Backend Test Task

## Description

A RESTful API service built with NestJS, TypeScript, Prisma, and GraphQL, supporting user registration, standard login, and biometric login.

## Prerequisites

- Node.js
- Docker
- npm
- PostGres

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/sir-etiosa/nestJS_Task.git
   cd nest-js_task
   ```

2. run install
   npm install
3. Copy env.example variable to .env ?? setup yours
   cp .env.example .env

   # Create test environment file

   cp .env.example .env.test

4. Set up the database:

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

4. Run
   npm run start:dev && Run test with "npm run test:e2e"

thanks
