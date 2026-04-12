import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { ForgeTickets } from "../.."
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$deleteTicket",
    version: "1.0.0",
    description: "Permanently deletes a ticket channel.",
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
    ],
    output: ArgType.Boolean,
    async execute(ctx, [ticketID]) {
        const ext = ctx.client.getExtension(ForgeTickets, true)
        const id = ticketID ?? (await TicketsDatabase.getTicketByChannel(ctx.channel!.id))?.id
        if (!id) return this.customError("No ticket found for this channel")
        const result = await ext.ticketsManager.deleteTicket(id)
        return this.success(result)
    },
})
