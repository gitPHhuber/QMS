# Code Review: Files > 800 Lines

**Date:** 2026-02-14
**Reviewer:** Claude Code (Automated)
**Scope:** All source files exceeding 800 lines of code
**Total files reviewed:** 6

---

## Summary

| # | File | Lines | Severity | Key Issue |
|---|------|-------|----------|-----------|
| 1 | `LabelConstructor.tsx` | 1270 | HIGH | God-component, mixed concerns |
| 2 | `TaskDetailModal.tsx` | 955 | HIGH | Giant modal with 7 tabs inline |
| 3 | `iso13485Checklists.js` | 830 | LOW | Static data — acceptable |
| 4 | `internalAuditController.js` | 817 | MEDIUM | Fat controller, no service layer |
| 5 | `riskManagementController.js` | 805 | MEDIUM | 4 CRUD domains in one file |
| 6 | `DocumentService.js` | 803 | LOW | Well-structured, near threshold |

---

## 1. LabelConstructor.tsx (1270 lines) — SEVERITY: HIGH

**Path:** `QMS-Client-main/src/pages/Warehouse/components/label-constructor/LabelConstructor.tsx`

### Problems

#### 1.1 God-component (Single Responsibility Violation)
One component manages: canvas rendering, drag-and-drop, toolbar, property panel, icon picker, font uploads, image uploads, zoom controls, serialization. This should be **at least 5-7 separate components**.

#### 1.2 Inline JSX for sub-panels (lines 547-631)
The icon picker popup is ~85 lines of JSX nested inside the toolbar. This is hard to test and reuse.

**Current (line 547-631):**
```tsx
{showIconPicker && (
  <div className="absolute top-full left-0 mt-1 bg-asvo-card ...">
    {/* 85 lines of icon picker */}
  </div>
)}
```

**Should be:**
```tsx
{showIconPicker && (
  <IconPicker
    icons={DEFAULT_ICON_LIBRARY}
    customIcons={customIcons}
    onSelect={(icon) => { addElement("ICON", icon); setShowIconPicker(false); }}
    onUpload={() => iconUploadRef.current?.click()}
    onDeleteCustom={deleteCustomIcon}
  />
)}
```

#### 1.3 Property panel is 330 lines of conditional JSX (lines 692-1025)
The element property panel renders different controls per element type, all inline. Each type's controls (`TEXT`, `QR`, `COUNTER`, `IMAGE`, `ICON`, `LINE/RECTANGLE`) should be a separate component.

#### 1.4 Unsafe `dangerouslySetInnerHTML` (lines 569, 1150)
```tsx
dangerouslySetInnerHTML={{ __html: iconData.svg }}
```
SVG icons from `DEFAULT_ICON_LIBRARY` are inserted raw. If this library ever loads external data, this becomes an XSS vector. Consider using a sanitizer or rendering SVGs as React components.

#### 1.5 `(node as any).dataset.lastMm` — unsafe type cast (line 227)
Using `any` to store intermediate drag state on DOM nodes. Better to use a ref map or state.

#### 1.6 Unused variables with underscore prefix (lines 83-84)
```tsx
const [_showQrHelper, setShowQrHelper] = useState(false);
const [_showCounterPreview, _setShowCounterPreview] = useState(false);
```
`_showCounterPreview` and `_setShowCounterPreview` are never used. `_showQrHelper` is written but never read. Clean up dead state.

#### 1.7 `addElement` not in `useCallback` deps (line 375)
`handleImageUpload` calls `addElement` but is wrapped in `useCallback([])` — stale closure risk.

### Recommended Refactoring

Split into:
- `LabelConstructor.tsx` — orchestrator (~200 lines)
- `LabelToolbar.tsx` — toolbar with add buttons
- `LabelCanvas.tsx` — canvas rendering + zoom
- `ElementPropertyPanel.tsx` — selected element property editor
- `IconPickerPopup.tsx` — icon picker popup
- `useLabelDragDrop.ts` — drag/move/resize hook
- `useLabelElements.ts` — elements state management hook
- `useCustomAssets.ts` — custom fonts/icons management hook

---

## 2. TaskDetailModal.tsx (955 lines) — SEVERITY: HIGH

**Path:** `QMS-Client-main/src/pages/Tasks/TaskDetailModal.tsx`

### Problems

#### 2.1 7 tabs rendered inline in one component
Tabs: main (view), main (edit), subtasks, checklists, comments, activity, breakdown, boxes — all rendered as inline JSX blocks. Each tab should be a separate component.

