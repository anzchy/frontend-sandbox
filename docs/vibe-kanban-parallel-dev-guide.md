# Vibe-Kanban Parallel Development Guide

## Frontend Sandbox MVP - Using Vibe-Kanban for Parallel Development

This guide explains how to use [Vibe-Kanban](https://github.com/BloopAI/vibe-kanban) to orchestrate multiple AI coding agents in parallel for developing the Frontend Sandbox MVP project.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Scenario A: From Scratch (0 to 1)](#scenario-a-from-scratch-0-to-1)
3. [Scenario B: Continue from Phase 2](#scenario-b-continue-from-phase-2)
4. [Task Parallelization Strategy](#task-parallelization-strategy)
5. [Best Practices](#best-practices)

---

## Prerequisites

### 1. Install and Authenticate Coding Agents

Before using Vibe-Kanban, you must have at least one coding agent authenticated:

```bash
# Option 1: Claude Code (Recommended)
npm install -g @anthropic-ai/claude-code
claude login

# Option 2: Gemini CLI
npm install -g @google/gemini-cli
gemini auth login

# Option 3: OpenAI Codex
npm install -g @openai/codex
codex auth
```

### 2. Install Git (Required for Worktrees)

```bash
# macOS
brew install git

# Verify version >= 2.20
git --version
```

### 3. Initialize Git Repository (If Not Already)

```bash
cd /path/to/20260103-front-end-sandbox
git init
git add .
git commit -m "Initial commit"
```

---

## Scenario A: From Scratch (0 to 1)

Complete workflow to start parallel development from tasks.md.

### Step 1: Launch Vibe-Kanban

```bash
# Navigate to project directory
cd /path/to/20260103-front-end-sandbox

# Launch Vibe-Kanban (auto-opens browser)
npx vibe-kanban

# Or use a fixed port
PORT=8080 npx vibe-kanban
```

**Expected Result**: Browser opens at `http://localhost:XXXX` showing Vibe-Kanban UI.

### Step 2: Create Project in Vibe-Kanban

1. Click **"Create Project"** button
2. Select the repository path: `/path/to/20260103-front-end-sandbox`
3. Enter project name: `Frontend Sandbox MVP`
4. Click **"Create"**

**Expected Result**: Project appears in the project list.

### Step 3: Import Tasks from tasks.md

Vibe-Kanban supports creating tasks via MCP. Use Claude Desktop or the kanban UI to create tasks:

#### Method A: Manual Task Creation (Recommended for Control)

Click the **"+"** button and create tasks one by one:

```
Phase 1 - Setup Tasks:
----------------------
Task 1: T001 - Initialize Vite Project
Description: Initialize Vite + React + TypeScript project with npm create vite@latest . -- --template react-ts

Task 2: T002 - Install Core Dependencies
Description: Install core dependencies: @monaco-editor/react, zustand, jszip, file-saver

Task 3: T003 - Install Dev Dependencies
Description: Install dev dependencies: vitest, @testing-library/react, @types/file-saver

Task 4: T004 - Create Directory Structure [PARALLEL]
Description: Create directory structure per plan.md in src/

Task 5: T005 - Configure TypeScript [PARALLEL]
Description: Configure TypeScript strict mode and path aliases in tsconfig.json

Task 6: T006 - Configure Vite Build [PARALLEL]
Description: Configure Vite build target ES2022 in vite.config.ts

Task 7: T007 - Create Type Definitions
Description: Create type definitions from contracts in src/types/index.ts
```

#### Method B: Bulk Creation via MCP Integration

If you have MCP configured with Claude Desktop:

```
Create tasks for Frontend Sandbox MVP based on this task list:

Phase 1 - Setup:
- T001: Initialize Vite + React + TypeScript project
- T002: Install @monaco-editor/react, zustand, jszip, file-saver
- T003: Install vitest, @testing-library/react, @types/file-saver
- T004: Create src/ directory structure
- T005: Configure TypeScript strict mode and path aliases
- T006: Configure Vite ES2022 build target
- T007: Create type definitions in src/types/index.ts

Phase 2 - Foundational:
- T008: Implement fileService with validation
- T009: Implement previewService with Blob URL
- T010: Create useDebounce hook
- T011: Create projectStore skeleton
- T012: Create uiStore for UI state
- T013: Create SplitPane component
- T014: Create Header component
- T015: Add global CSS styles
- T016: Setup App.tsx with 3-panel layout
```

### Step 4: Execute Phase 1 (Sequential)

Phase 1 tasks have dependencies - execute sequentially:

```bash
# In Vibe-Kanban UI:
1. Click on task "T001 - Initialize Vite Project"
2. Click "+" to create a task attempt
3. Select agent: CLAUDE_CODE (or your preferred agent)
4. Select base branch: main
5. Click "Create & Start"
6. Wait for completion
7. Review changes, then merge

# Repeat for T002, T003, T007 (sequential)
```

**Parallel Opportunity**: After T001-T003 complete, T004/T005/T006 can run in parallel:

```bash
# Start T004, T005, T006 simultaneously
1. Open T004 → Create & Start with CLAUDE_CODE
2. Open T005 → Create & Start with GEMINI (different agent)
3. Open T006 → Create & Start with CLAUDE_CODE variant

# Each task runs in its own git worktree - no conflicts!
```

### Step 5: Execute Phase 2 (Partial Parallel)

```bash
# Sequential first:
T008 (fileService) → T011 (projectStore depends on types)

# Then parallel batch 1:
T009 (previewService)  ← parallel
T010 (useDebounce)     ← parallel
T012 (uiStore)         ← parallel

# Then parallel batch 2:
T013 (SplitPane)       ← parallel
T014 (Header)          ← parallel
T015 (global CSS)      ← parallel

# Finally:
T016 (App.tsx integration) - depends on all above
```

### Step 6: Execute User Stories in Parallel

After Phase 2, all user stories can run simultaneously with different agents:

```bash
# Agent 1: Working on US1 (Core Editor + Preview)
Task: US1 - Implement Monaco Editor and Preview
Branch: feature/us1-editor-preview
Agent: CLAUDE_CODE

# Agent 2: Working on US2 (Multi-file Management)
Task: US2 - Implement File Explorer and Multi-file Support
Branch: feature/us2-file-management
Agent: GEMINI

# Agent 3: Working on US4 (Project Persistence)
Task: US4 - Implement localStorage Persistence
Branch: feature/us4-persistence
Agent: CLAUDE_CODE (variant: PLAN)
```

**Vibe-Kanban automatically**:
- Creates isolated git worktrees for each task
- Prevents agents from interfering with each other
- Tracks task status in real-time
- Allows you to review and merge completed work

---

## Scenario B: Continue from Phase 2

If Phase 1 and part of Phase 2 are already complete, here's how to continue:

### Step 1: Launch Vibe-Kanban

```bash
cd /path/to/20260103-front-end-sandbox
npx vibe-kanban
```

### Step 2: Create/Import Project

1. Create project pointing to existing repository
2. Set current branch as base branch

### Step 3: Create Remaining Tasks

Based on current progress (Phase 2 mostly complete), create these tasks:

```
Remaining Phase 2:
------------------
Task: T016 - App.tsx Integration (if not complete)
Description: Setup App.tsx with basic layout structure (3-panel placeholder)

Phase 3 - US1 Core Editor + Preview:
------------------------------------
Task: T017-T019 - Editor Component
Description:
- Create Editor component wrapper for Monaco
- Configure Monaco options (dark theme, no minimap, 14px)
- Implement onContentChange with debounce

Task: T020-T021 - Preview Component
Description:
- Create Preview component with iframe
- Implement Blob URL generation and cleanup

Task: T022 - Error Handler Injection
Description: Add error handler injection for JS runtime errors in previewService

Task: T023 - HTML Builder
Description: Implement HTML builder combining HTML/CSS/JS in src/utils/htmlBuilder.ts

Task: T024-T028 - Integration
Description:
- Connect Editor and Preview via projectStore
- Add default project files
- Create PreviewToolbar and ConsolePanel
- Style editor and preview panels
```

### Step 4: Execute US1 Tasks

For a single developer, execute sequentially within US1:

```bash
# Create task attempt for each:
T017 → T018 → T019  (Editor component - sequential, same file)
T020 → T021         (Preview component - sequential, same file)
T022                (previewService enhancement)
T023                (htmlBuilder utility)
T024 → T028         (Integration and styling)
```

### Step 5: Parallel Execution (Multi-Agent)

If you have multiple agents available:

```bash
# Terminal 1 (Agent: CLAUDE_CODE)
Task: Editor Component Bundle (T017-T019)
Branch: feature/editor-component

# Terminal 2 (Agent: GEMINI)
Task: Preview Component Bundle (T020-T021)
Branch: feature/preview-component

# Terminal 3 (Agent: CODEX)
Task: Utility Functions (T022, T023)
Branch: feature/preview-utils
```

### Step 6: Merge and Continue

After all parallel tasks complete:

1. Review each task's changes in Vibe-Kanban
2. Resolve any conflicts during merge
3. Run integration task T024-T028
4. Validate checkpoint: "Edit code → See preview update within 500ms"

---

## Task Parallelization Strategy

### Parallelization Matrix

Based on tasks.md analysis:

| Phase | Total Tasks | Parallelizable | Parallel Groups |
|-------|-------------|----------------|-----------------|
| Phase 1 | 7 | 3 | T004, T005, T006 |
| Phase 2 | 9 | 5 | T009/T010/T012, T013/T014/T015 |
| Phase 3 (US1) | 12 | 4 | T022/T023, T017/T020 |
| Phase 4 (US2) | 11 | 3 | T029/T030/T031 |
| Phase 5 (US3) | 10 | 3 | T043/T044/T045 |
| Phase 6 (US4) | 8 | 2 | T050/T051 |
| Phase 7 (US5) | 6 | 2 | T058/T059 |
| Phase 8 | 7 | 5 | All polish tasks |

### Cross-Story Parallel Execution

After Phase 2, user stories are independent and can run completely in parallel:

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 2 Complete                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Agent 1   │   │   Agent 2   │   │   Agent 3   │
│    US1      │   │    US2      │   │    US4      │
│ Editor+Prev │   │ FileExplorer│   │ Persistence │
└─────────────┘   └─────────────┘   └─────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
                  ┌─────────────┐
                  │ Integration │
                  │   & Merge   │
                  └─────────────┘
```

### Recommended Agent Assignment

| User Story | Complexity | Recommended Agent | Variant |
|------------|------------|-------------------|---------|
| US1 (Editor) | High | CLAUDE_CODE | DEFAULT |
| US2 (Files) | Medium | GEMINI | DEFAULT |
| US3 (CRUD) | Medium | CLAUDE_CODE | PLAN |
| US4 (Storage) | Low | CODEX | DEFAULT |
| US5 (Export) | Low | GEMINI | DEFAULT |

---

## Best Practices

### 1. Task Granularity

```bash
# Good: Focused task
"Implement debounce hook in src/hooks/useDebounce.ts"

# Bad: Too broad
"Implement all hooks"
```

### 2. Clear Task Descriptions

Include in each task:
- Specific file paths
- Expected inputs/outputs
- Dependencies (if any)
- Validation criteria

### 3. Review Before Merge

Vibe-Kanban runs agents with `--dangerously-skip-permissions`. Always:
1. Review generated code before merging
2. Run tests if available
3. Check for security issues

### 4. Handle Conflicts

When parallel tasks touch similar areas:
1. Complete one task first
2. Rebase the second task's branch
3. Let the agent fix conflicts
4. Or manually resolve in IDE

### 5. Monitor Progress

Use Vibe-Kanban's real-time logs to:
- Watch agent reasoning
- Catch errors early
- Provide follow-up instructions
- Redirect if needed

---

## Quick Reference Commands

```bash
# Start Vibe-Kanban
npx vibe-kanban

# With fixed port
PORT=8080 npx vibe-kanban

# Keyboard shortcuts in Vibe-Kanban
c           # Create new task
Cmd+Enter   # Send message to agent
Shift+Tab   # Switch agent profile

# Git worktree commands (handled automatically by Vibe-Kanban)
git worktree list
git worktree add ../task-branch-worktree feature/task-branch
git worktree remove ../task-branch-worktree
```

---

## Summary

### From Scratch (0 to 1)

1. `npx vibe-kanban` - Launch
2. Create project in UI
3. Import/create tasks from tasks.md
4. Execute Phase 1 (mostly sequential)
5. Execute Phase 2 (partial parallel)
6. Execute US1-US5 in parallel with multiple agents
7. Review, merge, and integrate

### From Phase 2 Onwards

1. `npx vibe-kanban` - Launch
2. Create project pointing to existing repo
3. Create remaining tasks for US1-US5
4. Assign different agents to different user stories
5. Execute in parallel
6. Merge completed work sequentially
7. Run integration and polish tasks

---

*Generated for Frontend Sandbox MVP project*
*Last updated: 2026-01-03*
