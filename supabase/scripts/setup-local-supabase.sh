#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}    Shop2Give Local Supabase Setup      ${NC}"
echo -e "${YELLOW}=========================================${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}Error: docker-compose is not installed or not in PATH.${NC}"
  echo -e "${YELLOW}If you're using Docker Desktop, it should be included.${NC}"
  echo -e "${YELLOW}If using standalone Docker, please install docker-compose separately.${NC}"
  exit 1
fi

# Function to check if a command was successful
check_success() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo -e "${RED}✗ Failed${NC}"
    exit 1
  fi
}

# Step 1: Create .env.local file if it doesn't exist
echo -e "\n${YELLOW}Step 1: Setting up environment variables...${NC}"
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  echo -e "Created .env.local file from example"
else
  echo -e "Using existing .env.local file"
fi
check_success

# Step 2: Start Docker Compose services
echo -e "\n${YELLOW}Step 2: Starting Supabase services with Docker Compose...${NC}"
cd "$(dirname "$0")/../.."
docker-compose down -v > /dev/null 2>&1 # Ensure clean start
docker-compose up -d
check_success

# Step 3: Wait for PostgreSQL to be ready
echo -e "\n${YELLOW}Step 3: Waiting for PostgreSQL to be ready...${NC}"
attempt=1
max_attempts=30
until docker exec supabase_db pg_isready -U postgres > /dev/null 2>&1 || [ $attempt -eq $max_attempts ]; do
  echo -e "Waiting for PostgreSQL to be ready... (Attempt $attempt/$max_attempts)"
  sleep 2
  attempt=$((attempt+1))
done

if [ $attempt -eq $max_attempts ]; then
  echo -e "${RED}PostgreSQL did not become ready in time. Please check Docker logs.${NC}"
  exit 1
else
  echo -e "${GREEN}PostgreSQL is ready!${NC}"
fi

# Step 4: Initialize database with schema
echo -e "\n${YELLOW}Step 4: Initializing database schema...${NC}"
cat ./supabase/migrations/*.sql | docker exec -i supabase_db psql -U postgres -d postgres
check_success

# Step 5: Display information
echo -e "\n${YELLOW}Step 5: Setup complete!${NC}"
echo -e "\n${GREEN}Supabase Local Development Environment is now running!${NC}"
echo -e "\n${YELLOW}Access points:${NC}"
echo -e "• REST API:        ${GREEN}http://localhost:3000${NC}"
echo -e "• Auth API:        ${GREEN}http://localhost:9999${NC}"
echo -e "• Database:        ${GREEN}postgresql://postgres:postgres@localhost:5432/postgres${NC}"

echo -e "\n${YELLOW}Credentials:${NC}"
echo -e "• Anon Key:        ${GREEN}eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0${NC}"
echo -e "• Service Role Key: ${GREEN}eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Start your Shop2Give application with: ${GREEN}npm run dev${NC}"
echo -e "2. To stop Supabase services when done: ${GREEN}docker-compose down${NC}"
echo -e "3. For more information, see: ${GREEN}SUPABASE-LOCAL.md${NC}"

echo -e "\n${YELLOW}=========================================${NC}"
echo -e "${GREEN}Setup complete! Happy coding!${NC}"
echo -e "${YELLOW}=========================================${NC}"