#### 2.2 Too many `useState` declarations (lines 66-90)
**15 state variables** in one component. This is a strong signal to extract custom hooks:
```tsx
const [detail, setDetail] = useState(...)
const [loading, setLoading] = useState(...)
const [error, setError] = useState(...)
const [actionLoading, setActionLoading] = useState(...)
const [actionError, setActionError] = useState(...)
const [tab, setTab] = useState(...)
const [editing, setEditing] = useState(...)
const [editForm, setEditForm] = useState(...)
const [saving, setSaving] = useState(...)
const [users, setUsers] = useState(...)
const [projects, setProjects] = useState(...)
const [showConfirm, setShowConfirm] = useState(...)
const [subtasks, setSubtasks] = useState(...)
const [newSubtaskTitle, setNewSubtaskTitle] = useState(...)
const [checklists, setChecklists] = useState(...)
// ...more
```

#### 2.3 `editForm` typed as `any` (line 75)
```tsx
const [editForm, setEditForm] = useState<any>({});
```
This loses all type safety. Define a proper `TaskEditForm` interface.

#### 2.4 Empty catch blocks throughout (lines 125-161)
```tsx
try { ... } catch {} // silently swallowed
```
At least 8 empty `catch {}` blocks. Errors are silently swallowed — user sees no feedback when subtask/checklist operations fail. Add toast notifications or error state.

#### 2.5 No loading indicators for subtask/checklist operations
`handleToggleSubtask`, `handleDeleteSubtask`, `handleToggleChecklistItem` etc. don't show any loading state, leading to potential double-clicks.

### Recommended Refactoring

- Extract `useTaskDetail(taskId)` hook — handles fetch, loading, error
- Extract `useTaskEdit(detail)` hook — handles edit form state + save
- Extract `useSubtasks(taskId)` hook
- Extract `useChecklists(taskId)` hook
- Each tab → separate component: `TaskMainView`, `TaskEditForm`, `SubtasksTab`, `ChecklistsTab`, `BreakdownTab`, `BoxesTab`

---

## 3. iso13485Checklists.js (830 lines) — SEVERITY: LOW

**Path:** `QMS-Server-master/modules/qms-audit/seeds/iso13485Checklists.js`

### Assessment

This is a **seed data file** containing ISO 13485:2016 checklist templates. The 830 lines are structured, repetitive data — not logic.

### Minor Issues

#### 3.1 Could be JSON/YAML instead of JS
Since this is pure data with no logic, it would be cleaner as `iso13485Checklists.json`. This makes it easier to validate, import/export, and prevents accidental code injection.

#### 3.2 No schema validation
There's no validation that each checklist item has all required fields (`requirement`, `guidance`, `isoReference`). A simple JSON Schema or Joi validation on import would prevent incomplete data.

### Verdict
**Acceptable as-is.** Static data files don't have the same maintainability concerns as logic files.

---

## 4. internalAuditController.js (817 lines) — SEVERITY: MEDIUM

**Path:** `QMS-Server-master/modules/qms-audit/controllers/internalAuditController.js`

### Problems

#### 4.1 Fat controller — business logic mixed with HTTP handling
The controller contains:
- CRUD for AuditPlan (4 handlers)
- CRUD for AuditSchedule (4 handlers)
- CRUD for AuditFinding (2 handlers)
- Statistics aggregation
- CAPA auto-creation logic (lines 28-95)
- Checklist template management (5 handlers)
- Checklist response management (4 handlers)
- DMS report distribution (1 handler)

This is **4+ domains** in one controller file.

#### 4.2 `_autoCreateCapaForFinding` is complex business logic in controller (lines 28-95)
This 67-line function creates NC + CAPA from a finding. It belongs in a service layer (e.g., `AuditFindingService`), not in a controller.

#### 4.3 Inconsistent error handling patterns
Some handlers use `logAudit(req, ...)` positional args (line 145):
```js
await logAudit(req, "audit.plan.create", "audit_plan", plan.id, { ... });
```
Others use `logAudit({ req, ... })` object form (line 78):
```js
await logAudit({ req, action: "AUDIT_FINDING_CREATE", ... });
```
Both patterns in the same file — pick one.

#### 4.4 `req.body` passed directly to ORM (lines 144, 161, 231, 314)
```js
const plan = await AuditPlan.create(req.body);
await plan.update(req.body);
```
No input validation or field whitelisting. Users can set any database field via API. This is a **mass assignment vulnerability**. Use explicit field extraction like `riskManagementController.js` does.

#### 4.5 `parseInt` without NaN fallback in query params (line 113)
```js
limit: parseInt(limit)  // NaN if limit="abc"
```
Should be `parseInt(limit) || 20`.

#### 4.6 Race condition in number generation (lines 228-229)
```js
const count = await AuditSchedule.count();
const auditNumber = `IA-${year}-${String(count + 1).padStart(3, "0")}`;
```
Under concurrent requests, two audits can get the same number. Use a DB sequence or transaction with lock.

### Recommended Refactoring

Split into:
- `auditPlanController.js` — Plan CRUD
- `auditScheduleController.js` — Schedule CRUD
- `auditFindingController.js` — Finding CRUD + CAPA creation
- `auditChecklistController.js` — Checklist templates + responses
- `AuditFindingService.js` — `_autoCreateCapaForFinding` business logic
- Add input validation middleware (joi/zod)

