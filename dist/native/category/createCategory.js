"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
const entities_1 = require("../../structures/entities");
exports.default = new forgescript_1.NativeFunction({
    name: "$createCategory",
    version: "1.0.0",
    description: "Creates a ticket category. Returns the category ID.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "name",
            description: "Category name",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "description",
            description: "Category description",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "emoji",
            description: "Category emoji",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "parentChannelID",
            description: "Discord category channel ID for ticket channels",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.String,
    async execute(ctx, [name, description, emoji, parentChannelID]) {
        const cat = new entities_1.TicketCategory({
            guildID: ctx.guild.id,
            name,
            description: description ?? undefined,
            emoji: emoji ?? undefined,
            parentChannelID: parentChannelID ?? undefined,
        });
        await database_1.TicketsDatabase.saveCategory(cat);
        return this.success(cat.id);
    },
});
//# sourceMappingURL=createCategory.js.map