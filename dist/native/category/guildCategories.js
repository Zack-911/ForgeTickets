"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$guildCategories",
    version: "1.0.0",
    description: "Returns all ticket categories for the current guild as JSON.",
    unwrap: false,
    output: forgescript_1.ArgType.Json,
    async execute(ctx) {
        const cats = await database_1.TicketsDatabase.getCategoriesByGuild(ctx.guild.id);
        return this.successJSON(cats);
    },
});
//# sourceMappingURL=guildCategories.js.map