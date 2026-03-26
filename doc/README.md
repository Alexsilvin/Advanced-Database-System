# NEON-GRID Documentation Hub

This folder contains the formal documentation package for the **NEON-GRID game commerce platform**.

NEON-GRID is a web platform where users browse games, add games to a bucket (cart), acquire (purchase) games, manage a personal game library, and interact with social features (friends and notifications).

## Documentation Index

- [Software Requirements Specification (SRS)](./SRS.md)
- [Technical Stack Report](./TECH_STACK.md)
- [Architecture and System Design](./ARCHITECTURE.md)
- [Database Design and Entity Relationships](./DATABASE_DESIGN.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Setup, Configuration, and Runbook](./SETUP_AND_RUNBOOK.md)
- [Test Strategy and QA Report Template](./reports/TEST_STRATEGY_AND_QA.md)
- [Deployment and Operations Report](./reports/DEPLOYMENT_AND_OPERATIONS.md)
- [Project Summary Report](./reports/PROJECT_SUMMARY_REPORT.md)
- [UML Index](./uml/UML_INDEX.md)

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create and fill the environment file:
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` to a valid PostgreSQL connection string
3. Start development server:
   ```bash
   npm run dev
   ```
4. Open:
   - Application: `http://localhost:3000`
   - API sample endpoint: `http://localhost:3000/api/games`

## Scope Covered by This Documentation

- Functional scope of a game-selling platform
- Data model and relationship mapping for all current entities
- End-to-end feature flows (store, acquisition, library, social)
- SRS with requirements and acceptance criteria
- UML diagrams for analysis and communication
- Operational guidance for setup, deployment, and testing

## Notes

- The current application has a hybrid architecture:
  - React + Vite frontend (single-page application)
  - Express server as API layer and runtime host
  - PostgreSQL as primary persistent store
- Some social/notification features are currently mocked in the UI and documented with their current and target states.
