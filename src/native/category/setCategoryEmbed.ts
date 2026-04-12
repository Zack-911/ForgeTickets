import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { ICategoryEmbed } from "../../structures/entities"

export default new NativeFunction({
    name: "$setCategoryEmbed",
    version: "1.0.0",
    description: "Sets the open or close embed config for a category.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to configure",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "type",
            description: "open or close",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "embedJSON",
            description:
                "Embed config as JSON {title,description,color,thumbnailURL,imageURL,footerText,footerIconURL}",
            type: ArgType.Json,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id, type, embedJSON]) {
        const cat = await TicketsDatabase.getCategory(id)
        if (!cat) return this.customError(`Category ${id} not found`)
        const embed = embedJSON as unknown as ICategoryEmbed
        if (type === "open") cat.openEmbed = embed
        else if (type === "close") cat.closeEmbed = embed
        else return this.customError("type must be 'open' or 'close'")
        await TicketsDatabase.saveCategory(cat)
        return this.success(true)
    },
})
