import { ForgeClient } from "@tryforge/forgescript"
import { ForgeDB } from "@tryforge/forge.db"
import { ForgeTickets } from ".."

// ─── Extensions ───────────────────────────────────────────────────────────────

const db = new ForgeDB({ type: "sqlite" })

const tickets = new ForgeTickets({
    events: ["ticketOpen", "ticketClose", "ticketClaim", "ticketUnclaim", "ticketSLABreach", "databaseConnect"],

    // ── Global renderers ──────────────────────────────────────────────────────
    // These apply to every guild that has not set its own renderer via
    // $setTicketRenderer. Guild-specific renderers always take precedence.

    globalRenderers: {
        // ── Open ─────────────────────────────────────────────────────────────
        open: `
            $title[🎫 Ticket #$env[ticketNumberPadded]]
            $description[Hey $env[openerMention], welcome to your ticket!
Support staff will be with you shortly. Please describe your issue in detail.

**Category:** $env[categoryName]
**Team:** $if[$env[teamName];$env[teamName];Unassigned]
**Subject:** $if[$env[subject];$env[subject];None provided]
**Priority:** $env[priority]]
            $color[#5865f2]
            $timestamp
            $footer[$guildName Tickets]
            $addButton[$env[closeButtonId];Close Ticket;Danger;🔒]
            $addButton[$env[claimButtonId];Claim;Primary;🎯]
            $addButton[$env[lockButtonId];Lock;Secondary;🔐]
        `,

        // ── Close ────────────────────────────────────────────────────────────
        close: `
            $title[🔒 Ticket Closed]
            $description[This ticket has been closed by $env[closedByMention].

**Ticket:** #$env[ticketNumberPadded]
**Opened by:** $env[openerMention]
**Close reason:** $env[closeReason]
**SLA breached:** $env[slaBreached]]
            $color[#ed4245]
            $timestamp
            $footer[$guildName Tickets]
            $addButton[$env[reopenButtonId];Reopen;Success;🔄]
            $addButton[$env[deleteButtonId];Delete;Danger;🗑️]
        `,

        // ── Claim ────────────────────────────────────────────────────────────
        claim: `
            $title[🎯 Ticket Claimed]
            $description[This ticket has been claimed by $env[claimedByMention].

They will be assisting you shortly. Please describe your issue if you haven't already.

**Ticket:** #$env[ticketNumberPadded]
**Team:** $if[$env[teamName];$env[teamName];None]]
            $color[#5865f2]
            $timestamp
            $footer[$guildName Tickets]
        `,

        // ── Unclaim ──────────────────────────────────────────────────────────
        unclaim: `
            $title[↩️ Ticket Unclaimed]
            $description[$env[unclaimedByMention] has unclaimed this ticket.

Another staff member will assist you soon.

**Ticket:** #$env[ticketNumberPadded]]
            $color[#fee75c]
            $timestamp
            $footer[$guildName Tickets]
        `,

        // ── Lock ─────────────────────────────────────────────────────────────
        lock: `
            $title[🔐 Ticket Locked]
            $description[This ticket has been locked by $env[lockedByMention].

$env[openerMention] can no longer send messages. Staff may still respond.

**Ticket:** #$env[ticketNumberPadded]]
            $color[#ed4245]
            $timestamp
            $footer[$guildName Tickets]
        `,

        // ── Unlock ───────────────────────────────────────────────────────────
        unlock: `
            $title[🔓 Ticket Unlocked]
            $description[This ticket has been unlocked by $env[unlockedByMention].

$env[openerMention] can now send messages again.

**Ticket:** #$env[ticketNumberPadded]]
            $color[#57f287]
            $timestamp
            $footer[$guildName Tickets]
        `,

        // ── Reopen ───────────────────────────────────────────────────────────
        reopen: `
            $title[🔄 Ticket Reopened]
            $description[This ticket has been reopened by $env[reopenedByMention].

**Ticket:** #$env[ticketNumberPadded]
**Opened by:** $env[openerMention]
**Category:** $env[categoryName]]
            $color[#57f287]
            $timestamp
            $footer[$guildName Tickets]
        `,

        // ── Transfer ─────────────────────────────────────────────────────────
        transfer: `
            $title[↗️ Ticket Transferred]
            $description[This ticket has been transferred to a new team.

**Ticket:** #$env[ticketNumberPadded]
**Previous team:** $if[$env[oldTeamID];<@&$env[oldTeamID]>;None]
**New team:** **$env[newTeamName]**

The new team will be with you shortly.]
            $color[#5865f2]
            $timestamp
            $footer[$guildName Tickets]
        `,

        // ── Log ──────────────────────────────────────────────────────────────
        log: `
            $description[$env[logMessage]]
            $color[#5865f2]
            $timestamp
            $footer[ForgeTickets Log]
        `,
    },
})

// ─── Client ───────────────────────────────────────────────────────────────────

const client = new ForgeClient({
    token: process.env.BOT_TOKEN,
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers"],
    prefixes: ["!"],
    events: ["messageCreate"],
    extensions: [db, tickets],
})

// ─── Admin setup ──────────────────────────────────────────────────────────────

client.commands.add({
    name: "setup",
    type: "messageCreate",
    code: `
    $onlyForUsers[;$botOwnerID]
    $let[catID;$createCategory[General Support;For general questions and issues;🎫]]
    $!addCategoryForm[$get[catID];subject;What is your issue about?;short;true;Describe in a few words]
    $!addCategoryForm[$get[catID];description;Describe your issue in detail;paragraph;true]
    $!setCategorySLA[$get[catID];300000;86400000]
    $let[teamID;$createTeam[Support Team;Our main support staff]]
    $!setCategoryOption[$get[catID];teamID;$get[teamID]]
    $!setTicketLogChannel[$mentionedChannels[0]]
    ✅ Setup complete! Category: $get[catID] | Team: $get[teamID]
`,
})

