import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$ticketParticipants",
    version: "1.0.0",
    description: "Returns the participant IDs of a ticket as a separated list.",
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
            name: "separator",
            description: "Separator between IDs",
            type: ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.String,
    async execute(ctx, [id, sep]) {
        const ticket = id
            ? await TicketsDatabase.getTicket(id)
            : await TicketsDatabase.getTicketByChannel(ctx.channel!.id)
        return this.success(ticket?.participants.join(sep ?? ", "))
    },
})
