# Seed Data Specification

## Overview

Create a seed script (`prisma/seed.ts`) to populate the database with sample data for development and demos.

## Requirements

### User

- **Email:** demo@devdebug.com
- **Name:** Demo User
- **Password:** 12345678 (hash with bcryptjs, 12 rounds)
- **isPro:** false
- **emailVerified:** current date