---

## 5. riskManagementController.js (805 lines) — SEVERITY: MEDIUM

**Path:** `QMS-Server-master/modules/qms-risk/controllers/riskManagementController.js`

### Problems

#### 5.1 Four CRUD domains in one file
- Risk Management Plans (6 handlers)
- Hazard Analysis (5 handlers)
- Benefit-Risk Analysis (4 handlers)
- Risk Control Traceability (4 handlers)
- Matrix + Stats (2 handlers)

#### 5.2 Transliterated error messages (lines 76, 131, 134, etc.)
```js
return next(ApiError.notFound("Plan menedzhmenta riskov ne nayden"));
return next(ApiError.badRequest("Nel'zya redaktirovat' arkhivnyy plan"));
```
These are Russian words written in Latin transliteration. This is confusing for both Russian and English speakers. Use either proper Russian (`"План не найден"`) or English (`"Plan not found"`).

#### 5.3 Raw SQL for sequence generation (lines 95-98)
```js
const [maxResult] = await sequelize.query(
  `SELECT MAX(CAST(SUBSTRING("planNumber" FROM '(\\d+)$') AS INTEGER)) AS max_num FROM risk_management_plans`,
```
This raw SQL is PostgreSQL-specific and fragile. Consider a dedicated `sequences` table or use Sequelize's auto-increment.

#### 5.4 `getTraceabilityMatrix` is 90 lines of data transformation (lines 643-731)
This is business logic (matrix assembly + statistics calculation) that belongs in a service, not a controller.

#### 5.5 Duplicated pagination pattern
The same pagination logic (parse limit/page, calculate offset, findAndCountAll, format response) is repeated in 5 handlers. Extract a `paginate(Model, { where, include, order }, req.query)` utility.

### Recommended Refactoring

Split into:
- `riskPlanController.js`
- `hazardController.js`
- `benefitRiskController.js`
- `traceabilityController.js`
- `RiskMatrixAssembler.js` (service for matrix computation)
- Fix transliterated strings to proper Russian or English

---

## 6. DocumentService.js (803 lines) — SEVERITY: LOW

**Path:** `QMS-Server-master/modules/qms-dms/services/DocumentService.js`

### Assessment

This is the **best-structured** file among the six. It's a proper service class with clear method separation, transaction management, and audit logging.

### Minor Issues

#### 6.1 All methods in one class
While 803 lines is at the threshold, the methods are logically grouped:
- Document creation (1 method)
- Version upload (1 method)
- Review/approval workflow (2 methods)
- Effective/versioning (2 methods)
- Distribution (2 methods)
- Read/search (5 methods)

This is manageable but could be split if it grows further (e.g., `DocumentWorkflowService`, `DocumentQueryService`).

#### 6.2 `search` parameter used directly in SQL LIKE (lines 663-673)
```js
{ title: { [Op.iLike]: `%${searchText}%` } },
```
The `searchText` is trimmed but not escaped for special LIKE characters (`%`, `_`). A search for `%` would match everything. Escape special characters before using in LIKE.

#### 6.3 File storage path construction could allow traversal (line 193)
```js
const safeFileName = `v${version.versionNumber}_${Date.now()}${ext}`;
```
While `safeFileName` is generated safely, `ext` comes from `path.extname(file.name)` which could theoretically be manipulated. Add validation that ext matches expected patterns.

#### 6.4 Transaction isolation level "SERIALIZABLE" only on `createDocument` (line 121)
```js
const transaction = await sequelize.transaction({ isolationLevel: "SERIALIZABLE" });
```
`createDocument` uses SERIALIZABLE but other methods use default isolation. If code generation uniqueness matters (it does for ISO compliance), other methods with auto-numbering should also use appropriate isolation.

### Verdict
**Mostly good.** Fix the search escaping and file extension validation. Can optionally split into workflow + query services as a future improvement.

---

## Cross-cutting Recommendations

### 1. Input Validation
None of the backend files validate request body with a schema library. Add `joi`, `zod`, or `express-validator` middleware to all endpoints. This is critical for ISO 13485 compliance (data integrity).

### 2. Consistent Error Handling
Backend files mix `res.status(500).json()` (audit controller) with `next(ApiError.internal())` (risk controller). Standardize on one pattern.

### 3. Consistent Audit Logging
Two different calling conventions for `logAudit`:
- Positional: `logAudit(req, action, entity, entityId, metadata)`
- Object: `logAudit({ req, action, entity, entityId, ... })`

Pick one. The object form is safer (no positional argument confusion).

### 4. Frontend Component Size Guidelines
Establish a team convention: React components should generally stay under **300 lines**. If a component exceeds this, it's time to extract hooks and sub-components.

### 5. Number Generation Race Conditions
Several controllers use `count() + 1` for auto-numbering. Under concurrent load, this produces duplicates. Use a database sequence or `MAX() + 1` inside a transaction with appropriate locking.
