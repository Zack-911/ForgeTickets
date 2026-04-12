"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$ticketCount",
    version: "1.0.0",
    description: "Returns ticket statistics for the current guild as JSON (total/open/claimed/closed/pending).",
    unwrap: false,
    output: forgescript_1.ArgType.Json,
    async execute(ctx) {
        const stats = await database_1.TicketsDatabase.getTicketStats(ctx.guild.id);
        return this.successJSON(stats);
    },
});
//# sourceMappingURL=ticketCount.js.map