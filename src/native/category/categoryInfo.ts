import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$categoryInfo",
    version: "1.0.0",
    description: "Returns a category's full configuration as JSON.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to inspect",
            type: ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Json,
    async execute(ctx, [id]) {
        const cat = await TicketsDatabase.getCategory(id)
        return this.successJSON(cat ?? null)
    },
})
