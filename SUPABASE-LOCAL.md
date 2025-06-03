# Running Shop2Give with Local Supabase

This guide explains how to run the Shop2Give project with a local Supabase instance using Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine
- Node.js (version 16 or higher)
- npm or yarn

## Setup Steps

### 1. Start the Supabase Local Development Environment

You can start the Supabase local environment using npm:

```bash
# Start all Supabase services and initialize the database
npm run supabase:setup
```

Alternatively, you can start services manually:

```bash
# Start Supabase services
docker-compose up -d
```

This will start the following services:
- PostgreSQL database
- PostgREST (REST API)
- GoTrue (authentication)
- Storage API
- Postgres Meta (database management)
- Inbucket (email testing)

### 2. Configure Environment Variables

Copy the example environment file to create your local `.env` file:

```bash
cp .env.local.example .env.local
```

The default values in the `.env.local.example` file are already configured to work with the local Supabase instance.

### 3. Access Local Services

Once all services are running, you can access the following endpoints:

- **REST API:** http://localhost:3000
- **Auth API:** http://localhost:9999
- **Storage API:** http://localhost:5000
- **Database:** postgresql://postgres:postgres@localhost:5432/postgres
- **Meta API:** http://localhost:8080
- **Mail Interface:** http://localhost:9000

### 4. Initialize Database Schema

You'll need to initialize your database schema. You can do this through the Supabase Studio SQL Editor or by running SQL scripts:

```bash
# Example: Run a SQL script to create your schema
cat ./supabase/migrations/*.sql | docker exec -i supabase_db psql -U postgres -d postgres
```

### 5. Start the Shop2Give Application

Once Supabase is running and configured, start the Shop2Give application:

```bash
npm run dev
```

Your application should now be running with the local Supabase instance.

## Stopping the Services

To stop all Supabase services:

```bash
docker-compose down
```

To stop and remove all data (volumes):

```bash
docker-compose down -v
```

## Troubleshooting

### Database Connection Issues

If you're having trouble connecting to the database, check if PostgreSQL is running:

```bash
docker ps | grep postgres
```

### Missing Tables

If your application can't find expected tables, make sure you've initialized the database schema correctly.

### Auth Issues

For auth-related issues, check the GoTrue logs:

```bash
docker logs supabase-auth
```

## Advanced Configuration

For advanced configuration of the Supabase services, refer to the [Supabase Local Development](https://supabase.com/docs/guides/local-development) documentation.

## Migrating from Remote to Local

If you were previously using a remote Supabase instance, you may need to export data from your remote instance and import it into your local one. The Supabase CLI can help with this process.
