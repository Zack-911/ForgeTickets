# ForgeTickets - Custom Embeds Guide

ForgeTickets lets you replace every single message the system sends with your own ForgeScript code. This guide walks through everything from simple embed changes to fully custom panels.

---

## Overview

There are two distinct embed systems in ForgeTickets:

| System | What it controls | How to customise |
|---|---|---|
| **Renderers** | The messages sent when ticket actions happen (open, close, claim, etc.) | `$setTicketRenderer` / `globalRenderers` option |
| **Panels** | The message users click to open a ticket | `$ticketPanelButtonId` + any embed you like |

---

## Part 1 - Action renderers

### The three layers

Every action message goes through this fallback chain:

```
Guild renderer  →  Global renderer  →  Default embed
    (DB)             (startup)            (built-in)
```

A guild renderer set with `$setTicketRenderer` always wins. If none is set, the global renderer from your `new ForgeTickets({ globalRenderers: { ... } })` option is used. If neither exists, the built-in embed fires.

---

### Setting a global renderer (applies to all guilds)

Define these in your bot's entry file, inside the `ForgeTickets` constructor:

```ts
new ForgeTickets({
    globalRenderers: {
        open:  `your ForgeScript code here`,
        close: `your ForgeScript code here`,
        // ... etc
    }
})
```

### Setting a guild renderer at runtime

```
$setTicketRenderer[event;code;guildId?]
```

```
$setTicketRenderer[open;
    $title[🎫 Ticket #$env[ticketNumberPadded]]
    $description[Hey $env[openerMention], welcome!]
    $color[#5865f2]
]
```

### Removing a guild renderer

```
$removeTicketRenderer[open]
```

Falls back to the global renderer, or the default if no global is set.

### Checking what renderer is active

```
$getTicketRenderer[open]
```

Returns the guild renderer code, or empty string if using global/default.

---

### All events

| Event | When it fires | Channel |
|---|---|---|
| `open` | Ticket is opened | Ticket channel |
| `close` | Ticket is closed | Ticket channel |
| `claim` | Ticket is claimed | Ticket channel |
| `unclaim` | Ticket is unclaimed | Ticket channel |
| `lock` | Ticket is locked | Ticket channel |
| `unlock` | Ticket is unlocked | Ticket channel |
| `reopen` | Closed ticket is reopened | Ticket channel |
| `transfer` | Ticket transferred to another team | Ticket channel |
| `log` | Any loggable action | Log channel |

---

### Available `$env` variables

Every renderer receives the following variables. Access them with `$env[key]`.

#### Present in all events

| Variable | Example value | Description |
|---|---|---|
| `ticketId` | `abc-123-def` | Internal UUID |
| `ticketNumber` | `42` | Sequential number |
| `ticketNumberPadded` | `0042` | Zero-padded to 4 digits |
| `openerID` | `123456789` | User ID of the ticket opener |
| `openerMention` | `<@123456789>` | Ready-to-use mention |
| `channelID` | `987654321` | Ticket channel ID |
| `guildID` | `111222333` | Guild ID |
| `priority` | `medium` | `low` / `medium` / `high` / `urgent` |
| `state` | `open` | `open` / `claimed` / `locked` / `closed` |
| `categoryID` | `cat-abc` | Category UUID, or empty |
| `categoryName` | `General Support` | Category name, or empty |
| `teamID` | `team-xyz` | Assigned team ID, or empty |
| `teamName` | `Support Team` | Assigned team name, or empty |
| `createdAt` | `2025-01-01T00:00:00.000Z` | ISO 8601 timestamp |
| `subject` | `My issue` | Opener-provided subject, or empty |
| `tags` | `bug, urgent` | Comma-separated tags, or empty |
| `participants` | `111,222,333` | Comma-separated user IDs |
| `noteCount` | `3` | Number of internal notes |
| `ticketRendererEvent` | `close` | The event that triggered this renderer |

#### `open` extras

| Variable | Description |
|---|---|
| `closeButtonId` | Custom ID for a working Close button |
| `claimButtonId` | Custom ID for a working Claim button |
| `lockButtonId` | Custom ID for a working Lock button |
| `reopenButtonId` | Custom ID for a working Reopen button |
| `deleteButtonId` | Custom ID for a working Delete button |
| `form_<key>` | Each form answer. Field key `subject` → `$env[form_subject]` |

> **Important:** If you don't include `$addButton[$env[closeButtonId];...]` in your open renderer, the ticket will have no Close button. You are fully in control.

#### `close` extras

| Variable | Description |
|---|---|
| `closedByID` | Who closed it |
| `closedByMention` | `<@closedByID>` |
| `closeReason` | Reason given, or `None` |
| `closedAt` | ISO 8601 timestamp |
| `slaBreached` | `true` / `false` |
| `slaResponseBreached` | `true` / `false` |
| `slaResolutionBreached` | `true` / `false` |
| `reopenButtonId` | Custom ID for Reopen button |
| `deleteButtonId` | Custom ID for Delete button |

