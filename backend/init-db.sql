-- Initialize database with required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create indexes for better performance (will be created by Prisma migrations)
-- This file runs before Prisma migrations