import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { ForgeTickets } from "../.."
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$claimTicket",
    version: "1.0.0",
    description: "Claims a ticket for the executing user.",
    unwrap: true,
    brackets: false,
    args: [
        {
            name: "ticketID",
            description: "Ticket ID (defaults to current channel)",
            type: ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "userID",
            description: "Who claims it (defaults to command author)",
            type: ArgType.User,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [ticketID, user]) {
        const ext = ctx.client.getExtension(ForgeTickets, true)
        const id = ticketID ?? (await TicketsDatabase.getTicketByChannel(ctx.channel!.id))?.id
        if (!id) return this.customError("No ticket found for this channel")
        const result = await ext.ticketsManager.claimTicket(id, user?.id ?? ctx.user!.id)
        return this.success(!!result)
    },
})