#### `claim` extras

| Variable | Description |
|---|---|
| `claimedByID` | Who claimed it |
| `claimedByMention` | `<@claimedByID>` |

#### `unclaim` extras

| Variable | Description |
|---|---|
| `unclaimedByID` | Who unclaimed it |
| `unclaimedByMention` | `<@unclaimedByID>` |

#### `lock` extras

| Variable | Description |
|---|---|
| `lockedByID` | Who locked it |
| `lockedByMention` | `<@lockedByID>` |

#### `unlock` extras

| Variable | Description |
|---|---|
| `unlockedByID` | Who unlocked it |
| `unlockedByMention` | `<@unlockedByID>` |

#### `reopen` extras

| Variable | Description |
|---|---|
| `reopenedByID` | Who reopened it |
| `reopenedByMention` | `<@reopenedByID>` |

#### `transfer` extras

| Variable | Description |
|---|---|
| `oldTeamID` | Previous team ID, or empty |
| `newTeamID` | New team ID |
| `newTeamName` | New team name |

#### `log` extras

The log renderer runs in the **log channel**, not the ticket channel. It receives all base variables plus whatever extras match the action that generated the log entry (e.g. a close log gets `closedByID`, `closeReason`, etc.).

| Variable | Description |
|---|---|
| `logMessage` | The default log text ForgeTickets would have sent |
| `ticketRendererEvent` | Which action triggered the log (`close`, `claim`, etc.) |

---

### Renderer examples

#### Minimal open - plain text only

```
$setTicketRenderer[open;
    $env[openerMention] your ticket **#$env[ticketNumberPadded]** has been created.
    Please describe your issue and staff will assist you shortly.
]
```

#### Full open embed with buttons

```
$setTicketRenderer[open;
    $title[🎫 Ticket #$env[ticketNumberPadded]]
    $description[Hey $env[openerMention], welcome to your ticket!
Please describe your issue in as much detail as possible.

**Category:** $env[categoryName]
**Priority:** $env[priority]
**Subject:** $if[$env[subject];$env[subject];Not provided]]
    $color[#5865f2]
    $timestamp
    $footer[$guildName Support · $env[ticketNumberPadded]]
    $addButton[$env[closeButtonId];Close Ticket;danger;🔒]
    $addButton[$env[claimButtonId];Claim;primary;🎯]
    $addButton[$env[lockButtonId];Lock;secondary;🔐]
]
```

#### Close embed with SLA info

```
$setTicketRenderer[close;
    $title[🔒 Ticket Closed]
    $description[Your ticket has been closed by $env[closedByMention].

**Reason:** $env[closeReason]
**SLA met:** $if[$checkCondition[$env[slaBreached]==true];❌ Breached;✅ Met]]
    $color[#ed4245]
    $timestamp
    $addButton[$env[reopenButtonId];Reopen;success;🔄]
    $addButton[$env[deleteButtonId];Delete;danger;🗑️]
]
```

#### Open with form answers

If your category has a form with fields `subject` and `description`:

```
$setTicketRenderer[open;
    $title[🎫 Ticket #$env[ticketNumberPadded]]
    $addField[Subject;$if[$env[form_subject];$env[form_subject];Not provided];false]
    $addField[Description;$if[$env[form_description];$env[form_description];Not provided];false]
    $addField[Opened by;$env[openerMention];true]
    $addField[Category;$env[categoryName];true]
    $color[#5865f2]
    $timestamp
    $addButton[$env[closeButtonId];Close;danger;🔒]
    $addButton[$env[claimButtonId];Claim;primary;🎯]
]
```

#### Log - minimal, keep the default text

```
$setTicketRenderer[log;
    $description[$env[logMessage]]
    $color[#5865f2]
    $timestamp
    $footer[ForgeTickets Log]
]
```

#### Log - per-action styling

```
$setTicketRenderer[log;
    $let[col;$if[$checkCondition[$env[ticketRendererEvent]==close];#ed4245;$if[$checkCondition[$env[ticketRendererEvent]==open];#57f287;#5865f2]]]
    $description[$env[logMessage]]
    $color[$get[col]]
    $timestamp
]
```

#### Suppress a message entirely

Set a renderer that outputs nothing:

```
$setTicketRenderer[claim;$c[intentionally empty - no message sent on claim]]
```

---

## Part 2 - Custom panels

The ticket panel is the message with buttons that users click to open a ticket. Instead of using `$createPanel`, you can build the panel embed yourself and use `$ticketPanelButtonId` to get the correct custom ID.

### `$ticketPanelButtonId[categoryId]`

