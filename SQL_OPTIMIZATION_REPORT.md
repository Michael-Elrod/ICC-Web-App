# SQL Optimization Report

Findings ordered from highest to lowest priority based on performance impact and query efficiency.

---

## 1. Severe N+1 Query Problem in Jobs List Endpoint - Completed
**File:** `app/api/jobs/route.ts` (Lines 177-285)

For EACH job returned, the code executes 7 additional queries inside a loop:
- Task counts query (line 178)
- Material counts query (line 199)
- Tasks query (line 209)
- Materials query (line 224)
- Workers query (line 238)
- Phases query (line 255)
- Floorplans query (line 285)

With 10 jobs displayed, this means 70+ database round-trips instead of 7 bulk queries.

```typescript
// Current pattern (bad)
for (const job of jobs) {
  const [taskCounts] = await connection.query(`SELECT COUNT(...) FROM task WHERE job_id = ?`, [job.job_id]);
  const [materialCounts] = await connection.query(`SELECT COUNT(...) FROM material WHERE job_id = ?`, [job.job_id]);
  // ... 5 more queries per job
}
```

**Fix:** Replace loop with bulk queries using `WHERE job_id IN (?)` and `GROUP BY job_id`, then map results back to jobs in JavaScript.

---

## 2. N+1 Query Problem in Job Detail Endpoint
**File:** `app/api/jobs/[id]/route.ts` (Lines 271-396)

For each phase in a job, executes 3 separate queries inside `Promise.all()`:
- Tasks with user aggregation (line 273)
- Materials with user aggregation (line 299)
- Notes (line 324)

A job with 8 phases results in 24 queries instead of 3.

```typescript
// Current pattern (bad)
await Promise.all(phases.map(async (phase) => {
  const [tasks] = await connection.query(`SELECT ... FROM task WHERE phase_id = ?`, [phase.phase_id]);
  const [materials] = await connection.query(`SELECT ... FROM material WHERE phase_id = ?`, [phase.phase_id]);
  const [notes] = await connection.query(`SELECT ... FROM note WHERE phase_id = ?`, [phase.phase_id]);
}));
```

**Fix:** Fetch all tasks/materials/notes for the entire job in 3 queries with `WHERE phase_id IN (...)`, then group by phase_id in JavaScript.

---

## 3. Correlated Subqueries Execute Per Row
**File:** `app/api/jobs/route.ts` (Lines 62-120)

The main jobs query contains 6+ correlated subqueries that execute for EVERY job row:

```sql
SELECT j.job_id, j.job_title,
  (SELECT COUNT(*) FROM phase p1
   JOIN task t ON ...
   WHERE p1.job_id = j.job_id AND ...) as overdue_tasks,
  (SELECT COUNT(*) FROM phase p2
   JOIN material m ON ...
   WHERE p2.job_id = j.job_id AND ...) as overdue_materials,
  -- 4 more similar subqueries
FROM job j WHERE j.job_status = ?
```

With 20 jobs, each subquery runs 20 times = 120+ subquery executions.

**Fix:** Rewrite using LEFT JOINs with GROUP BY, or fetch counts in a separate bulk query and merge in application code.

---

## 4. Complex Recursive CTE for Date Calculations
**File:** `app/api/jobs/[id]/route.ts` (Lines 121-204)

Uses a RECURSIVE CTE to calculate business days, which is inefficient in MySQL:

```sql
WITH RECURSIVE business_days AS (
  SELECT DATE(?) as day
  UNION ALL
  SELECT DATE_ADD(day, INTERVAL 1 DAY) FROM business_days
  WHERE day < DATE(?)
),
working_days AS (
  SELECT day FROM business_days
  WHERE DAYOFWEEK(day) NOT IN (1, 7)
)
SELECT ... FROM task_counts, material_counts
```

Additionally contains nested EXISTS subqueries with COUNT(*) inside CASE statements.

**Fix:** Move business day calculations to application code using the existing `addBusinessDays()` utility in `app/utils.tsx`. Simplify the query to return raw dates and compute derived values in JavaScript.

---

## 5. Sequential Updates in Loops Instead of Batch Operations
**File:** `app/api/jobs/[id]/phases/[phaseId]/route.ts` (Lines 42-92)

Each task and material gets updated individually in a loop:

```typescript
// Current pattern (bad)
for (const task of tasks) {
  await connection.query(
    `UPDATE task SET task_duration = task_duration + ? WHERE task_id = ?`,
    [extensionDays, task.task_id]
  );
}
for (const material of materials) {
  await connection.query(
    `UPDATE material SET material_duedate = ? WHERE material_id = ?`,
    [newDueDate, material.material_id]
  );
}
```

