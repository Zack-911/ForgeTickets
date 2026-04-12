import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$guildTicketSettings",
    version: "1.0.0",
    description: "Returns the current guild's ticket settings as JSON.",
    unwrap: false,
    output: ArgType.Json,
    async execute(ctx) {
        const s = await TicketsDatabase.getSettings(ctx.guild!.id)
        return this.successJSON(s)
    },
})
