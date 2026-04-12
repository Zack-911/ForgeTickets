import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$guildCategories",
    version: "1.0.0",
    description: "Returns all ticket categories for the current guild as JSON.",
    unwrap: false,
    output: ArgType.Json,
    async execute(ctx) {
        const cats = await TicketsDatabase.getCategoriesByGuild(ctx.guild!.id)
        return this.successJSON(cats)
    },
})
