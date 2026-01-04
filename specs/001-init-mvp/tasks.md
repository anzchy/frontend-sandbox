# Tasks: Frontend Development Sandbox MVP

**Input**: Design documents from `/specs/001-init-mvp/`
**Prerequisites**: plan.md ✓, spec.md ✓, data-model.md ✓, contracts/ ✓, research.md ✓, quickstart.md ✓

**Tests**: Not explicitly requested in specification. Test tasks omitted for MVP speed.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- All paths relative to repository root

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create project structure and install dependencies

- [ ] T001 Initialize Vite + React + TypeScript project with `npm create vite@latest . -- --template react-ts`
- [ ] T002 Install core dependencies: `@monaco-editor/react`, `zustand`, `jszip`, `file-saver`
- [ ] T003 Install dev dependencies: `vitest`, `@testing-library/react`, `@types/file-saver`
- [ ] T004 [P] Create directory structure per plan.md in src/
- [ ] T005 [P] Configure TypeScript strict mode and path aliases in tsconfig.json
- [ ] T006 [P] Configure Vite build target ES2022 in vite.config.ts
- [ ] T007 Create type definitions from contracts in src/types/index.ts

**Checkpoint**: Project builds with `npm run dev`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Implement fileService with validation logic in src/services/fileService.ts
- [ ] T009 [P] Implement previewService with Blob URL generation in src/services/previewService.ts
- [ ] T010 [P] Create useDebounce hook in src/hooks/useDebounce.ts
- [ ] T011 Create projectStore skeleton (state only) in src/stores/projectStore.ts
- [ ] T012 [P] Create uiStore with panel widths and theme in src/stores/uiStore.ts
- [ ] T013 Create base layout with SplitPane component in src/components/Layout/SplitPane.tsx
- [ ] T014 [P] Create Header component shell in src/components/Layout/Header.tsx
- [ ] T015 [P] Add global styles and CSS variables in src/index.css
- [ ] T016 Setup App.tsx with basic layout structure (3-panel placeholder)

**Checkpoint**: Foundation ready - `npm run dev` shows 3-panel layout skeleton

---

## Phase 3: User Story 1 - 编写代码并实时预览 (Priority: P1) 🎯 MVP

**Goal**: User can edit HTML/CSS/JS code and see live preview updates within 500ms

**Independent Test**: Type `<h1>Hello</h1>` in editor, verify preview shows heading immediately

### Implementation for User Story 1

- [ ] T017 [US1] Create Editor component wrapper for Monaco in src/components/Editor/Editor.tsx
- [ ] T018 [US1] Configure Monaco options (dark theme, no minimap, 14px font) in src/components/Editor/Editor.tsx
- [ ] T019 [US1] Implement onContentChange handler with debounce in src/components/Editor/Editor.tsx
- [ ] T020 [US1] Create Preview component with iframe in src/components/Preview/Preview.tsx
- [ ] T021 [US1] Implement Blob URL generation and cleanup in src/components/Preview/Preview.tsx
- [ ] T022 [US1] Add error handler injection for JS runtime errors in src/services/previewService.ts
- [ ] T023 [US1] Implement HTML builder combining HTML/CSS/JS in src/utils/htmlBuilder.ts
- [ ] T024 [US1] Connect Editor and Preview via projectStore in src/App.tsx
- [ ] T025 [US1] Add default project files (index.html, styles.css, script.js) in src/stores/projectStore.ts
- [ ] T026 [US1] Create PreviewToolbar with refresh button and URL display in src/components/Preview/PreviewToolbar.tsx
- [ ] T027 [US1] Add console panel for error display in src/components/Preview/ConsolePanel.tsx
- [ ] T028 [US1] Style editor and preview panels in src/components/Editor/editor.css and src/components/Preview/preview.css

**Checkpoint**: Edit code → See preview update within 500ms. US1 fully functional.

---

## Phase 4: User Story 2 - 多文件管理 (Priority: P2)

**Goal**: User can create multiple files and switch between them in the editor

**Independent Test**: Create styles.css, edit it, switch to index.html, verify both files have correct content

### Implementation for User Story 2