**Fix:** Use a single UPDATE with CASE or WHERE IN:
```sql
UPDATE task SET task_duration = task_duration + ? WHERE task_id IN (?, ?, ?)
```

---

## 6. SELECT * Used Instead of Specific Columns
**Files:** `app/api/calendar/route.ts`, `app/api/jobs/[id]/copy-floorplans/route.ts`, `app/api/users/[userId]/route.ts`, `app/api/users/non-clients/route.ts`, `app/api/register/route.ts`, `app/api/reset-password/route.ts`

Multiple queries fetch all columns when only specific fields are needed:

```sql
SELECT * FROM job WHERE job_id = ?
SELECT * FROM phase WHERE job_id = ?
SELECT * FROM material WHERE phase_id IN (?)
SELECT * FROM app_user WHERE user_id = ?
SELECT * FROM app_user WHERE user_type <> "Client"
SELECT * FROM invite_code WHERE code = ?
```

**Fix:** Explicitly list required columns. This improves performance by reducing data transfer and enables better index usage.

---

## 7. Unbounded Queries Missing LIMIT Clause
**Files:** `app/api/users/route.ts` (Line 9), `app/api/users/non-clients/route.ts` (Line 10)

These queries return ALL matching rows without pagination:

```sql
SELECT * FROM app_user ORDER BY user_first_name, user_last_name
SELECT * FROM app_user WHERE user_type <> "Client" ORDER BY ...
```

With 1000+ users, these queries will be slow and consume excessive memory.

**Fix:** Add LIMIT clause and implement cursor-based pagination:
```sql
SELECT ... FROM app_user WHERE user_id > ? ORDER BY user_id LIMIT 50
```

---

## 8. String Interpolation for Table/Column Names
**File:** `app/api/jobs/[id]/route.ts` (Lines 489-492)

While values are parameterized, table and column names are interpolated:

```typescript
const table = type === "task" ? "task" : "material";
const idField = type === "task" ? "task_id" : "material_id";
const statusField = type === "task" ? "task_status" : "material_status";

await connection.query(
  `UPDATE ${table} SET ${statusField} = ? WHERE ${idField} = ?`,
  [newStatus, id]
);
```

Although input is validated, this pattern can lead to SQL injection if validation is bypassed or modified later.

**Fix:** Use separate prepared statements for each table:
```typescript
if (type === "task") {
  await connection.query(`UPDATE task SET task_status = ? WHERE task_id = ?`, [newStatus, id]);
} else {
  await connection.query(`UPDATE material SET material_status = ? WHERE material_id = ?`, [newStatus, id]);
}
```

---

## 9. Duplicate Cleanup Query Executed Twice
**File:** `app/api/reset-password/route.ts` (Lines 20-25 AND Lines 72-77)

The same cleanup query runs at both the start of POST and GET handlers:

```sql
DELETE FROM password_reset_token
WHERE expires_at < NOW()
   OR used = true
   OR created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
```

**Fix:** Move cleanup to a scheduled job or run only once per request lifecycle. Consider a cron job for token cleanup instead of in-request cleanup.

---

## 10. Inefficient JOIN with GROUP_CONCAT Pattern
**Files:** `app/api/jobs/[id]/route.ts` (Lines 206-232), `app/api/jobs/[id]/phases/[phaseId]/tasks/route.ts`, `app/api/jobs/[id]/phases/[phaseId]/materials/route.ts`

LEFT JOINs followed by GROUP_CONCAT cause row multiplication before aggregation:

```sql
SELECT t.task_id, ..., JSON_ARRAYAGG(...) as users
FROM task t
LEFT JOIN user_task ut ON t.task_id = ut.task_id
LEFT JOIN app_user u ON ut.user_id = u.user_id
WHERE ...
GROUP BY t.task_id
```

If a task has 3 users, the task row is duplicated 3 times before aggregation, wasting memory and CPU.

**Fix:** Use a subquery for user aggregation:
```sql
SELECT t.task_id, ...,
  (SELECT JSON_ARRAYAGG(...) FROM user_task ut
   JOIN app_user u ON ut.user_id = u.user_id
   WHERE ut.task_id = t.task_id) as users
FROM task t WHERE ...
```

---

## 11. Filtering by Non-Primary Key in Notes Route
**File:** `app/api/jobs/[id]/phases/[phaseId]/notes/route.ts`