Returns the button custom ID for opening a ticket in a specific category. Works identically to the buttons `$createPanel` generates.

### Basic custom panel

```
$let[catId;YOUR_CATEGORY_ID]

$title[📬 Open a Support Ticket]
$description[Need help from our team? Click the button below to open a ticket.
A member of staff will assist you as soon as possible.]
$color[#5865f2]
$thumbnail[https://your-server-icon-url.png]
$footer[$guildName Support System]

$addButton[$ticketPanelButtonId[$get[catId]];Open Ticket;primary;🎫]
```

### Multiple categories on one panel

```
$title[📬 Support - Choose a Category]
$description[Select the category that best matches your issue.]
$color[#5865f2]

$addButton[$ticketPanelButtonId[GENERAL_CAT_ID];General Support;primary;🛠️]
$addButton[$ticketPanelButtonId[BUG_CAT_ID];Bug Report;danger;🐛]
$addButton[$ticketPanelButtonId[BILLING_CAT_ID];Billing;success;💳]
$addButton[$ticketPanelButtonId[APPEAL_CAT_ID];Appeal;secondary;⚖️]
```

> Discord allows up to 5 buttons per row and up to 5 rows - so up to 25 category buttons on one panel.

### Panel with a field per category

```
$title[📬 Support Categories]
$addField[🛠️ General Support;For general questions and assistance.;false]
$addField[🐛 Bug Reports;Something not working? Let us know.;false]
$addField[💡 Suggestions;Share ideas for improving the server.;false]
$color[#5865f2]
$footer[Click a button below to get started]

$addButton[$ticketPanelButtonId[GENERAL_CAT_ID];General Support;primary;🛠️]
$addButton[$ticketPanelButtonId[BUG_CAT_ID];Bug Report;danger;🐛]
$addButton[$ticketPanelButtonId[SUGGEST_CAT_ID];Suggestion;success;💡]
```

### Deploy a custom panel via command

```ts
client.commands.add({
    name: 'custompanel',
    type: 'messageCreate',
    code: `
        $onlyForUsers[;$botOwnerID]
        $title[📬 Open a Ticket]
        $description[Click below to get support from our team.]
        $color[#5865f2]
        $footer[$guildName]
        $addButton[$ticketPanelButtonId[YOUR_CAT_ID];Open Ticket;primary;🎫]
    `
})
```

> Note: When using `$ticketPanelButtonId`, the panel message is **not** saved to the `TicketPanel` database table (only `$createPanel` does that). This has no effect on functionality - the button still works - but `$getPanels` won't list it.

---

## Common patterns

### Getting category IDs

Run this once to see all your category IDs:

```
$eval[$guildCategories]
```

Or during setup, `$createCategory` returns the new category's ID - save it with `$let`.

### Checking optional values

```
$if[$env[teamName];Assigned to: $env[teamName];Unassigned]
```

### Conditional field based on priority

```
$if[$checkCondition[$env[priority]==urgent];🔴 URGENT ticket - respond immediately!;]
```

### Discord timestamp from ISO date

```
<t:$floor[$divide[$timestampOf[$env[createdAt]];1000]]:F>
```

Or from `$ticketCreatedAt` (returns raw ms directly inside ticket channel commands):

```
<t:$floor[$divide[$ticketCreatedAt;1000]]:F>
<t:$floor[$divide[$ticketCreatedAt;1000]]:R>
```

---

## Quick reference

| Function | Description |
|---|---|
| `$setTicketRenderer[event;code;guildId?]` | Set a guild-level renderer |
| `$removeTicketRenderer[event;guildId?]` | Remove guild renderer, fall back to global/default |
| `$getTicketRenderer[event;guildId?]` | Get current guild renderer code |
| `$ticketPanelButtonId[categoryId]` | Get button custom ID for a category |
| `$ticketID` | Current ticket UUID |
| `$ticketNumber` | Current ticket number |
| `$ticketOpenerID` | Opener user ID |
| `$ticketState` | `open` / `claimed` / `locked` / `closed` |
| `$ticketPriority` | `low` / `medium` / `high` / `urgent` |
| `$ticketClaimedBy` | User ID of claimer, or empty |
| `$ticketCategoryID` | Category UUID |
| `$ticketTeamID` | Team UUID |
| `$ticketSubject` | Subject text |
| `$ticketTags` | Tags as JSON array |
| `$ticketParticipants` | Participants as JSON array |
| `$ticketCreatedAt` | Creation timestamp in ms |
| `$ticketClosedAt` | Close timestamp in ms, or empty |
| `$ticketCloseReason` | Close reason, or empty |
| `$ticketFormAnswer[key]` | A specific form field answer |
| `$ticketNotes` | All notes as JSON array |
| `$ticketSLAStatus` | SLA status as JSON `{responseBreached, resolutionBreached, firstResponseAt}` |