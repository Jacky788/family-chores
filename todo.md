# FamilyChores - Household Contribution Tracker

## Database & Backend
- [x] Define schema: users extension (role, displayName), activities table, activityLogs table
- [x] Push DB migrations
- [x] Server: getProfile / setRole / setDisplayName procedures
- [x] Server: listActivities (default activities with default durations)
- [x] Server: logActivity mutation
- [x] Server: getDashboard (daily/weekly/monthly aggregates)
- [x] Server: getHistory (paginated logs per user / all family)
- [x] Server: getStats (total hours, task type breakdown)

## Frontend Pages & Components
- [x] Global design system: color palette, fonts, CSS variables (elegant warm theme)
- [x] Role selection page (Father / Mother / Kid) with display name input
- [x] DashboardLayout with sidebar navigation
- [x] Log Activity page: activity picker, duration input, defaults pre-filled
- [x] Celebration overlay component (confetti + fireworks scaled to duration)
- [x] Contribution Dashboard page: daily/weekly/monthly tabs with charts
- [x] Activity History page: filterable log list with timestamps
- [x] Summary Statistics page: total hours per person, task type breakdown

## Polish
- [x] Responsive design (mobile-friendly)
- [x] Empty states for all pages
- [x] Loading skeletons
- [x] Vitest unit tests (9 tests passing)

## Family Group System
- [x] Add families table (id, name, inviteCode, createdBy, createdAt)
- [x] Add familyId column to users table
- [x] Add familyId column to activityLogs table
- [x] Migrate DB
- [x] Server: createFamily mutation
- [x] Server: joinFamily mutation (by invite code)
- [x] Server: getMyFamily query
- [x] Server: regenerateInviteCode mutation
- [x] Scope all data queries to familyId
- [x] FamilySetup page: create new family OR join with invite code
- [x] Show invite code in sidebar/settings for easy sharing
- [x] Gate all app pages behind family membership
- [x] Update role setup to happen after family join

## Bug Fixes
- [x] Fix: /setup throws FORBIDDEN for users with familyId=null (getMyFamily should not require family)
- [x] Fix: setProfile should work even without a family (role/name can be set independently)
- [x] Fix: Dashboard/History/Stats pages now gate queries behind myFamily existence
- [x] Fix: Existing user with familyId=null linked to their family in DB

## Invite & Guest Access
- [x] Guest login: join family with just an access code (no OAuth required)
- [x] Guest users stored in DB with a generated guest session token (cookie-based)
- [x] All family members can see and copy/share the invite code
- [x] Invite page at /join/[CODE] that pre-fills the code and prompts name + role
- [x] Show invite code prominently on home page and in a dedicated share modal
