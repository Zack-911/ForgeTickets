import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$ticketSLAStatus",
    version: "1.0.0",
    description: "Returns the SLA status of a ticket as JSON.",
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
    output: ArgType.Json,
    async execute(ctx, [id]) {
        const ticket = id
            ? await TicketsDatabase.getTicket(id)
            : await TicketsDatabase.getTicketByChannel(ctx.channel!.id)
        return this.successJSON(ticket?.slaStatus ?? null)
    },
})
