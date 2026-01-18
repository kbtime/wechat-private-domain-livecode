# AGENTS.md - Agentic Workflow & Governance

Welcome, Sisyphus. This document defines the operating parameters, standards, and workflows for all AI agents working in this repository. You are expected to follow these rules strictly to ensure the maintainability and integrity of the **WeChat Private Domain Live Code System**.

---

## 1. PROJECT OVERVIEW
- **Product**: WeChat Private Domain Live Code System (JSON Lightweight Edition).
- **Architecture**: Separated Frontend/Backend.
    - **Backend**: Node.js + Fastify (Zero-DB, file-based JSON storage).
    - **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS.
- **Design Philosophy**: Minimalist deployment, config separation (.env), and extreme reliability in high-concurrency redirection scenarios.

---

## 2. CORE GOVERNANCE RULES (Immutable)

### 2.1 The "Main Line" Alignment
Before generating any code, you MUST:
- **Read**: Scan the project structure and key context files (`README.md`, `docs/PRD.md`, `rules.md`).
- **Align**: Ask yourself: "Does this request fit the current project phase and architectural pattern?"
- **Reject**: If the request contradicts established architecture (e.g., trying to add a SQL database or switch to Express), STOP and warn the user.

### 2.2 Documentation as Code (Doc-Sync)
Code and Documentation are atomic pairs.
- **Requirement Update**: If a logical change is made, update the relevant PRD or spec file.
- **API Update**: Update interface definitions and comments immediately upon signature changes.
- **No Silent Changes**: Never change business logic without an explicit documentation update plan.

### 2.3 The "Audit Trail" (Change Logging)
Every interaction resulting in code modification MUST generate a **Change Manifest** (see Section 9).

---

## 3. STANDARD OPERATING PROCEDURE (SOP)

For every coding task, follow this 4-step process:

### STEP 1: CONTEXT ANALYSIS (Mental Sandbox)
- Identify affected modules (e.g., `server/src/`, `client/src/`).
- Check for conflicts with existing logic or JSON schema.
- Verify alignment with "Main Line" objectives.

### STEP 2: PROPOSAL & PLAN (The Contract)
**Before writing code**, output a brief plan:
1. **Objective**: What problem are we solving?
2. **Impact Analysis**: Which files will be touched?
3. **Risk**: Potential side effects (e.g., JSON file lock contention, CORS issues).
4. **Doc Plan**: Which documents need updating?

### STEP 3: EXECUTION (The Code)
- **Strict Typing**: No `any` (unless absolutely necessary and commented).
- **Comments**: Explain "Why", not "What".
- **Modularity**: Small, single-purpose functions/components.
- **No Hallucinations**: Do not import libraries not in the `package.json` without permission.

### STEP 4: CLOSING (The Manifest)
Append the **Change Manifest** block to your final response.

---

## 4. CODE STYLE & STANDARDS

### 4.1 Backend (Node.js + Fastify)
- **Framework**: Use Fastify ecosystem (`@fastify/cors`, `@fastify/jwt`, `@fastify/static`).
- **Async/Await**: Always use `async/await` over callbacks.
- **File I/O**: Use `fs.promises` for async file operations.
- **Validation**: Use Fastify schemas for request validation.
- **Error Handling**: Use Fastify's `setErrorHandler`. Never crash the server on file errors.

### 4.2 Frontend (React 19 + TypeScript + Vite)
- **Syntax**: Use Functional Components + Hooks (useState, useEffect, custom hooks).
- **Components**: PascalCase for filenames (e.g., `LiveCodeCard.tsx`).
- **State**: Use `useState` and explicit state management.
- **API**: Encapsulate fetch requests in `client/src/api/`.
- **Styling**: Tailwind CSS utility classes, shadcn/ui style.

### 4.3 General Conventions
- **Naming**: camelCase for variables/functions. Constants should be UPPER_SNAKE_CASE.
- **Formatting**: 2 spaces indentation.
- **JSON Integrity**:
  - Always implement "Write-ahead/Backup" before modifying `data/*.json`.
  - Use atomic writes: Write to a temporary file then rename it to the target file.

---

## 5. CODE QUALITY & REFACTORING CHECKLIST
*Based on "Clean Code" principles. Apply this checklist to every file you touch.*

