# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
This document defines requirements for a complete NEONGRID gaming platform while preserving traceability to the currently implemented project baseline.

### 1.2 Scope
NEONGRID is a web-based gaming platform that enables users to discover games, purchase and manage their library, connect with friends, receive notifications, and access account and support services.

This SRS includes:
- Current implementation baseline (as-is).
- Target production feature set (to-be).
- Functional and non-functional requirements.
- Data, security, and integration requirements.

### 1.3 Definitions and Acronyms
- SRS: Software Requirements Specification.
- UI: User Interface.
- API: Application Programming Interface.
- DB: Database.
- RBAC: Role-Based Access Control.
- FR: Functional Requirement.
- NFR: Non-Functional Requirement.

### 1.4 References
- README.md
- package.json
- server.ts
- netlify/functions/games.mts
- src/App.tsx
- src/services/api.ts
- src/pages/*
- src/components/*

### 1.5 Intended Audience
- Product owners and stakeholders.
- Developers and testers.
- DevOps and security reviewers.
- Instructors and evaluators.

## 2. Product Overview

### 2.1 Product Perspective
NEONGRID is a single-page application with backend API services and optional PostgreSQL persistence. The current codebase provides core store and library interactions, while this SRS defines the complete platform expected for production.

### 2.2 User Classes
- Guest user: browses public store content.
- Registered user: purchases and manages games.
- Premium user: receives membership benefits.
- Moderator: handles reports and moderation workflows.
- Administrator: manages catalog, users, and platform settings.

### 2.3 Operating Environment
- Web client on modern desktop and mobile browsers.
- Node.js runtime for backend services.
- PostgreSQL for persistent storage.
- Netlify or equivalent hosting for frontend and serverless APIs.

### 2.4 Constraints
- Frontend technology remains React + TypeScript + Vite.
- REST JSON APIs are the primary integration mechanism.
- Secrets must be provided via environment variables.

### 2.5 Assumptions
- Payment gateway and email provider are available in production.
- CDN or object storage is available for game assets.
- Platform operates under relevant privacy and consumer law.

## 3. As-Is Baseline (Current Implementation)

### 3.1 Implemented Features
1. Login entry page with visual-only sign-in flow.
2. Game store browsing with search and category presentation.
3. Game detail page with description, category, price, and hardware specs.
4. Bucket management and direct acquisition to library state.
5. Library with grid/list views and simulated install progress.
6. Friends and notifications pages with mock data.
7. Responsive navigation (desktop sidebar, mobile bottom navigation).
8. API game retrieval with DB-first and mock fallback behavior.

### 3.2 Known Limitations
1. No real authentication or password validation.
2. No persistent user state for library, bucket, installs, and notifications.
3. Friends and notifications are not backend-driven.
4. Limited write APIs and minimal account features.

## 4. To-Be Complete Platform Requirements

## 4.1 Functional Requirements

### 4.1.1 Identity and Access
- FR-1: The platform shall support user registration, login, logout, and password reset.
- FR-2: The platform shall support secure session management with token refresh.
- FR-3: The platform shall support optional social sign-in providers.
- FR-4: The platform shall enforce role-based access (user, moderator, admin).

### 4.1.2 User Profile and Account
- FR-5: Users shall be able to edit profile information (display name, avatar, bio, region).
- FR-6: Users shall be able to configure privacy settings for profile, activity, and friend requests.
- FR-7: Users shall be able to view account security logs (recent sign-ins and devices).
- FR-8: Users shall be able to manage saved payment methods and billing addresses.

### 4.1.3 Store and Discovery
- FR-9: Users shall browse a catalog by genre, tags, platform, price, and discount filters.
- FR-10: Users shall search games by title, publisher, tags, and partial keywords.
- FR-11: Users shall view featured, trending, new releases, and recommended collections.
- FR-12: Users shall view detailed game pages with trailers, screenshots, specs, reviews, and version notes.
- FR-13: Users shall add/remove games from a wishlist.
- FR-14: Users shall follow games and publishers for update alerts.

### 4.1.4 Pricing, Cart, and Checkout
- FR-15: Users shall add and remove items in a persistent cart.
- FR-16: Checkout shall support card and at least one digital wallet option.
- FR-17: The system shall calculate taxes and final totals before payment confirmation.
- FR-18: The system shall generate invoices and receipts for successful purchases.
- FR-19: The platform shall support coupon and promotional code redemption.

### 4.1.5 Library and Ownership
- FR-20: Purchased games shall be permanently recorded in user library.
- FR-21: Library shall support sort/filter by title, genre, install state, and playtime.
- FR-22: Users shall install, pause, resume, and cancel downloads.
- FR-23: The system shall preserve install status and progress after app refresh.
- FR-24: Users shall be able to hide, favorite, and create custom collections.

### 4.1.6 Social and Community
- FR-25: Users shall send, accept, decline, and block friend requests.
- FR-26: Users shall view friend presence status (online, offline, in-game).
- FR-27: Users shall have direct messaging with read receipts and mute controls.
- FR-28: Users shall be able to create private or public parties/lobbies.
- FR-29: Users shall submit game ratings and text reviews.
- FR-30: Users shall report abusive users, reviews, and chat content.

### 4.1.7 Notifications and Activity
- FR-31: The platform shall provide real-time and in-app notifications.
- FR-32: Notification types shall include purchases, friend events, promotions, updates, and security alerts.
- FR-33: Users shall configure notification preferences by channel (in-app/email/push).
- FR-34: Users shall mark notifications as read, unread, archived, and deleted.

### 4.1.8 Recommendation and Personalization
- FR-35: The platform shall provide personalized recommendations based on behavior.
- FR-36: Recommendation logic shall use ownership, playtime, wishlist, and viewed content.
- FR-37: Users shall be able to opt out of personalization features.

### 4.1.9 Admin and Operations
- FR-38: Admins shall manage game catalog entries, pricing, media, and metadata.
- FR-39: Admins shall publish discount campaigns with date windows and eligibility rules.
- FR-40: Admins shall moderate user reviews and user-generated content.
- FR-41: Admins shall suspend/reactivate accounts and enforce policy actions.
- FR-42: Admins shall access platform analytics dashboards.

### 4.1.10 Support and Compliance
- FR-43: Users shall create support tickets and view ticket status.
- FR-44: The platform shall store terms acceptance and privacy consent logs.
- FR-45: Users shall request account export and account deletion.

## 4.2 External Interface Requirements

### 4.2.1 UI Requirements
1. The UI shall be responsive for mobile, tablet, and desktop.
2. Core actions (buy, install, play, message) shall require no more than two interactions from their main screen.
3. Error and empty states shall provide clear user guidance and recovery actions.
4. The system shall provide accessibility support including keyboard navigation, focus indicators, and color-contrast compliance.

### 4.2.2 API Requirements
1. APIs shall be versioned under /api/v1.
2. APIs shall support authenticated and role-protected endpoints.
3. APIs shall return standard error objects with code, message, and request identifier.
4. APIs shall support pagination and filtering for list endpoints.

### 4.2.3 Third-Party Interfaces
1. Payment provider integration for transaction processing.
2. Email provider integration for account and purchase communication.
3. Object storage/CDN integration for media delivery.
4. Optional telemetry provider for analytics and error monitoring.

## 4.3 Data Requirements

### 4.3.1 Core Entities
The platform shall maintain at least the following entities:
- User
- Session
- Role and Permission
- Game
- Publisher
- Price and Discount
- Cart and CartItem
- Order and Payment
- LibraryEntry
- WishlistEntry
- Review
- Friendship and FriendRequest
- Message and Conversation
- Notification
- SupportTicket
- AuditLog

### 4.3.2 Data Integrity Rules
1. A user cannot own duplicate entries for the same game.
2. A game purchase must create both order and library records atomically.
3. Deleting a user must follow configured retention and legal requirements.
4. Monetary values shall be stored with fixed precision.

## 4.4 Non-Functional Requirements

### 4.4.1 Performance
- NFR-1: 95th percentile API response for catalog endpoints shall be less than 500 ms under target load.
- NFR-2: Initial meaningful render shall complete within 3 seconds on broadband and modern devices.
- NFR-3: Search results shall update within 300 ms for typical user queries.

### 4.4.2 Reliability and Availability
- NFR-4: Monthly uptime shall be at least 99.5 percent.
- NFR-5: Critical purchase flows shall degrade gracefully during partial outages.
- NFR-6: Automated backups shall run daily with restore validation.

### 4.4.3 Security
- NFR-7: Passwords shall be hashed with an industry-standard adaptive hash function.
- NFR-8: Sensitive data in transit shall be protected with TLS.
- NFR-9: Privileged actions shall be audit-logged.
- NFR-10: Rate limiting shall protect authentication and checkout endpoints.

### 4.4.4 Scalability
- NFR-11: The system shall scale to at least 10,000 concurrent users through horizontal scaling.
- NFR-12: Read-heavy endpoints shall support caching strategies.

### 4.4.5 Maintainability
- NFR-13: Code shall maintain modular separation of UI, services, domain models, and infrastructure.
- NFR-14: All public APIs shall be documented and version controlled.
- NFR-15: CI shall enforce linting, type checks, and automated tests.

### 4.4.6 Usability and Accessibility
- NFR-16: Primary workflows shall be understandable to first-time users without external documentation.
- NFR-17: The platform shall target WCAG 2.1 AA compliance.

## 4.5 Reporting and Analytics Requirements
- FR-46: The platform shall track DAU/MAU, conversion, retention, and revenue metrics.
- FR-47: Admin analytics shall include top-selling games, refund rates, and engagement trends.
- FR-48: Event tracking shall support funnel analysis for browse-to-purchase behavior.

## 5. Traceability Matrix (As-Is to To-Be)

1. Current store browsing maps to FR-9 through FR-12.
2. Current bucket flow maps to FR-15 and FR-20 as baseline cart and ownership behavior.
3. Current library simulation maps to FR-21 through FR-24.
4. Current mock friends and notifications map to FR-25 through FR-34 as baseline UI scaffolding.
5. Current DB fallback behavior supports NFR-5 style graceful degradation.

## 6. Acceptance Criteria for Complete Platform

1. Users can create accounts, sign in securely, and recover passwords.
2. Users can buy games, receive receipts, and see purchased games in persistent library.
3. Users can manage wishlist, cart, and installed titles across sessions.
4. Users can send friend requests, chat, and receive real-time notifications.
5. Admins can manage catalog, discounts, moderation, and analytics.
6. Platform meets defined security, performance, and availability NFR targets.

## 7. Revision Information
- Version: 2.0
- Date: 2026-03-26
- Document Type: Complete platform SRS with implementation baseline traceability
