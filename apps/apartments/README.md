Goal

Mobile-first web app for apartment viewings where you:

prepare a reusable checklist/questions beforehand
answer questions quickly during the visit
switch between sections fast
save everything locally
export to JSON / Excel / Google Drive
compare multiple apartments later

---

Questions appear one-by-one:

[ Question 4 / 25 ]

Does apartment have solar panels?

[ Yes ]
[ No ]
[ Skip ]

Swipe or buttons:

Next
Previous
Jump to section

---

Question types

Support:

Type Example
text Notes
number Apartment size
boolean Solar panels
select Heating type
multi-select Included appliances
rating Noise 1-5
photos Bathroom photos

---

Notes per question

Example:

Question:
Condition of kitchen?

Answer:
Good

Extra note:
Cabinets old but appliances new

---

Final summary screen

Before leaving apartment:

Missing answers: 3

- Elevator condition
- Common expenses
- Parking ownership

## Very useful.

Phase 2 — Comparison

Most valuable feature later.

Apartment comparison table
Apartment Price m² Solar Parking Condition
A €240k 92 Yes Yes Good
B €225k 88 No No Medium

This becomes extremely useful after 5–10 viewings.

---

UX Recommendations
Mobile-first mandatory

You will use it while walking.

Use:

large buttons
thumb-friendly UI
autosave
offline support

---

Photo attachment

Attach photos directly to question:

cracks
boiler
electrical panel
parking

Store locally initially.

---

# Recommended Stack

## Frontend

- React
- TypeScript
- Vite
- Zustand
- TanStack Query
- React Hook Form
- Tailwind

---

# Backend Recommendation

Cloudflare Workers + D1 + R2

D1

- questions
- templates
- apartments
- answers
- categories

---

R2

Store:

- apartment photos
- exported files
- PDFs later

---

### Workers

API layer.

Cheap and simple.

---

### Optional Later

Use:

- Cloudflare Durable Objects

Only if later you want:

- real-time collaboration
- live editing
- multi-user sync

Not needed initially.

---

# High-Level Architecture

```text
React App
    ↓
Cloudflare Workers API
    ↓
D1 Database
    ↓
R2 Storage
```

---

# Core Data Model

# 1. Questions

```ts
type Question = {
  id: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select'
  categoryId: string
  required: boolean
  options?: QuestionOption[]
  archived?: boolean
  order: number
}
```

---

# 2. Question Options

For selects.

```ts
type QuestionOption = {
  id: string
  questionId: string
  label: string
  value: string
  order: number
}
```

Example:

```text
Heating Type:
- Central
- Split Units
- Underfloor
```

---

# 3. Apartments

```ts
type Apartment = {
  id: string
  title: string
  address?: string
  price?: number
  createdAt: string
}
```

---

# 4. Answers

Critical design choice:

Answers reference questions by ID.

```ts
type Answer = {
  apartmentId: string
  questionId: string
  value: unknown
  note?: string
}
```

This solves your dynamic schema requirement.

---

# Why This Solves Your Problem

Example:

## You already inspected 10 apartments

Then later you add:

```text
Question:
"Does building have thermal insulation?"
```

All apartments automatically:

```text
question exists
answer missing
```

because answers are separate from schema.

Exactly what you need.

---

# Same for Select Options

Example:

Before:

```text
Heating:
- AC
- Central
```

Later:

```text
+ Underfloor
```

All apartments instantly see new option.

No migration needed.

---

# Important UI Concept

# Completion is Dynamic

Do NOT store:

```text
completed: true
```

Instead calculate:

```text
answeredQuestions / totalQuestions
```

in real-time.

Because questions can change later.

---

# Pages Structure

# 1. Dashboard

```text
Apartments
Templates
Questions
Export
Settings
```

---

# 2. Apartment List

```text
[ ] Needs Review
[ ] Completed
[ ] Missing Critical Info
```

---

# 3. Apartment Inspection Screen

Main working screen.

---

# 4. Question Management Page

Very important.

This becomes your admin panel.

---

# Question Management Features

## Create Question

Fields:

- label
- type
- category
- required
- critical
- order
- default value

---

## Edit Question

Updates globally everywhere.

---

## Archive Question

Do NOT delete.

Use:

```text
archived = true
```

Otherwise old inspections break.

---

## Reorder Questions

Drag and drop.

---

## Manage Select Options

Example:

```text
Heating Type

+ Central
+ AC
+ Underfloor
```

---

# Critical Recommendation

# Never delete questions physically

Because:

Old apartment answers reference them.

Instead:

```text
isArchived: true
```

---

# Suggested Database Tables

# questions

| id  | label | type | category_id |
| --- | ----- | ---- | ----------- |

---

# question_options

| id  | question_id | value |
| --- | ----------- | ----- |

---

# apartments

| id  | title | price |
| --- | ----- | ----- |

---

# answers

| apartment_id | question_id | value |
| ------------ | ----------- | ----- |

---

# categories

| id  | name | order |
| --- | ---- | ----- |

---

# UX Improvements

# Apartment Overview

Show:

```text
Completion: 82%

Missing Critical:
- Title deeds
- Common expenses
```

---

# Fast Question Navigation

Sidebar:

```text
General
Kitchen
Bathroom
Building
Financial
Problems
```

with indicators:

```text
8/10 answered
```

---

# Apartment Comparison

This will become one of the best features.

Because answers are normalized.

You can generate:

| Apartment | Solar | Parking | Cracks | Noise |
| --------- | ----- | ------- | ------ | ----- |

very easily.

---

# Export Strategy

# JSON Export

Simple full backup.

---

# Excel Export

One row = apartment.

Columns generated dynamically from questions.

Example:

| Title | Price | Solar | Heating | Noise |
| ----- | ----- | ----- | ------- | ----- |

---

# PDF Export Later

Useful when discussing with wife/realtor.

---

# Cloudflare Deployment Plan

# Frontend

Deploy on:

- Cloudflare Pages

---

# Backend

Deploy on:

- Cloudflare Workers

---

# Database

- Cloudflare D1

---

# Files

- Cloudflare R2

---

# Authentication

Initially:

```text
No auth
```

or simple email login.

Later:

- Google auth
- magic links

---

# Suggested API Structure

```text
GET    /questions
POST   /questions
PATCH  /questions/:id

GET    /apartments
POST   /apartments

GET    /apartments/:id
POST   /answers

GET    /export/xlsx
```

---

# Recommended MVP Scope NOW

# Must Have

## Questions

- create/edit/archive
- select options
- categories
- ordering

---

## Apartments

- create/edit
- dynamic completion
- notes
- critical missing indicators

---

## Exports

- JSON
- Excel

---

## Photos

Optional for MVP but highly recommended.

Even basic upload helps enormously.

---

# Future Features Worth Adding

# Templates

Example:

```text
Apartment Template
House Template
New Build Template
```

Different question sets.

---

# Scoring

Weighted evaluation.

---

# Timeline

Track:

```text
Visited
Negotiating
Lawyer Review
Rejected
Purchased
```

---

# Biggest Technical Advice

Treat questions as:

```text
database-driven schema
```

NOT hardcoded UI fields.

This is the most important architectural decision in the whole project.
