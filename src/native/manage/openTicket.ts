import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { ForgeTickets } from "../.."
import { TicketPriority } from "../../structures/entities"

export default new NativeFunction({
    name: "$openTicket",
    version: "1.0.0",
    description: "Opens a ticket for a user. Returns the ticket channel ID.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "userID",
            description: "The user to open the ticket for",
            type: ArgType.User,
            required: true,
            rest: false,
        },
        {
            name: "categoryID",
            description: "The ticket category ID",
            type: ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "subject",
            description: "Subject or reason for the ticket",
            type: ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "priority",
            description: "Ticket priority (low/medium/high/urgent)",
            type: ArgType.Enum,
            enum: TicketPriority,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.String,
    async execute(ctx, [user, categoryID, subject, priority]) {
        const ext = ctx.client.getExtension(ForgeTickets, true)
        const guild = ctx.guild!
        const member = await guild.members.fetch(user.id).catch(() => null)
        if (!member) return this.customError("Member not found in this guild")

        const ticket = await ext.ticketsManager.openTicket({
            guildID: guild.id,
            openerID: user.id,
            categoryID: categoryID ?? undefined,
            member,
            subject: subject ?? undefined,
            priority: (priority as TicketPriority) ?? undefined,
        })

        return this.success(ticket?.channelID)
    },
})
