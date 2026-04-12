import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { ForgeTickets } from "../.."
import { TicketsDatabase } from "../../structures/database"
import { TicketPriority } from "../../structures/entities"

export default new NativeFunction({
    name: "$setTicketPriority",
    version: "1.0.0",
    description: "Sets the priority of a ticket.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "priority",
            description: "New priority (low/medium/high/urgent)",
            type: ArgType.Enum,
            enum: TicketPriority,
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
    async execute(ctx, [priority, ticketID]) {
        const ext = ctx.client.getExtension(ForgeTickets, true)
        const id = ticketID ?? (await TicketsDatabase.getTicketByChannel(ctx.channel!.id))?.id
        if (!id) return this.customError("No ticket found for this channel")
        const result = await ext.ticketsManager.setPriority(id, priority as TicketPriority)
        return this.success(!!result)
    },
})
