import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { TicketCategory } from "../../structures/entities"

export default new NativeFunction({
    name: "$createCategory",
    version: "1.0.0",
    description: "Creates a ticket category. Returns the category ID.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "name",
            description: "Category name",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "description",
            description: "Category description",
            type: ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "emoji",
            description: "Category emoji",
            type: ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "parentChannelID",
            description: "Discord category channel ID for ticket channels",
            type: ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.String,
    async execute(ctx, [name, description, emoji, parentChannelID]) {
        const cat = new TicketCategory({
            guildID: ctx.guild!.id,
            name,
            description: description ?? undefined,
            emoji: emoji ?? undefined,
            parentChannelID: parentChannelID ?? undefined,
        })
        await TicketsDatabase.saveCategory(cat)
        return this.success(cat.id)
    },
})
