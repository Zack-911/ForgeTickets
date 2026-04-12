import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { ForgeTickets } from "../.."
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$removeTicketParticipant",
    version: "1.0.0",
    description: "Removes a user from a ticket's participant list.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "userID",
            description: "User to remove",
            type: ArgType.User,
            required: true,
            rest: false,
        },
        {
            name: "ticketID",
            description: "Ticket ID (defaults to current channel)",
            type: ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [user, ticketID]) {
        const ext = ctx.client.getExtension(ForgeTickets, true)
        const id = ticketID ?? (await TicketsDatabase.getTicketByChannel(ctx.channel!.id))?.id
        if (!id) return this.customError("No ticket found for this channel")
        const result = await ext.ticketsManager.removeParticipant(id, user.id)
        return this.success(!!result)
    },
})
