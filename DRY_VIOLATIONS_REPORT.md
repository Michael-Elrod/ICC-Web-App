# DRY Violations Report

Findings ordered from highest to lowest priority based on amount of duplication and refactoring impact.

---

## 1. TasksCard and MaterialsCard are near-identical components
**Files:** `components/job/TasksCard.tsx` (513 lines), `components/job/MaterialsCard.tsx` (493 lines)

These two components share ~90% of their structure: same state variables (`expandedId`, `activeModal`, `selectedUsers`, `userSearchQuery`, `isDropdownOpen`, `dropdownRef`), same `hasAdminAccess` check, same `setsAreEqual` helper, same `handleUserSelection`, same `handleSaveChanges`, same click-outside listener, same edit modal markup (title input, description textarea, extension days input, user search dropdown, selected user pills, Cancel/Delete/Save buttons), and same expanded-card layout (description section, assigned people list with phone/email).

**Fix:** Extract a generic `ItemCard` component parameterized by item type (task vs material), or at minimum extract the shared edit modal and user-assignment dropdown into reusable components.

---

## 2. API route boilerplate repeated across 17+ route files - Completed
**Files:** All 24 files under `app/api/`

Every API route repeats the same pattern:
- `const connection = await pool.getConnection()` (17 files)
- `try { ... } catch { console.error(...); return NextResponse.json({error: "..."}, {status: 500}) } finally { connection.release() }` (20 files)
- `const session = await getServerSession(authOptions)` + `if (!session) return 401` (14 files)

**Fix:** Create a `withAuth` and/or `withDb` higher-order wrapper that handles connection acquisition, release, error catching, and session validation. Each route handler becomes a clean function receiving `(connection, session, request)`.

---

## 3. Slab.tsx and Crawl Space.tsx are 95% duplicated
**Files:** `data/Slab.tsx` (1270 lines), `data/Crawl Space.tsx` (1183 lines)

Both files define the exact same 8-phase construction template (Preplanning, Construction Start, Foundation, Framing, Rough In, Trim Out, Interior Finish, Final). The only difference is ~3 tasks in the Foundation phase. All other phases (Framing through Final) are byte-for-byte identical across both files (~1000 lines of pure duplication).

**Fix:** Define shared phases once and compose the two templates by swapping only the Foundation phase.

---

## 4. Modal overlay pattern repeated in 18 components
**Files:** `TasksCard`, `MaterialsCard`, `EditPhaseModal`, `CloseJobModal`, `CopyJobModal`, `DeleteJobModal`, `NewClientModal`, `EditUserModal`, `InviteModal`, `EventPopup`, `PhaseCard`, `StatusButton`, `NewTaskCard`, `NewMaterialCard`, `NewNoteCard`, `PasswordModal`, `Timeline`, `FloorplanViewer`

Every modal repeats:
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
  onClick={(e) => { if (e.target === e.currentTarget) setX(null) }}>
  <div className="bg-white dark:bg-zinc-800 rounded-lg ...">