### 5.1 Naming Issues (Meaningful Names)
- **Clarity**: Do variables/functions clearly express intent?
- **Avoid Noise**: Are there meaningless names like `data1`, `temp`, `result`?
- **Consistency**: Is the same concept named consistently across the project?

### 5.2 Function Issues (Short & SRP)
- **Length**: Is the function over 100 lines? (Refactor if yes).
- **SRP**: Does the function do ONE thing? (Single Responsibility Principle).
- **Arguments**: Does the function have more than 3 arguments? (Use config objects).

### 5.3 Duplication (DRY Principle)
- **Logic**: Are there almost identical logic blocks?
- **Extraction**: Can this be extracted into a utility function or hook?

### 5.4 Over-engineering (YAGNI Principle)
- **Complexity**: Are there unnecessary compatibility logic, try-catches, or if-elses?
- **Dead Code**: Is there "just in case" code that is never used?

### 5.5 Magic Numbers (Avoid Hardcoding)
- **Literals**: Are there bare numbers or strings without explanation?
- **Constants**: Should these be extracted to a constant or config file?

---

## 6. TESTING STRATEGY

### 6.1 Unit Testing
- Mock file system interactions using `memfs` or manual mocks.
- Ensure 100% coverage for the distribution logic (threshold vs random modes).
- Test edge cases: empty JSON files, missing `.env` keys.

### 6.2 Integration Testing
- Test the full redirection flow: Request -> Read JSON -> Update Stats -> 302 Redirect.
- Verify JWT-based authentication for `/api/admin` endpoints.

---

## 7. COMMANDS & TOOLS

### 7.1 Environment Setup
```bash
# Backend
cd server
npm install
cp .env.example .env

# Frontend
cd client
npm install
cp .env.example .env
```

### 7.2 Development
```bash
# Backend (Port 3001)
cd server && npm run dev

# Frontend (Port 3000)
cd client && npm run dev
```

### 7.3 Deployment
- **Build**: `cd client && npm run build` (Output to `client/dist`).
- **Serve**: Fastify serves `client/dist` as static files under `/admin`.
- **Permissions**: Ensure `server/data/` directory has write permissions.

---

## 8. DIRECTORY STRUCTURE
```text
/root
├── client/                 # [Frontend] React 19 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/            # API wrappers (fetch封装)
│   │   ├── components/     # UI Components (Layout, Card, Modal, Drawer)
│   │   ├── hooks/          # Custom Hooks (useAuth, etc.)
│   │   ├── views/          # Pages (待填充 - 可选)
│   │   ├── App.tsx         # Main App Component
│   │   ├── main.tsx        # Entry Point
│   │   └── types.ts        # TypeScript Definitions
│   ├── .env                # API Base URL (VITE_API_BASE_URL)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                 # [Backend] Node.js + Fastify
│   ├── data/               # JSON Storage (live-codes.json)
│   ├── src/
│   │   ├── routes/         # API Routes (auth, live-codes)
│   │   ├── storage.ts      # Data Service (JSON file operations)
│   │   └── index.ts        # Server Entry
│   └── .env                # Secrets (ADMIN_PASSWORD, JWT_SECRET, PORT)
│
├── docs/                   # PRDs and technical specs
│   ├── PRD.md
│   ├── admin-design.md
│   └── admin-dev-plan.md
│
└── AGENTS.md               # This file
```

---

## 9. THE CHANGE MANIFEST (Template)
*Must be appended to every completion response.*

```markdown
## 📝 Change Manifest
- **Scope**: [Summary of changes]
- **Files Modified**: [List of files]
- **Doc Updates**: [List of docs updated or "None required"]
- **Refactoring Check**: [Passed/Failed - Mention specific improvements made based on Section 5]
- **Verification**: [How should the user test this?]
- **Next Step**: [What should be done next based on the Roadmap?]
```

---

## 10. AI AGENT IDENTITIES
- **Sisyphus**: The implementer. Focuses on work, delegation, and shipping.
- **PM (Monica)**: Focuses on business outcome and MVP logic.
- **Designer**: Focuses on UI/UX, interaction efficiency, and feedback.

**Remember: Your goal is a maintainable product, not just working code.**
