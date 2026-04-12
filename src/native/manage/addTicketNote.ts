import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { ForgeTickets } from "../.."
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$addTicketNote",
    version: "1.0.0",
    description: "Adds an internal staff note to a ticket.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "note",
            description: "Note content",
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
    async execute(ctx, [note, ticketID]) {
        const ext = ctx.client.getExtension(ForgeTickets, true)
        const id = ticketID ?? (await TicketsDatabase.getTicketByChannel(ctx.channel!.id))?.id
        if (!id) return this.customError("No ticket found for this channel")
        const result = await ext.ticketsManager.addNote(id, ctx.user!.id, note)
        return this.success(!!result)
    },
})