client.commands.add({
    name: "panel",
    type: "messageCreate",
    code: `
    $onlyForUsers[;$botOwnerID]
    $!createPanel[$mentionedChannels[0]]
    ✅ Panel deployed!
`,
})

// ─── Renderer management ──────────────────────────────────────────────────────

client.commands.add({
    name: "setrenderer",
    type: "messageCreate",
    code: `
    $onlyForUsers[;$botOwnerID]
    $onlyIf[$argCount>=2;❌ Usage: !setrenderer <event> <code>]
    $!setTicketRenderer[$message[0];$message[1;]]
    ✅ Renderer for **$message[0]** set for this guild.
    `,
})

client.commands.add({
    name: "removerenderer",
    type: "messageCreate",
    code: `
    $onlyForUsers[;$botOwnerID]
    $onlyIf[$argCount>=1;❌ Usage: !removerenderer <event>]
    $!removeTicketRenderer[$message[0]]
    ✅ Renderer for **$message[0]** removed. Falling back to global or default.
    `,
})

client.commands.add({
    name: "getrenderer",
    type: "messageCreate",
    code: `
    $onlyForUsers[;$botOwnerID]
    $onlyIf[$argCount>=1;❌ Usage: !getrenderer <event>]
    $let[code;$getTicketRenderer[$message[0]]]
    $if[$get[code];Guild renderer for **$message[0]**:
\`\`\`
$get[code]
\`\`\`;No guild renderer set for **$message[0]**. Using global or default.]
    `,
})

// ─── Ticket management ────────────────────────────────────────────────────────

client.commands.add({
    name: "close",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $!closeTicket[;$message]
    `,
})

client.commands.add({
    name: "claim",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $claimTicket
    `,
})

client.commands.add({
    name: "unclaim",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $unclaimTicket
    `,
})

client.commands.add({
    name: "lock",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $lockTicket
    `,
})

client.commands.add({
    name: "unlock",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $unlockTicket
    `,
})

client.commands.add({
    name: "delete",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $deleteTicket
    `,
})

client.commands.add({
    name: "priority",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $!setTicketPriority[$message]
        ✅ Priority set to **$ticketPriority**
    `,
})

client.commands.add({
    name: "transfer",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $!transferTicket[$message]
        ✅ Transferred!
    `,
})

client.commands.add({
    name: "add",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $!addTicketParticipant[$mentioned[0]]
        ✅ Added <@$mentioned[0]>
    `,
})

client.commands.add({
    name: "remove",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $!removeTicketParticipant[$mentioned[0]]
        ✅ Removed <@$mentioned[0]>
    `,
})

client.commands.add({
    name: "tag",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $!addTicketTag[$message]
        ✅ Tag added.
    `,
})

client.commands.add({
    name: "note",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $!addTicketNote[$message]
        ✅ Note added.
    `,
})

client.commands.add({
    name: "transcript",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $writeFile[./Ticket-$ticketNumber.html;$generateTranscript]
        ✅ Transcript saved to \`./Ticket-$ticketNumber.html\`!
    `,
})

client.commands.add({
    name: "blacklist",
    type: "messageCreate",
    code: `
        $!blacklistUser[$mentioned[0];$message[1;]]
        ✅ Blacklisted <@$mentioned[0]>
    `,
})

client.commands.add({
    name: "unblacklist",
    type: "messageCreate",
    code: `
        $!unblacklist[$mentioned[0]]
        ✅ Unblacklisted.
    `,
})

client.commands.add({
    name: "ticketinfo",
    type: "messageCreate",
    code: `
        $onlyIf[$isTicket;❌ Not a ticket.]
        $title[Ticket #$ticketNumber]
        $description[**State:** $ticketState\n**Priority:** $ticketPriority\n**Opener:** <@$ticketOpenerID>\n**Claimed by:** $if[$ticketClaimedBy;<@$ticketClaimedBy>;Unclaimed]\n**Tags:** $ticketTags\n**Created:** <t:$math[$ticketCreatedAt/1000]:F>]
        $color[#5865F2]
    `,
})

client.commands.add({
    name: "ticketstats",
    type: "messageCreate",
    code: `
        $jsonLoad[s;$ticketCount]
        $title[Ticket Stats — $guildName]
        $description[**Total:** $env[s;total]\n**Open:** $env[s;open]\n**Claimed:** $env[s;claimed]\n**Closed:** $env[s;closed]]
        $color[#5865F2]
    `,
})

client.commands.add({
    type: "messageCreate",
    name: "eval",
    code: `
        $onlyForUsers[;$botOwnerID]
        $eval[$message]
    `,
})

// ─── Ticket events ────────────────────────────────────────────────────────────

tickets.commands.add({
    type: "ticketOpen",
    code: `$log[🎫 Ticket #$ticketEventData[number] opened by <@$ticketEventData[openerID]>]`,
})

tickets.commands.add({
    type: "ticketClose",
    code: `$log[🔒 Ticket #$ticketEventData[number] closed]`,
})

tickets.commands.add({
    type: "ticketSLABreach",
    code: `$log[⚠️ SLA breach on ticket #$ticketEventData[number]]`,
})

// ─── Login ────────────────────────────────────────────────────────────────────

client.login()
