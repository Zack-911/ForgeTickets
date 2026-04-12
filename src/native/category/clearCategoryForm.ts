import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$clearCategoryForm",
    version: "1.0.0",
    description: "Removes all form fields from a category.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to clear",
            type: ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id]) {
        const cat = await TicketsDatabase.getCategory(id)
        if (!cat) return this.customError(`Category ${id} not found`)
        cat.form = []
        await TicketsDatabase.saveCategory(cat)
        return this.success(true)
    },
})