```

Plus the close-on-backdrop-click logic (`e.target === e.currentTarget` in 11 files).

**Fix:** Create a reusable `Modal` wrapper component that handles overlay, backdrop click, z-indexing, and dark mode styling.

---

## 5. NewTaskCard and NewMaterialCard are near-identical
**Files:** `components/new/NewTaskCard.tsx` (299 lines), `components/new/NewMaterialCard.tsx` (283 lines)

Same expand/collapse pattern, same `ContactSearchSelect` integration, same card layout with title/description/contacts. Differ only in having `duration` (task) vs `dueDate` (material) field.

**Fix:** Merge into a single `NewItemCard` with a type prop, or extract the shared form layout and contact selection.

---

## 6. User search/select dropdown duplicated in 4 components
**Files:** `components/new/ClientSearch.tsx`, `components/new/ContactSearchSelect.tsx`, `components/job/TasksCard.tsx`, `components/job/MaterialsCard.tsx`

Each implements its own: search input, dropdown list, click-outside-to-close (`handleClickOutside` with `document.addEventListener`), filter logic, and selected-user pill display. The dropdown markup and behavior are nearly identical.

**Fix:** Create a single `SearchableDropdown` or `UserPicker` component reused everywhere.

---

## 7. Admin access check repeated in 7 components
**Files:** `TasksCard`, `MaterialsCard`, `Timeline`, `jobs/[id]/page.tsx`, `EventPopup`, `PhaseCard`, `FloorplanViewerID`

Each computes `hasAdminAccess` independently:
```tsx
const hasAdminAccess = userType === "Owner" || userType === "Admin";
```

**Fix:** Add a `hasAdminAccess(session)` utility function in `utils.tsx` or a custom hook `useAdminAccess()`.

---

## 8. Random password generation duplicated in 3 API routes
**Files:** `app/api/users/[userId]/route.ts`, `app/api/users/clients/route.ts`, `app/api/reset-password/route.ts`

Each repeats:
```ts
const randomPassword = crypto.randomBytes(32).toString('hex');
const hashedPassword = await hash(randomPassword, 12);
```

**Fix:** Extract to a `generateRandomPasswordHash()` helper in `app/lib/auth.ts`.

---

## 9. Email-exists validation duplicated in 3 API routes - Completed
**Files:** `app/api/users/clients/route.ts`, `app/api/settings/route.ts`, `app/api/register/route.ts`

Each queries `SELECT user_id FROM app_user WHERE user_email = ?` and returns a 400 if found, with slightly different error messages.

**Fix:** Extract a `checkEmailExists(connection, email, excludeUserId?)` helper.

---

## 10. No-cache response headers duplicated - Completed
**Files:** `app/api/users/route.ts`, `app/api/users/non-clients/route.ts`

Both repeat the same 4-line cache header block:
```ts
'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
'Pragma': 'no-cache',
'Expires': '0',
'Surrogate-Control': 'no-store'
```

**Fix:** Extract a `NO_CACHE_HEADERS` constant or helper.

---

## 11. Input className helper duplicated across form components
**Files:** `components/new/ClientSearch.tsx`, `components/new/NewJobCard.tsx`, `app/settings/page.tsx`

Each defines its own `getInputClassName()` function producing the same base Tailwind classes (`border rounded-md shadow-sm p-2` + dark mode variants).

**Fix:** Extract to a shared `inputClassName` constant or utility.

---

## 12. `formatPhoneNumber` imported and used identically in 5 components - Completed
**Files:** `TasksCard`, `MaterialsCard`, `NewClientModal`, `ContactCard`, `EditUserModal`

While the function itself is defined once in `utils.tsx` (good), the user-display pattern around it is repeated: rendering name + `formatPhoneNumber(phone)` + email in a 3-column grid. This user info display block is duplicated.

**Fix:** Create a `UserInfoRow` component for the name/phone/email display pattern.

---

## 13. `window.location.reload()` used as state refresh in 4 files
**Files:** `app/jobs/new/page.tsx`, `components/job/TasksCard.tsx`, `components/job/MaterialsCard.tsx`, `app/jobs/[id]/page.tsx`

Full page reloads are used instead of proper state invalidation after mutations.

**Fix:** Use a callback/refresh pattern or SWR/React Query for cache-aware data refetching instead of hard reloads.

---

## 14. Fetch-to-API pattern repeated without abstraction
**Files:** `TasksCard`, `MaterialsCard`, `PhaseCard`, `StatusButton`, `jobs/[id]/page.tsx`, `jobs/new/page.tsx`

Each component builds fetch calls manually with the same pattern:
```ts
const response = await fetch(`/api/jobs/${jobId}/...`, {
  method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify(...)
});
if (!response.ok) throw new Error("Failed to ...");
```

**Fix:** Create an API client module (`lib/api.ts`) with typed methods like `api.jobs.updateTask(jobId, taskId, payload)`.

---

## 15. Active and Closed job pages are copy-pasted
**Files:** `app/jobs/active/page.tsx`, `app/jobs/closed/page.tsx`

Both pages have identical data-fetching logic, identical job transformation/mapping code (~60 lines), and identical `handleStatusUpdate` functions (~55 lines). The only difference is the API query parameter (`status=active` vs `status=closed`).

**Fix:** Extract a shared `useJobs(status)` hook or a single `JobListPage` component that takes status as a prop.

---

## 16. Task and material handler files are near-identical
**Files:** `handlers/new/tasks.tsx`, `handlers/new/materials.tsx`

`handleDeleteConfirm`, `handleDeleteClick`, `handleContactSelect`, `handleContactRemove`, and validation logic are all duplicated between the two files with only the field names swapped.

**Fix:** Create a generic item handler factory parameterized by item type and field names.

---

## 17. Business-day loop reimplemented instead of using existing utility
**Files:** `app/calendar/page.tsx` (2 instances), `app/jobs/[id]/page.tsx` (2 instances)

All four manually loop with `setDate(getDate() + 1)` skipping weekends. The utility `addBusinessDays()` already exists in `app/utils.tsx` but is not used in these locations.

**Fix:** Replace all four inline loops with the existing `addBusinessDays()` from utils.

---

## 18. Loading spinner SVG duplicated in 8+ components
**Files:** `PasswordModal`, `EditPhaseModal`, `ForgotPasswordForm`, `ResetPasswordForm`, `InviteModal`, `EditUserModal`, `NewClientModal`, `AuthForm`

Each inlines the same ~15-line animated SVG spinner.

**Fix:** Create a `<Spinner />` component.

---

## 19. Delete confirmation modal duplicated in 4 components
**Files:** `NoteCard`, `NewTaskCard`, `NewMaterialCard`, `EditUserModal`

Each implements its own "Are you sure?" confirmation dialog with identical structure: title, message, Cancel button, Delete button.

**Fix:** Create a `<ConfirmDialog />` component with `title`, `message`, `onConfirm`, `onCancel` props.

---

## 20. User data transformation repeated 3 times in one file
**File:** `app/jobs/[id]/page.tsx` (lines ~1095, ~1149, ~1169)

The same `map((user) => ({ user_id, first_name, last_name, ... }))` transformation appears three times in the job detail page for different fetch calls.

**Fix:** Extract a `transformUserData(rawUser)` utility function.
