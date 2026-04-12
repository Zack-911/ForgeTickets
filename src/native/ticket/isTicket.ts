import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$isTicket",
    version: "1.0.0",
    description: "Returns whether the current channel is an active ticket channel.",
    unwrap: false,
    output: ArgType.Boolean,
    async execute(ctx) {
        const ticket = await TicketsDatabase.getTicketByChannel(ctx.channel!.id)
        return this.success(!!(ticket && !ticket.deleted))
    },
})