- [ ] T029 [US2] Create FileExplorer component with file list in src/components/FileExplorer/FileExplorer.tsx
- [ ] T030 [US2] Create FileItem component with icon and name in src/components/FileExplorer/FileItem.tsx
- [ ] T031 [US2] Implement getFileIcon utility in src/utils/fileUtils.ts
- [ ] T032 [US2] Add file type detection to fileService in src/services/fileService.ts
- [ ] T033 [US2] Implement setActiveFile action in projectStore in src/stores/projectStore.ts
- [ ] T034 [US2] Implement getActiveFile selector in projectStore in src/stores/projectStore.ts
- [ ] T035 [US2] Update Editor to switch models based on active file in src/components/Editor/Editor.tsx
- [ ] T036 [US2] Create EditorTabs component for open files in src/components/Editor/EditorTabs.tsx
- [ ] T037 [US2] Update htmlBuilder to resolve cross-file references in src/utils/htmlBuilder.ts
- [ ] T038 [US2] Style FileExplorer component in src/components/FileExplorer/file-explorer.css
- [ ] T039 [US2] Integrate FileExplorer into App layout in src/App.tsx

**Checkpoint**: Multiple files work, switching preserves content. US2 fully functional.

---

## Phase 5: User Story 3 - 文件操作 (Priority: P3)

**Goal**: User can create, rename, and delete files with proper validation

**Independent Test**: Create new file, rename it, delete it, verify list updates correctly

### Implementation for User Story 3

- [ ] T040 [US3] Add createFile action with validation in projectStore in src/stores/projectStore.ts
- [ ] T041 [US3] Add renameFile action with uniqueness check in projectStore in src/stores/projectStore.ts
- [ ] T042 [US3] Add deleteFile action with "last file" protection in projectStore in src/stores/projectStore.ts
- [ ] T043 [US3] Create NewFileDialog component in src/components/FileExplorer/NewFileDialog.tsx
- [ ] T044 [US3] Create RenameDialog component in src/components/FileExplorer/RenameDialog.tsx
- [ ] T045 [US3] Create DeleteConfirmDialog component in src/components/FileExplorer/DeleteConfirmDialog.tsx
- [ ] T046 [US3] Add context menu to FileItem (rename, delete) in src/components/FileExplorer/FileItem.tsx
- [ ] T047 [US3] Add "New File" button to FileExplorer header in src/components/FileExplorer/FileExplorer.tsx
- [ ] T048 [US3] Implement generateUniqueName utility in src/services/fileService.ts
- [ ] T049 [US3] Add error toasts for validation failures in src/components/Layout/Toast.tsx

**Checkpoint**: Create/rename/delete files work with validation. US3 fully functional.

---

## Phase 6: User Story 4 - 项目持久化 (Priority: P4)

**Goal**: Project auto-saves to localStorage and restores on page load

**Independent Test**: Edit code, refresh browser, verify code is restored exactly

### Implementation for User Story 4

- [ ] T050 [US4] Implement storageService with load/save in src/services/storageService.ts
- [ ] T051 [US4] Add size limit checking (10MB max) to storageService in src/services/storageService.ts
- [ ] T052 [US4] Add persist middleware to projectStore in src/stores/projectStore.ts
- [ ] T053 [US4] Implement loadProject action with migration support in src/stores/projectStore.ts
- [ ] T054 [US4] Implement auto-save on content change (debounced) in src/stores/projectStore.ts
- [ ] T055 [US4] Add loading state display during restore in src/App.tsx
- [ ] T056 [US4] Handle storage full error with user notification in src/services/storageService.ts
- [ ] T057 [US4] Add "Clear Project" option in Header for reset in src/components/Layout/Header.tsx

**Checkpoint**: Refresh browser, all files and content restored. US4 fully functional.

---

## Phase 7: User Story 5 - 导出项目为 ZIP (Priority: P5)

**Goal**: User can export entire project as downloadable ZIP file

**Independent Test**: Click export, download ZIP, extract and open index.html in browser

### Implementation for User Story 5

- [ ] T058 [US5] Implement exportService with JSZip in src/services/exportService.ts
- [ ] T059 [US5] Add exportAsZip function with file-saver in src/services/exportService.ts
- [ ] T060 [US5] Add "Export ZIP" button to Header in src/components/Layout/Header.tsx
- [ ] T061 [US5] Connect export button to exportService in src/components/Layout/Header.tsx
- [ ] T062 [US5] Add loading indicator during ZIP generation in src/components/Layout/Header.tsx
- [ ] T063 [US5] Use project name as ZIP filename in src/services/exportService.ts

