# ForgeTickets - Custom Renderers

Custom renderers let you completely replace the default embeds ForgeTickets sends for every ticket action. You can send any ForgeScript output - a custom embed, plain text, buttons, or nothing at all.

---

## How it works

When a ticket action fires (open, close, claim, etc.), ForgeTickets checks for a renderer in this order:

1. **Guild renderer** - set per-guild via `$setTicketRenderer`. Stored in the database.
2. **Global renderer** - set at startup via the `globalRenderers` option in `new ForgeTickets({ ... })`. Applies to all guilds without a guild-specific renderer.
3. **Default** - the built-in embed ForgeTickets ships with. Used if neither of the above is set.

Guild always beats global. Global always beats default.

---

## Setting renderers

### At startup (global - applies to all guilds)

```ts
new ForgeTickets({
    globalRenderers: {
        open:  `$title[🎫 Ticket #$env[ticketNumberPadded]]$color[#5865f2]`,
        close: `$title[🔒 Closed]$color[#ed4245]`,
    }
})
```

### Per-guild via $function

```
$setTicketRenderer[open;
    $title[🎫 Ticket #$env[ticketNumberPadded]]
    $description[Hey $env[openerMention]!]
    $color[#5865f2]
    $addButton[$env[closeButtonId];Close;danger;🔒]
]
```

### Removing a guild renderer (falls back to global or default)

```
$removeTicketRenderer[open]
```

### Viewing the current guild renderer

```
$getTicketRenderer[open]
```

---

## Functions

| Function | Description |
|---|---|
| `$setTicketRenderer[event;code;guildId?]` | Set a renderer for an event in this guild. |
| `$removeTicketRenderer[event;guildId?]` | Remove the guild renderer, falling back to global or default. |
| `$getTicketRenderer[event;guildId?]` | Returns the current guild renderer code, or empty string if none. |

---

## Valid event names

| Event | When it fires |
|---|---|
| `open` | A ticket is opened. |
| `close` | A ticket is closed. |
| `claim` | A ticket is claimed by a staff member. |
| `unclaim` | A ticket is unclaimed. |
| `lock` | A ticket is locked (opener loses send permissions). |
| `unlock` | A ticket is unlocked. |
| `reopen` | A closed ticket is reopened. |
| `transfer` | A ticket is transferred to a different team. |
| `log` | Anything is logged to the log channel. Replaces the log channel embed. |

---

## $env variables

Every renderer has access to ticket data via `$env[key]`.

### Available in ALL events

| Key | Type | Description |
|---|---|---|
| `ticketId` | String | Internal UUID of the ticket. |
| `ticketNumber` | Number | Sequential ticket number (e.g. `42`). |
| `ticketNumberPadded` | String | Zero-padded to 4 digits (e.g. `0042`). |
| `openerID` | Snowflake | Discord user ID of the person who opened the ticket. |
| `openerMention` | String | `<@openerID>` - ready to paste directly. |
| `channelID` | Snowflake | The ticket channel ID. |
| `guildID` | Snowflake | The guild ID. |
| `priority` | String | `low`, `medium`, `high`, or `urgent`. |
| `state` | String | `open`, `claimed`, `locked`, `closed`. |
| `categoryID` | Snowflake | The category this ticket belongs to, or empty. |
| `categoryName` | String | The category name, or empty. |
| `teamID` | Snowflake | The assigned team ID, or empty. |
| `teamName` | String | The assigned team name, or empty. |
| `createdAt` | ISO 8601 | When the ticket was created. |
| `subject` | String | The subject provided by the opener, or empty. |
| `tags` | String | Comma-separated list of tags, or empty. |
| `participants` | String | Comma-separated list of participant user IDs. |
| `noteCount` | Number | How many internal notes are on this ticket. |
| `ticketRendererEvent` | String | The name of the event that triggered this renderer. |

---

### `open` - additional variables

| Key | Type | Description |
|---|---|---|
| `closeButtonId` | String | Pre-built custom ID for a Close button. Pass to `$addButton`. |
| `claimButtonId` | String | Pre-built custom ID for a Claim button. |
| `lockButtonId` | String | Pre-built custom ID for a Lock button. |
| `reopenButtonId` | String | Pre-built custom ID for a Reopen button. |
| `deleteButtonId` | String | Pre-built custom ID for a Delete button. |
| `form_<key>` | String | Each form field answer. If your form has a field `subject`, it's at `$env[form_subject]`. |

**Example using buttons:**
```
$setTicketRenderer[open;
    $title[🎫 Ticket #$env[ticketNumberPadded]]
    $description[Hey $env[openerMention], welcome!]
    $color[#5865f2]
    $addButton[$env[closeButtonId];Close Ticket;danger;🔒]
    $addButton[$env[claimButtonId];Claim;primary;🎯]
    $addButton[$env[lockButtonId];Lock;secondary;🔐]
]
```

---

### `close` - additional variables

| Key | Type | Description |
|---|---|---|
| `closedByID` | Snowflake | Who closed the ticket. |
| `closedByMention` | String | `<@closedByID>`. |
| `closeReason` | String | The reason given, or `None`. |
| `closedAt` | ISO 8601 | When the ticket was closed. |
| `slaBreached` | Boolean string | `true` if either SLA timer was breached. |
| `slaResponseBreached` | Boolean string | `true` if the response SLA was breached. |
| `slaResolutionBreached` | Boolean string | `true` if the resolution SLA was breached. |
| `reopenButtonId` | String | Pre-built custom ID for a Reopen button. |
| `deleteButtonId` | String | Pre-built custom ID for a Delete button. |

---

### `claim` - additional variables

| Key | Type | Description |
|---|---|---|
| `claimedByID` | Snowflake | Who claimed the ticket. |
| `claimedByMention` | String | `<@claimedByID>`. |

---

### `unclaim` - additional variables

| Key | Type | Description |
|---|---|---|
| `unclaimedByID` | Snowflake | Who unclaimed the ticket. |
| `unclaimedByMention` | String | `<@unclaimedByID>`. |

---

### `lock` - additional variables

| Key | Type | Description |
|---|---|---|
| `lockedByID` | Snowflake | Who locked the ticket. |
| `lockedByMention` | String | `<@lockedByID>`. |

---

### `unlock` - additional variables

| Key | Type | Description |
|---|---|---|
| `unlockedByID` | Snowflake | Who unlocked the ticket. |
| `unlockedByMention` | String | `<@unlockedByID>`. |

---

### `reopen` - additional variables

| Key | Type | Description |
|---|---|---|
| `reopenedByID` | Snowflake | Who reopened the ticket. |
| `reopenedByMention` | String | `<@reopenedByID>`. |

---

### `transfer` - additional variables

| Key | Type | Description |
|---|---|---|
| `oldTeamID` | Snowflake | The team ID before the transfer, or empty. |
| `newTeamID` | Snowflake | The team ID after the transfer. |
| `newTeamName` | String | The new team name. |

---

### `log` - additional variables

The log renderer runs inside the **log channel** rather than the ticket channel. All base variables are available, plus whatever extras apply to the action that generated the log entry.

| Key | Type | Description |
|---|---|---|
| `logMessage` | String | The default log message ForgeTickets would have sent. Useful if you just want to customise the embed style but keep the text. |
| `ticketRendererEvent` | String | The underlying event that triggered the log (e.g. `close`, `claim`). |
| + all action-specific keys above | - | Depends on which action fired the log. |

**Minimal log renderer that keeps the default message text:**
```
$setTicketRenderer[log;
    $description[$env[logMessage]]
    $color[#5865f2]
    $timestamp
    $footer[ForgeTickets]
]
```

---

## Tips

**Sending nothing**
If you set a renderer that outputs nothing, the message simply won't be sent. This is intentional - you can suppress any built-in message.

**Using form answers in the open renderer**
If your category has a form with fields `subject` and `description`, access them as `$env[form_subject]` and `$env[form_description]`.

**Checking if a value is set**
```
$if[$env[teamName];Team: $env[teamName];No team assigned]
```

**Turning a timestamp into a Discord relative time**
```
<t:$math[$replace[$env[createdAt];T; ]|unix]:R>
```
Note: use `$ticketCreatedAt` inside ticket commands instead - it returns the raw ms timestamp directly.

**Different renderers per guild without touching the code**
Set a global renderer as your base in `globalRenderers`, then use `$setTicketRenderer` inside an admin command so individual server owners can customise their own guild without you having to redeploy.