DELETE and PUT operations filter by `created_at` instead of primary key:

```sql
DELETE FROM note WHERE phase_id = ? AND created_at = ?
UPDATE note SET note_details = ? WHERE phase_id = ? AND created_at = ?
```

Multiple notes could have the same `created_at` timestamp, leading to unintended updates/deletes.

**Fix:** Use `note_id` as the unique identifier for all note operations.

---

## 12. Potentially Buggy WHERE Clause Using > Instead of =
**File:** `app/api/jobs/[id]/phases/[phaseId]/route.ts` (Lines 67-68, 82-83)

```sql
SELECT task_id, task_startdate FROM task t
JOIN phase p ON t.phase_id = p.phase_id
WHERE p.phase_id > ?
```

Using `> phaseId` affects all phases with higher IDs, which may not be the intended behavior. This could cascade changes to unrelated phases.

**Fix:** Review business logic. If intent is to update subsequent phases, ensure proper ordering by phase_order or phase_startdate rather than phase_id.

---

## 13. Missing Database Indexes
**Files:** All API routes

The following columns are frequently used in WHERE clauses and JOINs but may lack indexes:

| Column | Used In |
|--------|---------|
| `phase.job_id` | Multiple files |
| `task.phase_id` | Multiple files |
| `material.phase_id` | Multiple files |
| `material.material_duedate` | Date comparisons |
| `task.task_startdate` | Date comparisons |
| `user_task.task_id` | JOIN operations |
| `user_material.material_id` | JOIN operations |
| `password_reset_token.token` | Token lookup |
| `password_reset_token.user_id` | User lookup |
| `app_user.user_email` | Email lookups |
| `app_user.user_type` | Filtering |
| `job.job_status` | Status filtering |
| `job_floorplan.job_id` | Floorplan lookups |

**Fix:** Run `EXPLAIN` on slow queries and add composite indexes for common query patterns:
```sql
CREATE INDEX idx_task_phase_status ON task(phase_id, task_status);
CREATE INDEX idx_material_phase_status ON material(phase_id, material_status);
CREATE INDEX idx_phase_job ON phase(job_id);
CREATE INDEX idx_user_email ON app_user(user_email);
```

---

## 14. Hard-Coded Pagination Limit
**File:** `app/api/users/clients/route.ts` (Lines 10-41)

```sql
SELECT ... FROM app_user WHERE user_type = 'Client' ... LIMIT 50
```

While having a LIMIT is good, the hard-coded value of 50 with no offset support prevents proper pagination.

**Fix:** Accept `page` and `limit` query parameters:
```typescript
const page = parseInt(searchParams.get('page') || '1');
const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
const offset = (page - 1) * limit;
```

---

## 15. UNION with DISTINCT Overhead
**File:** `app/api/jobs/route.ts` (Lines 238-253)

```sql
SELECT DISTINCT CONCAT(...) FROM app_user u
JOIN user_task ut ON ...
WHERE p.job_id = ?
UNION
SELECT DISTINCT CONCAT(...) FROM app_user u
JOIN user_material um ON ...
WHERE p.job_id = ?
```

UNION already removes duplicates, making the inner DISTINCT redundant and wasteful. Additionally, this query runs twice per job due to the N+1 pattern.

**Fix:** Remove inner DISTINCT (UNION handles deduplication), or use UNION ALL if duplicates are acceptable at this stage.

---

## Summary

| Priority | Issue | Files Affected | Impact |
|----------|-------|----------------|--------|
| Critical | N+1 queries in jobs list | `jobs/route.ts` | 70+ queries per page load |
| Critical | N+1 queries in job detail | `jobs/[id]/route.ts` | 24+ queries per job view |
| High | Correlated subqueries | `jobs/route.ts` | 120+ subquery executions |
| High | Complex recursive CTE | `jobs/[id]/route.ts` | Slow date calculations |
| High | Sequential loop updates | `phases/[phaseId]/route.ts` | Multiple round-trips |
| Medium | SELECT * usage | 6 files | Excess data transfer |
| Medium | Unbounded queries | 2 files | Memory issues at scale |
| Medium | String interpolation | `jobs/[id]/route.ts` | Security pattern concern |
| Medium | Duplicate cleanup query | `reset-password/route.ts` | Redundant execution |
| Medium | Inefficient JOINs | 3 files | Row multiplication |
| Low | Non-PK filtering | `notes/route.ts` | Data integrity risk |
| Low | Missing indexes | All files | Slow query performance |
| Low | Hard-coded pagination | `clients/route.ts` | Scalability limit |
