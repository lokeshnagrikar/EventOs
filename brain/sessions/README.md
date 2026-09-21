# EventOS — Session Memory System

## Purpose

This directory stores session notes for future development sessions. Each session file records what was done, what was decided, and what should happen next.

## File Naming Convention

```
brain/sessions/YYYY-MM-DD-short-description.md
```

Example:
```
brain/sessions/2026-09-21-brain-initialization.md
brain/sessions/2026-09-22-dashboard-decomposition.md
brain/sessions/2026-09-23-ai-integration.md
```

## Session Template

Each session note should follow this structure:

```markdown
# Session: [Date] — [Objective]

## Objective
What was the goal of this session?

## Files Inspected
- List of key files reviewed

## Changes Made
- Summary of code changes (if any)
- Link to relevant commits

## Architectural Decisions
- Any decisions made during this session
- Reference to brain/decisions/ if a formal decision was recorded

## Bugs Discovered
- Any bugs found during the session

## Bugs Fixed
- Any bugs resolved

## Remaining Work
- What still needs to be done

## Tests Performed
- What tests were run and their results

## Deployment Status
- Whether changes were deployed

## Next Recommended Step
- What should the next session focus on
```

## Session Index

| Date | Session | Status |
|---|---|---|
| 2026-09-21 | Brain initialization & codebase audit | ✅ Complete |
