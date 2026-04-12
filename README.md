# forge.tickets

A powerful, fully-featured ticket system extension for ForgeScript.

> **Requires** `@tryforge/forge.db` as a peer dependency.  
> **ForgeDB must be listed before ForgeTickets in your extensions array.**

---

## Features

- **Categories** — unlimited categories with custom embeds, parent channels, name templates
- **Forms** — up to 5 custom modal fields per category shown before ticket creation  
- **Teams** — named staff teams with role/member lists, permissions, round-robin routing
- **Smart Routing** — auto-route tickets by subject keywords or form answer patterns
- **Blacklists** — block users/roles with optional expiry
- **Panels** — one-click button panels with one button per category
- **States** — `open → claimed → pending → closed → locked`
- **Claim / Unclaim** — exclusive ticket ownership with permission sync
- **Lock / Unlock** — prevent opener from sending messages
- **Priority** — `low / medium / high / urgent`
- **SLA Timers** — per-category first-response + resolution deadlines with breach alerts
- **Auto-close** — inactivity auto-close with configurable delay
- **Auto-delete** — delete closed channels after a configurable delay
- **Participants** — add/remove users with channel permission sync
- **Tags** — freeform string labels on any ticket
- **Internal Notes** — staff-only notes stored on the ticket record
- **Transcripts** — styled HTML (dark-theme, embeds, images) and plain text formats
- **Logging** — optional per-guild log channel
- **DM notifications** — configurable DM on open/close
- **14 typed events** — all usable as ForgeScript command types
- **All 4 databases** — SQLite, MySQL, PostgreSQL, MongoDB

---

## Quick Start

```ts
import { ForgeClient } from "@tryforge/forgescript"
import { ForgeDB } from "@tryforge/forge.db"
import { ForgeTickets } from "@tryforge/forge.tickets"

const db = new ForgeDB({ type: "sqlite" })

const tickets = new ForgeTickets({
    events: ["ticketOpen", "ticketClose", "ticketClaim", "ticketSLABreach"],
})

const client = new ForgeClient({
    token: process.env.DISCORD_TOKEN,
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers"],
    prefixes: ["!"],
    events: ["messageCreate"],
    extensions: [db, tickets],   // ForgeDB MUST come first
})
client.login()
```

---

## One-time Setup

```
!setup    →  creates a category, team, SLA, log channel
!panel #channel  →  deploys a panel with one button per category
```

See `src/__tests__/index.ts` for a complete working example with all commands.

---

## All $functions

### Ticket Management
| Function | Description |
|---|---|
| `$openTicket[userID;catID?;subject?;priority?]` | Open a ticket programmatically |
| `$closeTicket[ticketID?;reason?]` | Close a ticket |
| `$claimTicket[ticketID?;userID?]` | Claim a ticket |
| `$unclaimTicket[ticketID?]` | Unclaim a ticket |
| `$lockTicket[ticketID?]` | Lock (opener can't send) |
| `$unlockTicket[ticketID?]` | Unlock |
| `$deleteTicket[ticketID?]` | Delete channel permanently |
| `$reopenTicket[ticketID?]` | Reopen a closed ticket |
| `$transferTicket[teamID;ticketID?]` | Transfer to another team |
| `$addTicketParticipant[userID;ticketID?]` | Add a participant |
| `$removeTicketParticipant[userID;ticketID?]` | Remove a participant |
| `$addTicketTag[tag;ticketID?]` | Add a tag |
| `$removeTicketTag[tag;ticketID?]` | Remove a tag |
| `$addTicketNote[note;ticketID?]` | Add a staff note |
| `$setTicketPriority[priority;ticketID?]` | Set priority |
| `$generateTranscript[ticketID?;format?]` | Generate + send transcript |

### Ticket Properties (all default to current channel's ticket)
`$ticketID` `$ticketNumber` `$ticketState` `$ticketPriority` `$ticketOpenerID` `$ticketClaimedBy` `$ticketCategoryID` `$ticketTeamID` `$ticketSubject` `$ticketCreatedAt` `$ticketClosedAt` `$ticketClosedBy` `$ticketCloseReason` `$ticketParticipants[sep?]` `$ticketTags[sep?]` `$ticketNotes` `$ticketFormAnswer[key]` `$ticketSLAStatus` `$ticketCount` `$isTicket`

### Inside Event Handlers
| Function | Returns |
|---|---|
| `$ticketEventData[property;sep?]` | Property from the ticket that fired the event |
| `$ticketEventArg[index]` | Extra arg (`[1]`=closedByID for `ticketClose`, etc.) |

### Category Management
`$createCategory[name;desc?;emoji?;parentChannelID?]` → ID  
`$deleteCategory[id]`  
`$setCategoryOption[id;option;value]`  
`$setCategoryEmbed[id;open|close;embedJSON]`  
`$addCategoryForm[id;key;label;style?;required?;placeholder?]`  
`$clearCategoryForm[id]`  
`$setCategorySLA[id;responseMS?;resolutionMS?;alertChannelID?]`  
`$addCategoryRoutingRule[id;targetTeamID;keywords?]`  
`$categoryInfo[id]` `$guildCategories`

`$setCategoryOption` keys: `maxPerUser` `autoCloseAfter` `deleteAfter` `enabled` `channelNameTemplate` `transcriptFormat` `routingStrategy` `transcriptChannelID` `teamID` `parentChannelID`

Channel name templates: `{count}` `{id}` `{username}`

### Team Management
`$createTeam[name;desc?]` `$deleteTeam[id]` `$addTeamMember[id;user]` `$removeTeamMember[id;user]` `$addTeamRole[id;role]` `$removeTeamRole[id;role]` `$teamInfo[id]`

### Blacklist
`$blacklistUser[user;reason?;expiresMS?]` `$blacklistRole[role;reason?;expiresMS?]` `$unblacklist[targetID]` `$isBlacklisted[user]`

### Guild Settings
`$setTicketLogChannel[channel]` `$addGlobalStaffRole[role]` `$removeGlobalStaffRole[role]` `$setTicketDMOption[open|close;bool]` `$guildTicketSettings`

### Panel
`$createPanel[channel;embedJSON?]` → panel ID

---

## Events

| Event | `$ticketEventArg[1]` | `$ticketEventArg[2]` |
|---|---|---|
| `ticketOpen` | — | — |
| `ticketClose` | closedByID | — |
| `ticketClaim` | claimedByID | — |
| `ticketUnclaim` | unclaimedByID | — |
| `ticketDelete` | — | — |
| `ticketReopen` | — | — |
| `ticketLock` | lockedByID | — |
| `ticketUnlock` | unlockedByID | — |
| `ticketTransfer` | fromTeamID | toTeamID |
| `ticketSLABreach` | `"response"` or `"resolution"` | — |
| `ticketNoteAdd` | authorID | content |
| `ticketPriorityChange` | oldPriority | newPriority |
| `ticketTagAdd` | tag | — |
| `ticketTagRemove` | tag | — |
| `databaseConnect` | — | — |

---

## Building

```bash
npm install
npm run build    # compiles to dist/
npm run dev      # ts-node src/__tests__/index.ts
```
