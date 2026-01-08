# Project PFE - Development Summary

## Overview
TS Manager is a comprehensive web-based management platform designed to streamline team and department operations. It features robust role-based access control, task management, and administrative tools.

## Architecture
- **Frontend**: Built with React (TypeScript), styled with Tailwind CSS, and bundled with Vite.
- **Backend**: Native PHP RESTful API with MySQL database (PDO).
- **Architecture**: Decoupled Client-Server model.

## Key Features Implemented

### 1. User & Role Management
- **Roles**: Admin, Team Leader, Department Head, Member.
- **Admin Capabilities**:
  - Full CRUD for Users (Add, Edit, Delete).
  - Special fields for BAC Matricule and BAC Year.
  - Role assignment and management.
- **Succession Planning**:
  - Team Leaders and Dept Heads must assign a successor before deleting their account.
  - Automated role promotion during account deletion.

### 2. Team & Department Management
- **Teams**: Create, Browse, Delete (Single & Bulk).
- **Departments**: Linked to Teams, managed by Dept Heads.
- **Categories**: Teams are categorized (stored within description format).

### 3. Member Features
- **Profile Management**: Update Name, Username, Email, and Password.
- **Dashboard**: personalized view based on role (Tasks, Events, Team view).
- **Real-time Sync**: Profile updates reflect immediately across the application UI without reloading.

## Recent Updates & Fixes
- **Profile Logic**: Fixed API mismatches specifically for user profile updates.
- **Backend Robustness**: Enhanced `update.php` to handle username changes and BAC fields.
- **UI/UX**: Refined confirmation and success dialogs to be compact and centered.
- **Data Integrity**: Implemented logic to prevent orphaned teams/departments by enforcing successor assignment.

## Directory Structure
- `/Frontend/PFE`: React Application source code.
- `/Backend/api`: PHP API endpoints grouped by resource (users, teams, tasks, events, etc.).
- `/Backend/config`: Database configuration and utilities.

---
*Last Updated: December 2025*
