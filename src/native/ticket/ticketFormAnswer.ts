import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$ticketFormAnswer",
    version: "1.0.0",
    description: "Returns the value of a specific form field from a ticket.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "key",
            description: "Form field key",
            type: ArgType.String,
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
    output: ArgType.String,
    async execute(ctx, [key, id]) {
        const ticket = id
            ? await TicketsDatabase.getTicket(id)
            : await TicketsDatabase.getTicketByChannel(ctx.channel!.id)
        return this.success(ticket?.formAnswers?.[key])
    },
})
