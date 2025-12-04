# Testing in web applications -course: Basic CRUD ToDo web app (JS + localStorage)

A minimal full-stack JavaScript Todo application intended for learning unit testing with Vitest and end-to-end testing with Cypress (added later). This version has no database; tasks are stored in the browser's localStorage.

## Technology stack

- **Backend**: Node.js (Express) serving static files and simple health/version endpoints
- **Frontend**: Vanilla JavaScript, HTML, CSS (no framework)
- **Storage**: `localStorage` in the browser (`todo_tasks_v1`)
- **Dev tooling**: None required initially (tests will be added in a later phase: this is the exercise)

### Features

- Create a task (topic, priority, status, description)
- Update a task (edit all fields)
- Mark task as complete (toggle complete/undo)
- Delete a task
- Sorted list: not-done first, higher priority first, newest first

### Getting started

1. Ensure Node.js 18+ is installed.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the server:

   ```bash
   npm start
   ```

4. Open the app at `http://localhost:5173`

### Project structure

```text
.
├─ public/
│  ├─ index.html     # UI markup
│  ├─ styles.css     # styling
│  └─ app.js         # localStorage CRUD logic
├─ server.js         # Express static server + health/version
├─ package.json
└─ README.md
```

### Notes for the testing phase (later)

- Unit tests (Vitest): pure functions and DOM interactions in `public/app.js` can be factored further if needed.
- E2E tests (Cypress): target user flows—create, update, complete/undo, delete; use `/health` to check server readiness.

### Updates on my version (2.0)
- Added priority filter.
- Functionality and end-to-end tests using Github Actions.
- AI-assisted work.
- See comments in code files to see changes and my thoughts about this work.
- Functional tests are in tests-folder and E2E are found in cypress-folder. 
