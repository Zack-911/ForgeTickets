import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$deleteCategory",
    version: "1.0.0",
    description: "Deletes a ticket category.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to delete",
            type: ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id]) {
        await TicketsDatabase.deleteCategory(id)
        return this.success(true)
    },
})