**Checkpoint**: Export downloads ZIP with all files intact. US5 fully functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories

- [ ] T064 [P] Add responsive design for smaller screens in src/index.css
- [ ] T065 [P] Add keyboard shortcuts (Ctrl+S, Ctrl+N) in src/App.tsx
- [ ] T066 [P] Implement infinite loop detection (3s timeout) in src/components/Preview/Preview.tsx
- [ ] T067 [P] Add syntax error highlighting in editor in src/components/Editor/Editor.tsx
- [ ] T068 [P] Add panel resize persistence to uiStore in src/stores/uiStore.ts
- [ ] T069 Final integration test: full workflow validation
- [ ] T070 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → User Stories (3-7) → Phase 8 (Polish)
                          ↓
              BLOCKS ALL USER STORIES
```

### User Story Dependencies

| Story | Can Start After | Dependencies on Other Stories |
|-------|-----------------|-------------------------------|
| US1 (P1) | Phase 2 complete | None - fully independent |
| US2 (P2) | Phase 2 complete | None - uses same projectStore |
| US3 (P3) | Phase 2 complete | None - extends file operations |
| US4 (P4) | Phase 2 complete | None - storage layer independent |
| US5 (P5) | Phase 2 complete | None - export reads from store |

**Note**: All user stories are independently implementable after Phase 2. They integrate through the shared projectStore but don't block each other.

### Within Each User Story

1. Services/utilities first
2. Store actions next
3. Components last
4. Integration/styling at end

### Parallel Opportunities

**Phase 1 Parallel**:
```
T004, T005, T006 can run together (different files)
```

**Phase 2 Parallel**:
```
T008, T009, T010 can run together (different services)
T012, T014, T015 can run together (different files)
```

**Cross-Story Parallel (with team)**:
```
After Phase 2:
  Developer A: US1 (T017-T028)
  Developer B: US2 (T029-T039)
  Developer C: US4 (T050-T057)
```

---

## Parallel Example: User Story 1

```bash
# Services can be implemented together:
Task: T022 "Add error handler injection in src/services/previewService.ts"
Task: T023 "Implement HTML builder in src/utils/htmlBuilder.ts"

# Then components:
Task: T017 "Create Editor component in src/components/Editor/Editor.tsx"
Task: T020 "Create Preview component in src/components/Preview/Preview.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (~30 min)
2. Complete Phase 2: Foundational (~1 hr)
3. Complete Phase 3: US1 - Core Editor + Preview (~2 hrs)
4. **STOP and VALIDATE**: Edit code, see preview
5. Demo/deploy minimal viable product

### Incremental Delivery

| Milestone | Stories | Capability |
|-----------|---------|------------|
| MVP | US1 | Edit and preview single file |
| v0.2 | US1 + US2 | Multiple files |
| v0.3 | US1-US3 | File management |
| v0.4 | US1-US4 | Persistence |
| v1.0 | US1-US5 | Full feature set with export |

### Recommended Execution

Solo developer:
1. Setup → Foundational → US1 → **Demo**
2. US2 → **Demo**
3. US3 → US4 → **Demo**
4. US5 → Polish → **Release**

---

## Task Summary

| Phase | Tasks | Parallelizable |
|-------|-------|----------------|
| 1. Setup | 7 | 3 |
| 2. Foundational | 9 | 5 |
| 3. US1 (P1) | 12 | 0 |
| 4. US2 (P2) | 11 | 0 |
| 5. US3 (P3) | 10 | 0 |
| 6. US4 (P4) | 8 | 0 |
| 7. US5 (P5) | 6 | 0 |
| 8. Polish | 7 | 5 |
| **Total** | **70** | **13** |

---

## Notes

- [P] tasks can run in parallel with other [P] tasks in same phase
- Each user story is independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
- Monaco Editor is lazy-loaded; initial bundle ~2MB is acceptable
- localStorage limit ~5-10MB; project max 10MB enforced
