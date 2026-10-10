# GRILL ME — The Larkspur Affair

A free-form murder-mystery interrogation (in the spirit of *Vaudeville*) built with Three.js — with the one thing that game was criticised for fixed: **suspects don't contradict themselves.**

## Run
```
cd grillme && npm install
ANTHROPIC_API_KEY=sk-... npm start     # Claude voices the suspects
npm start                              # offline mode: scripted keyword answers
npm test
```
Open http://localhost:3000.

## Why they don't contradict themselves
- Ground truth lives in `case.mjs`, not in a prompt. Each suspect has a fixed stance per fact: `truth`, `lie` (one canonical cover story), or `unknown`.
- Claude answers through a `respond` tool: `speech` plus structured `claims` (`fact`, `true|false|unknown`).
- `engine.validate` checks every claim against the required stance. Violations are rejected and retried (3x), then a scripted line is used.
- A lie only flips when *all* required evidence has been presented. The flip is logged in the player's Statements tab as **STORY CHANGED**.

## Skills installed (skills.sh)
`frontend-design` (anthropics/skills), `threejs-game-director` (majidmanzarpour/threejs-game-skills) — in `.agents/skills`, symlinked into `.claude/skills`.
