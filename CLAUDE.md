# DevDebug

A developer debugging knowledge hub for documenting bugs, investigations, root causes, solutions, and AI-assisted insights.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

- **Dev server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production server**: `npm run start`
- **Lint**: `npm run lint`
- **Test**: `npm run test` (single run)
- **Test watch**: `npm run test:watch`

## Neon Database

When using the Neon MCP tools:

- **Project:** `devdebug` (ID: `green-shape-46071347`)
- **Branch:** `development` (ID: `br-bitter-bar-az7rbeav`)
- **Database:** `neondb`

**IMPORTANT:** Always pass `branchId` explicitly — `production` (`br-floral-bread-azf7qqi1`) is
Neon's default branch, so omitting it silently targets production. Never run queries or
destructive operations against production unless explicitly instructed to do so.