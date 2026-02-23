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
