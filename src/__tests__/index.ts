import { ForgeClient } from "@tryforge/forgescript"
import { ForgeDB } from "@tryforge/forge.db"
import { ForgeTickets } from ".."

const db = new ForgeDB({ type: "sqlite" })

const tickets = new ForgeTickets({
    events: ["ticketOpen", "ticketClose", "ticketClaim", "ticketUnclaim", "ticketSLABreach", "databaseConnect"],
})

const client = new ForgeClient({
    token: process.env.BOT_TOKEN,
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildMembers"],
    prefixes: ["!"],
    events: ["messageCreate"],
    extensions: [db, tickets],
})

// Setup (run once)
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

// Deploy panel
client.commands.add({
    name: "panel",
    type: "messageCreate",
    code: `
    $onlyForUsers[;$botOwnerID]
    $!createPanel[$mentionedChannels[0]]
    ✅ Panel deployed!
`,
})

// Ticket management
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
    `
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
    `
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
        ✅ Priority: **$ticketPriority**
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
    code: `$
        onlyIf[$isTicket;❌ Not a ticket.] 
        $!addTicketTag[$message] 
        ✅ Tag added.
    `,
})
client.commands.add({
    name: "note",
    type: "messageCreate",
    code: `$
        onlyIf[$isTicket;❌ Not a ticket.] 
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

// Events
tickets.commands.add({
    type: "ticketOpen",
    code: `$log[🎫 Ticket #$ticketEventData[number]\nData: $ticketEvent]`,
})
tickets.commands.add({
    type: "ticketClose",
    code: `$log[🔒 Ticket #$ticketEventData[number] closed\nData: $ticketEvent]`,
})
tickets.commands.add({
    type: "ticketSLABreach",
    code: `$log[⚠️ SLA breach on ticket #$ticketEventData[number]\nData: $ticketEvent]`,
})

client.login()