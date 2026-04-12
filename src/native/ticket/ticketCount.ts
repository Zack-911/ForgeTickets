import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$ticketCount",
    version: "1.0.0",
    description: "Returns ticket statistics for the current guild as JSON (total/open/claimed/closed/pending).",
    unwrap: false,
    output: ArgType.Json,
    async execute(ctx) {
        const stats = await TicketsDatabase.getTicketStats(ctx.guild!.id)
        return this.successJSON(stats)
    },
})
