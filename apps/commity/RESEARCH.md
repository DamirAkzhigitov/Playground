# Commity — Integration Research

Research date: **2026-05-23**

This document surveys integrations that could turn Commity from a **reactive chat + Gmail assistant** into a **daily personal assistant** — proactive briefings, tasks, reminders, and cross-app actions. Gmail is already implemented; everything below builds on or extends that foundation.

**Sources:** Commity codebase/docs, Google/Microsoft/Cloudflare developer docs, competitor products (Gemini Daily Brief, Google CC, Todoist AI, Zapier MCP, irel, Ezail, REM Labs), and open-source MCP servers.

---

## 1. Current baseline (what Commity already has)

| Capability | Status | Notes |
| ---------- | ------ | ----- |
| Chat + OpenAI tool loop | Done | Up to 5 tool rounds per turn (`worker/src/openai.ts`) |
| Gmail OAuth + encrypted tokens in D1 | Done | Same pattern as compare auth |
| Inbox tools (search/star/trash) | Done | `gmail.modify` scope |
| Email draft + user confirm send | Done | `prepare_email` → `EmailDraftCard` |
| Chat history in localStorage | Done | Server sees ≤20 messages per request |
| Auth (email/password, D1 sessions) | Done | No third-party login yet |

**Architecture constraints that shape integration choices:**

- **Cloudflare Worker + Hono + D1** — OAuth tokens and user prefs fit D1; heavy background jobs need Cron Triggers, Queues, or Durable Objects.
- **Privacy posture** — Chat text stays on device; only last 20 messages hit OpenAI. Any new integration should follow **incremental OAuth scopes** and **confirm-before-act** for destructive or outbound actions (same as email send).
- **Existing Gmail OAuth** — Reuse Google Cloud project, token crypto (`tokenCrypto.ts`), and incremental authorization rather than one giant consent screen.

---

## 2. Product vision: what “daily personal assistant” means

Competitors converge on a few patterns:

