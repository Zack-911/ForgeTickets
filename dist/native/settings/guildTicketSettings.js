"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$guildTicketSettings",
    version: "1.0.0",
    description: "Returns the current guild's ticket settings as JSON.",
    unwrap: false,
    output: forgescript_1.ArgType.Json,
    async execute(ctx) {
        const s = await database_1.TicketsDatabase.getSettings(ctx.guild.id);
        return this.successJSON(s);
    },
});
//# sourceMappingURL=guildTicketSettings.js.map