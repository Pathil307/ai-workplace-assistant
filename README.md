# AI Workplace Assistant

Build a modern, responsive web app named “AI Workplace Productivity Assistant.” Create one integrated professional SaaS product with a persistent dark-green sidebar (mobile collapsible) for Dashboard, Smart Email Generator, Meeting Notes Intelligence, and AI Task Planner. Use the requested palette: #14532D, #22C55E, #DCFCE7, #F8FAFC, #FFFFFF, #111827, #64748B. Prioritize polished responsive UI, forms, loading/error/empty/success states, editable outputs, copy/reset actions, accessibility, and human-in-the-loop Responsible AI messaging.

Implement Dashboard with welcome text exactly as requested, 3 prominent quick-action cards, activity statistics that reflect activity in the app where possible (emails generated, meetings summarised, tasks planned, tasks completed), activity-based productivity insights (high-priority tasks, upcoming/overdue deadlines, action items extracted), and an estimate label if showing any time savings. Keep Email Generator accessible via dashboard quick action.

Smart Email Generator page: fields for purpose, recipient role/type, key information, tone (Formal/Friendly/Persuasive), length (Short/Medium/Detailed), urgency (Normal/Important/Urgent). Generate subject and workplace-appropriate email with greeting, paragraphs, closing; output must be editable. Include Generate, Regenerate, Copy, Clear and visible reminder to review before sending. AI behavior/prompt constraints: never invent names, dates, facts, commitments, or information absent from inputs. No auto-send.

Meeting Notes Intelligence page: inputs title/date/participants/objective/notes. Analyse into clearly distinct editable Meeting Summary, Key Decisions, Action Items, Deadlines. Action items include Task, Responsible person, Deadline where present, otherwise show “Not specified.” Include Copy, Clear meeting, Regenerate analysis, editing, and per-action-item “Add to Task Planner.” Transfer the action item into Task Planner with task name, responsible person, deadline. Avoid inventing details.

AI Task Planner: multiple editable tasks with task name, description, deadline, estimated duration, priority (High/Medium/Low), status (Not Started/In Progress/Completed), with responsible person when supplied by meeting integration. Let user choose Daily or Weekly planning and available working hours. Analyse/prioritize based on deadlines/duration, call out urgent and overdue tasks, recommend efficient order, show readable generated daily/weekly schedule and concise reasoning for high-priority recommendations. Users can add/edit/remove tasks, mark complete, change priority/deadlines, regenerate schedule. Ensure actual activity counters update.

Use structured, clearly isolated prompt/service logic for all AI features, with role, task, user input, format, and constraints so prompts can be refined. Use structured outputs for action items/deadlines/priorities. If live AI capability requires setup, still provide polished deterministic/demo behavior and clear UI states rather than leaving features nonfunctional. Include a prominent Responsible AI section/disclaimer using the requested guidance: generated content can contain errors; review and verify; do not enter confidential, sensitive, private, or personally identifiable data; AI assists, users review/edit/approve/take action. Do not make workplace decisions or send emails automatically.

Make the application coherent, realistic and production-quality, not a basic demo. Use icons, rounded cards, subtle shadows, whitespace and mobile-safe layouts. Enable backend/cloud only if needed for durable saved data or live AI; otherwise implementation can retain in-app activity state.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f3278a19-010f-446b-b207-6eea5aa6a26c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