| Pattern | Examples | Commity gap today |
| ------- | -------- | ----------------- |
| **Morning / daily brief** | [Gemini Daily Brief](https://gemini.google/overview/daily-brief/), [Google CC “Your Day Ahead”](https://blog.google/innovation-and-ai/products/gemini-app/next-evolution-gemini-app/) | Reactive only — user must open chat |
| **Calendar + email together** | Gemini Spark, CC, [irel](https://irel.ai/) | Gmail only, no schedule context |
| **Tasks & reminders** | Todoist + Claude, Google Tasks, Apple Reminders sync tools | No task store or reminders |
| **Proactive nudges** | Push notifications, email briefings | No outbound channel |
| **Multi-channel access** | WhatsApp/Telegram ([Ezail](https://www.ezail.com/), [irel](https://irel.ai/)) | Web app only |
| **Structured API memory** (not screen recording) | [REM Labs](https://remlabs.ai/blog/rem-labs-vs-rewind-limitless) | No long-term user context beyond 20 msgs |

**Design principle for Commity:** Prefer **bounded API integrations** (Gmail, Calendar, Tasks) over passive capture (screen/audio recording). Limitless/Rewind-style “search your life” is being [sunset](https://www.limitless.ai/) and raises consent/privacy issues REM Labs documents well.

---

## 3. Integration map (by category)

### Legend

| Priority | Meaning |
| -------- | ------- |
| **P0** | Highest ROI; extends Gmail naturally; fits Worker architecture |
| **P1** | Strong daily-assistant value; moderate effort |
| **P2** | Valuable for subsets of users or later phases |
| **P3** | Long tail, heavy compliance, or platform-limited |

| Effort | Rough estimate for Commity |
| ------ | --------------------------- |
| S | Reuse Gmail OAuth infra, 1–2 weeks |
| M | New OAuth provider or UI surface, 2–4 weeks |
| L | Compliance, multi-channel, or major product work, 1–3+ months |

---

## 4. Google Workspace (extend existing OAuth)

Best first expansion: same Google Cloud project, **incremental scopes** per feature ([Google OAuth best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)).

### 4.1 Google Calendar — **P0, Effort S–M**

**Why:** Email and calendar are the core of daily planning. Gemini Daily Brief and CC both combine Gmail + Calendar. Natural language scheduling (“Lunch with Sam Friday 1pm”) is a standard assistant expectation.

**API:** [Google Calendar API](https://developers.google.com/workspace/calendar/api/quickstart/nodejs)  
**OAuth scopes (start minimal):**

| Scope | Use |
| ----- | --- |
| `calendar.events.readonly` | Today’s agenda, free/busy for briefings |
| `calendar.events` | Create/update/delete (with confirm card) |
| `calendar.calendarlist.readonly` | List calendars |

Google also documents an official [Calendar MCP server](https://developers.google.com/workspace/calendar/api/guides/configure-mcp-server) (`https://calendarmcp.googleapis.com/mcp/v1`). Commity can implement the same tools natively in the Worker (consistent with Gmail inbox tools) rather than calling an external MCP.

**Suggested tools (mirror open-source [google-calendar-mcp](https://github.com/nspady/google-calendar-mcp)):**

- `list_calendars`, `list_events`, `search_events`, `get_event`
- `get_freebusy` — check conflicts before booking
- `create_event`, `update_event`, `delete_event` — **confirm card** before writes
- `quick_add_event` — natural language via Calendar API

**UX patterns:**

- “What’s on my calendar today?” → read-only, no confirm
- “Schedule dentist Thursday 3pm” → preview card → user confirms
- Morning brief: Cron job aggregates Calendar + Gmail unread (see §6)

**Implementation notes:**

- Extend `gmail_accounts` table or add `google_accounts` with scope set per grant
- Reuse `oauth.ts` refresh flow; add `accountNeedsReconnect` when calendar scopes missing
- Store user timezone in D1 prefs (Calendar API needs it)

---

### 4.2 Google Tasks — **P0, Effort S**

**Why:** Lightweight task list without third-party signup. Pairs with chat (“add buy milk to my tasks”) and daily brief (“3 tasks due today”).

**API:** [Google Tasks API](https://developers.google.com/tasks)  
**Scopes:** `https://www.googleapis.com/auth/tasks` or `tasks.readonly`

**Suggested tools:**

- `list_task_lists`, `list_tasks`, `create_task`, `complete_task`, `delete_task`

**Caveats:** No time-of-day on tasks (API limitation — noted by [Obsidian Google Tasks plugin](https://github.com/YukiGasai/obsidian-google-tasks)). For timed reminders, combine with Calendar or push notifications.

---

### 4.3 Google Contacts (People API) — **P1, Effort S**

**Why:** “Email Bob about the meeting” works better when the model can resolve “Bob” → email address from the user’s contacts.

**API:** [People API](https://developers.google.com/people)  
**Scopes:** `contacts.readonly` (read) or `contacts` (read/write)

**Suggested tools:**

- `search_contacts` — query by name
- `get_contact` — email, phone, birthday
- `create_contact` — optional, with confirm

**Note:** Requires user OAuth (not service account) for personal contacts.

---

### 4.4 Google Drive & Docs — **P1, Effort M**

**Why:** CC and Gemini use Drive for “prepare for meeting” context (attached docs, notes). Enables “summarize the doc Alice shared” workflows.

**API:** [Drive API](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), [Docs API](https://developers.google.com/workspace/docs/api/auth)

**Scope strategy (important for Google verification):**

| Scope | Sensitivity | Recommendation |
| ----- | ----------- | -------------- |
| `drive.file` | Non-sensitive | **Preferred** — files user opens via picker or app creates |
| `drive.readonly` | Restricted | Only if broad search needed; triggers Google review |
| `documents.readonly` | Sensitive | Read Doc content for summarization |

**Suggested tools:**

- `search_drive_files` (if readonly scope granted)
- `get_file_metadata`, `export_doc_as_text`
- `create_doc` — with confirm

**UX:** Google Picker in the SPA for `drive.file` — user explicitly selects files to share with Commity.

---

### 4.5 Google Keep — **P3, Effort L**

**Why:** Popular for quick notes.  
**Blocker:** No public API. Not viable unless Google adds one.

---

## 5. Microsoft 365 (second ecosystem)

### 5.1 Outlook Mail + Calendar + To Do — **P1, Effort M–L**

**Why:** Many users are on Outlook/Hotmail/Work/school accounts, not Gmail.

**API:** [Microsoft Graph](https://learn.microsoft.com/en-us/graph/auth-v2-user)  
**Auth:** OAuth 2.0 + PKCE, delegated scopes, `offline_access` for refresh tokens

**Key scopes:**

| Scope | Use |
| ----- | --- |
| `Mail.ReadWrite` | Inbox + drafts (mirror Gmail tools) |
| `Calendars.ReadWrite` | Events |
| `Tasks.ReadWrite` | Microsoft To Do |
| `User.Read` | Profile |

**Implementation:** Parallel module to `worker/src/gmail/` → `worker/src/microsoft/`. Same encrypted token storage in D1. UI: “Connect Microsoft” alongside Gmail (user may connect one or both).

**Caveat:** Work/school tenants may block third-party apps; personal `@outlook.com` / `@hotmail.com` usually works.

---

## 6. Proactive daily assistant (not just chat)

These are **platform features** more than third-party OAuth — high impact for “daily tasks.”

### 6.1 Morning / daily briefing — **P0, Effort M**

**What competitors do:**

- [Gemini Daily Brief](https://support.google.com/gemini/answer/17077455): “Top of mind” (email + calendar + chat) + “Looking ahead” (goals)
- [Google CC](https://www.theverge.com/news/845280/google-cc-morning-briefing-gemini-ai-agent): Email to inbox each morning with schedule + draft actions
- [Fazm](https://fazm.ai/use-case/ai-morning-briefing): Scheduled aggregation before user wakes up

**Commity approach:**

1. **Cloudflare Cron Trigger** on Worker ([docs](https://developers.cloudflare.com/workers/configuration/cron-triggers/)) — e.g. `0 7 * * 1-5` UTC (adjust per user timezone in D1)
2. For each user with connected integrations + `briefing_enabled`:
   - Fetch today’s calendar events
   - Fetch Gmail unread / important (reuse inbox API)
   - Optional: open tasks from Google Tasks / internal task list
   - Call OpenAI once to synthesize brief (structured output)
3. **Deliver brief** via:
   - In-app: store last brief in D1 or KV; show banner when user opens chat
   - Email: send brief to user’s Gmail (meta — assistant emails you)
   - Web Push (see §6.2)

**Privacy:** Brief generation sends calendar/email metadata to OpenAI — disclose like inbox tools today.

---

### 6.2 Web Push reminders — **P0, Effort M**

**Why:** Assistant must reach users when the tab is closed. “Remind me at 3pm to call Mom” is table stakes.

**Tech:** [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) + service worker in SPA  
**Server:** Cloudflare Worker + VAPID keys; [Cloudflare Agents push guide](https://developers.cloudflare.com/agents/guides/push-notifications/) shows `schedule()` + `web-push` pattern

**Data model (D1):**

```sql
-- push_subscriptions (endpoint, keys, user_id)
-- reminders (id, user_id, message, fire_at, status, created_from_message_id?)
```

**Flow:**

1. User enables notifications in UI → `POST /api/push/subscribe`
2. Chat: model calls `create_reminder` tool → Worker schedules via Cron or Durable Object alarm
3. At fire time → push notification → deep link opens chat with context

**Alternative:** Email reminder via Gmail send (user already connected) — no service worker, but weaker UX.

---

### 6.3 Internal task list (Commity-native) — **P1, Effort S–M**

**Why:** Not every user uses Google Tasks/Todoist. A minimal D1 task store gives the assistant something to manage without third-party OAuth.

**Schema sketch:**

```sql
tasks (id, user_id, title, notes, due_date, due_time, status, priority, source, created_at)
```

**Tools:** `add_task`, `list_tasks`, `complete_task`, `snooze_task`

**Sync later:** Optional export/import to Google Tasks or Todoist.

---

### 6.4 User profile & preferences — **P1, Effort S**

**Why:** [claude-assistant](https://github.com/googlarz/claude-assistant) shows value of work hours, timezone, preferred name, meeting defaults.

**Store in D1 (`user_preferences`):**

- Timezone, locale, work hours
- Briefing time, briefing channels (push/email/in-app)
- Email sign-off style, default meeting length
- “Always confirm before send/create” toggles

**Tools:** `get_preferences`, `update_preferences` (or settings UI)

---

### 6.5 Smart context / memory — **P1, Effort M**

**Why:** 20-message window loses older context. Competitors use Memory ([Gemini](https://support.google.com/gemini/answer/17077455)) or API aggregation ([REM Labs](https://remlabs.ai/blog/rem-labs-vs-rewind-limitless)).

**Options for Commity (no screen recording):**

| Approach | Pros | Cons |
| -------- | ---- | ---- |
| Rolling summary in localStorage | Private, no server storage | Client-only, lost on device switch |
| Encrypted summary blob in R2/D1 | Cloud backup path | Server stores derived data |
| Structured “memory facts” in D1 | “User’s dentist is Dr. Lee, prefers morning meetings” | Needs extraction pipeline |

**Suggested:** After N messages, client requests `POST /api/chat/summarize` → stores summary locally; prepend summary to API slice. Aligns with `PLAN.md` “smart summarization later.”

---

## 7. Third-party productivity apps

### 7.1 Todoist — **P1, Effort S–M**

**Why:** Official AI tooling from Doist: [`@doist/todoist-ai`](https://github.com/Doist/todoist-ai/) npm package + hosted MCP at `https://ai.todoist.net/mcp`.

**Auth:** OAuth or API token per user  
**Tools:** `findTasksByDate`, `addTasks`, etc. — map directly to OpenAI tools

**Fit:** Users who already live in Todoist; good alternative to Google Tasks.

---

### 7.2 Notion — **P2, Effort M**

**Why:** Notes, wikis, project DBs. [Notion External Agents API](https://dev.to/akaranjkar08/notion-developer-platform-2026-workers-external-agents-api-database-sync-guide-3mea) (2026) lets agents read/write pages and databases.

**Use cases:**

- “Add meeting notes to my Projects database”
- Daily brief pulls from Notion task DB

**Auth:** OAuth integration + workspace selection

---

### 7.3 Apple Reminders — **P3, Effort L (platform)**

**Why:** Huge on iOS/macOS.  
**Blocker:** No official REST API. Community tools ([Remindian](https://github.com/Santofer/Obsync)) use macOS EventKit — not usable from Cloudflare Worker.

**Workarounds:**

- User syncs Reminders ↔ Google Tasks via third-party app; Commity talks to Google Tasks
- Shortcuts automation on user’s iPhone posting to Commity webhook (power users)

---

### 7.4 TickTick, Things 3, Asana, Linear — **P2–P3**

| App | API | Notes |
| --- | --- | ----- |
| TickTick | Open API + OAuth | Similar to Todoist |
| Asana | REST API | Good for team-ish personal projects |
| Linear | GraphQL API | Devs only |
| Things 3 | No public API | AppleScript on Mac only |

Prioritize based on your audience (personal vs. developer).

---

## 8. Communication channels (reach user outside browser)

### 8.1 Email-as-interface — **P1, Effort M**

**Why:** [Google CC](https://9to5google.com/2025/12/16/google-labs-cc/) and [Sift](https://docs.usesift.app/integrations/email) let users reply to briefings or CC the assistant on threads.

**Commity approach:**

- Unique alias per user: `{user-token}@assistant.commity.da-mr.com`
- Worker receives inbound email (Cloudflare Email Routing or Mailgun inbound)
- Parse → chat turn → reply email with draft/actions
- **Never send without explicit reply** (“send”, “yes”) — same trust model as draft card

---

### 8.2 WhatsApp / Telegram / SMS — **P2, Effort L**

**Why:** [irel](https://irel.ai/) and [Ezail](https://www.ezail.com/) meet users where they already chat.

**Implementation options:**

| Channel | Provider | Complexity |
| ------- | -------- | ---------- |
| WhatsApp | Meta Cloud API / Twilio | Business verification, template messages |
| Telegram | Bot API | Easiest — bot token + webhook to Worker |
| SMS | Twilio | Per-message cost |

**Architecture:** Channel message → normalize to chat message → same `/api/chat` pipeline → reply on channel. Store `external_id` + `provider` per user ([multi-channel pattern](https://github.com/Techgethr/whatsappagent)).

**Recommendation:** **Telegram first** (simplest webhook model); WhatsApp when product matures.

---

### 8.3 Slack — **P2, Effort M**

**Why:** Work notifications, “post summary to #me channel.”

**API:** [Slack OAuth](https://api.slack.com/authentication/oauth-v2) — bot token (`xoxb-`) vs user token (`xoxp-`) matter for identity ([Scalekit guide](https://www.scalekit.com/agent-connector/slack))

**Scopes (minimal):** `chat:write`, `channels:read`, optional `channels:history` for digest

**Use case:** Outbound only (briefings to DM) easier than reading all workspace messages.

---

## 9. Automation & extensibility

### 9.1 MCP as integration layer — **P1, Effort M**

**Why:** [Gemini Spark adds MCP partners](https://blog.google/innovation-and-ai/products/gemini-app/next-evolution-gemini-app/) (Canva, OpenTable, Instacart). Standard protocol for tools.

**Options for Commity:**

| Approach | Description |
| -------- | ----------- |
| **Native tools** (current) | Gmail, Calendar implemented in Worker — best control, latency, security |
| **MCP client in Worker** | Worker calls remote MCP servers (Todoist, Calendar MCP) per user session |
| **Zapier MCP** | [9000+ apps](https://zapier.com/mcp) via one connection — great breadth, less depth, Zapier account required |

**Recommendation:** Native first for Google stack; add MCP client for long-tail (user brings own MCP URL in settings — advanced).

---

### 9.2 Zapier / Make / n8n webhooks — **P2, Effort S**

**Why:** User-defined automations without Commity building every integration.

**Flow:** Commity emits events (`email_drafted`, `briefing_ready`, `task_completed`) → user webhook → Zapier → arbitrary apps

**Also inbound:** `POST /api/hooks/{user-secret}` triggers assistant action from external systems.

---

### 9.3 Apple Shortcuts / Android intents — **P3, Effort S (client-side)**

**Why:** OS-level “Hey Commity, add to grocery list” without full messaging API.

**Flow:** Shortcut HTTP POST to authenticated Commity endpoint with task text.

[iOS 27 may add AI-generated Shortcuts](https://apple.gadgethacks.com/news/ios-27-ai-shortcuts-explained-siri-may-build-workflows-for-you/) — watch for API opportunities.

---

## 10. Context & lifestyle integrations

### 10.1 Weather — **P2, Effort S**

**API:** OpenWeatherMap, Open-Meteo (free, no key)  
**Use:** Include in daily brief (“umbrella today”, “cold morning commute”)

---

### 10.2 Location / commute — **P3, Effort M**

**API:** Google Maps Directions, Apple MapKit JS  
**Use:** “Leave now for dentist” — needs client geolocation consent

---

### 10.3 Personal finance — **P3, Effort L**

**API:** [Plaid](https://plaid.com/docs/api/) — Transactions, balances  
**Use:** “How much did I spend on dining this month?”

**Blockers:** Plaid approval process, cost per connection, sensitive data handling, regulatory expectations. Read-only aggregation is feasible but heavy for a solo personal tool.

**Lighter alternative:** User uploads CSV/OFX periodically; assistant analyzes locally in chat.

---

### 10.4 Health & fitness — **P3, Effort L**

**APIs:** Apple Health (no web API), Google Fit, Oura, Whoop  
**Use:** “Did I walk enough today?” — mostly mobile SDK territory

**Pragmatic path:** Manual check-in in chat or Apple Shortcuts export.

---

### 10.5 Smart home — **P3, Effort M**

**APIs:** Home Assistant REST, Philips Hue, Google Home  
**Audience:** Niche for Commity’s personal assistant positioning

---

### 10.6 Travel — **P3, Effort M**

**APIs:** Google Flights (limited), Amadeus, airline email parsing via Gmail  
**Use:** “When is my flight?” — often solvable via Gmail + Calendar already

---

## 11. Developer / power-user integrations

| Integration | Priority | Use case |
| ----------- | -------- | -------- |
| GitHub (issues, PRs, notifications) | P2 | “What PRs need my review?” in morning brief |
| RSS / newsletters | P2 | Summarize feeds (Worker fetches URLs) |
| Browser extension | P2 | Clip page to Commity context |
| Cloud backup (R2) | P1 | Implement `syncToCloud` stub in `chatBackup.ts` |
| Import backup UI | P1 | Already on PLAN.md |

---

## 12. Recommended roadmap

### Phase A — “Complete the Google daily loop” (4–8 weeks)

1. **Google Calendar** — read agenda + free/busy; create event with confirm card  
2. **Google Tasks** — add/list/complete  
3. **User preferences** — timezone, briefing time  
4. **Daily briefing v1** — Cron + in-app brief (requires Calendar)  
5. **Web Push reminders** — timed nudges from chat  

**Outcome:** User can ask “what’s my day?” and get proactive morning summary without new accounts.

---

### Phase B — “Proactive & persistent” (4–8 weeks)

1. **Contacts** — resolve names in email/calendar flows  
2. **Internal D1 task list** — tasks without Google Tasks  
3. **Chat summarization** — extend context beyond 20 messages  
4. **Email briefing** — CC/reply channel OR morning email digest  
5. **Cloud backup** — R2 encrypted thread backup  

**Outcome:** Assistant feels like it remembers you and reaches out daily.

---

### Phase C — “Meet users where they are” (8+ weeks)

1. **Microsoft 365** — Outlook + Calendar for non-Google users  
2. **Todoist** — official SDK/MCP  
3. **Telegram bot** — mobile-friendly access  
4. **Drive (`drive.file`)** — doc summarization with picker  
5. **Webhook / Zapier** — user-defined automations  

---

### Phase D — Long tail

Notion, Slack digest, GitHub brief, weather, finance (Plaid), smart home — driven by user demand.

---

## 13. Cross-cutting implementation patterns

Reuse these for every new integration (established by Gmail):

```
┌─────────────┐     OAuth connect      ┌──────────────┐
│  Commity UI │ ─────────────────────► │ Google / etc │
└──────┬──────┘                        └──────────────┘
       │ encrypted refresh token
       ▼
┌──────────────┐   tool loop    ┌─────────┐
│ D1 tokens    │ ◄────────────► │ OpenAI  │
└──────────────┘                └─────────┘
       ▲
       │ read/write APIs
┌──────┴───────┐
│ Worker tools │  ← confirm card for destructive/outbound
└──────────────┘
```

| Pattern | Gmail precedent | Apply to |
| ------- | ----------------- | -------- |
| Encrypted refresh tokens in D1 | `0002_gmail.sql` | All OAuth providers |
| Incremental scope connect | `accountNeedsReconnect()` | Calendar, Tasks, Drive |
| Tool loop in `openai.ts` | inbox tools | New tool modules |
| Confirm before outbound | `EmailDraftCard` | Calendar create, Slack post, Todoist create |
| `needsReconnect` in API response | Gmail status | All integrations |
| Local dev redirect URI | `APP_PUBLIC_ORIGIN` | Same for Microsoft, Todoist |

---

## 14. Privacy, security & trust

| Topic | Guidance |
| ----- | -------- |
| **Scope minimization** | Request readonly scopes first; upgrade when user uses write feature |
| **Google verification** | `drive.readonly`, `gmail.readonly` broad scopes trigger restricted review — prefer `drive.file` |
| **Data to OpenAI** | Calendar subjects, email snippets, contact names — document in UI like inbox doc |
| **Confirm before act** | Send email, create event, delete, post to Slack — always user click or explicit reply |
| **Token storage** | Keep `TOKEN_ENCRYPTION_KEY`; never log tokens |
| **Cron briefings** | User opt-in per channel; easy disable |
| **Screen/audio capture** | Avoid — regulatory and trust burden; API-first memory instead |
| **Prompt injection** | Warn model about untrusted email/web content ([Google Calendar MCP security](https://developers.google.com/workspace/calendar/api/guides/configure-mcp-server)) |

---

## 15. Competitive feature matrix

| Feature | Gemini / CC | Todoist+Claude | irel / Ezail | Commity today | Commity + Phase A |
| ------- | ----------- | -------------- | ------------ | ------------- | ----------------- |
| Gmail inbox | Yes | Partial | Yes | **Yes** | Yes |
| Email send w/ confirm | Yes | — | Yes | **Yes** | Yes |
| Calendar | Yes | Via Google | Yes | No | **Yes** |
| Tasks | Yes | **Todoist** | Yes | No | **Google Tasks** |
| Daily brief | **Yes** | — | Partial | No | **Yes** |
| Push reminders | App | — | WhatsApp | No | **Web Push** |
| WhatsApp | — | — | **Yes** | No | Phase C |
| Memory / summary | **Yes** | — | — | 20 msgs | Summarize |
| Self-hosted / own domain | No | No | No | **Yes** | Yes |
| Open codebase | No | Partial | No | **Yes** | Yes |

**Commity differentiator:** Self-hosted Worker, user-controlled data boundaries, confirm-before-send trust model, and no subscription to a mega-corp assistant bundle.

---

## 16. Quick reference — APIs & docs

| Integration | Documentation |
| ----------- | ------------- |
| Google Calendar | https://developers.google.com/workspace/calendar/api |
| Google Calendar MCP (Google-hosted) | https://developers.google.com/workspace/calendar/api/guides/configure-mcp-server |
| Google Tasks | https://developers.google.com/tasks |
| Google People / Contacts | https://developers.google.com/people |
| Google Drive scopes | https://developers.google.com/workspace/drive/api/guides/api-specific-auth |
| Microsoft Graph | https://learn.microsoft.com/en-us/graph/ |
| Todoist AI SDK | https://github.com/Doist/todoist-ai |
| Cloudflare Cron Triggers | https://developers.cloudflare.com/workers/configuration/cron-triggers/ |
| Web Push (MDN) | https://developer.mozilla.org/en-US/docs/Web/API/Push_API |
| Cloudflare Push guide | https://developers.cloudflare.com/agents/guides/push-notifications/ |
| Zapier MCP | https://zapier.com/mcp |
| Plaid | https://plaid.com/docs/api/ |
| OpenAI function calling | Already used in `worker/src/openai.ts` |

---

## 17. Summary

**Highest-impact next integrations for Commity:**

1. **Google Calendar** — completes the “email + schedule” daily loop  
2. **Google Tasks** — lightweight task capture from chat  
3. **Daily briefing + Cron** — proactive assistant vs. passive chat  
4. **Web Push reminders** — timed daily tasks with tab closed  
5. **User preferences + memory** — timezone, briefing time, rolling summary  

Gmail was the right first integration. Calendar + proactive delivery transforms Commity from “chat that can email” into a **daily personal assistant** without sacrificing the privacy and confirm-before-act model already in place.

Microsoft 365, Todoist, Telegram, and MCP/Zapier extend reach in later phases. Avoid screen recording and heavy finance APIs until core daily I/O is solid.

---

*Next step:* Pick Phase A items to add to `PLAN.md` and create `docs/08-*` guides as features ship.
