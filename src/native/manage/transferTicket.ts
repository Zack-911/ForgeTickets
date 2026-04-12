import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { ForgeTickets } from "../.."
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$transferTicket",
    version: "1.0.0",
    description: "Transfers a ticket to a different support team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to transfer to",
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
    output: ArgType.Boolean,
    async execute(ctx, [teamID, ticketID]) {
        const ext = ctx.client.getExtension(ForgeTickets, true)
        const id = ticketID ?? (await TicketsDatabase.getTicketByChannel(ctx.channel!.id))?.id
        if (!id) return this.customError("No ticket found for this channel")
        const result = await ext.ticketsManager.transferTicket(id, teamID)
        return this.success(!!result)
    },
})
