"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$isTicket",
    version: "1.0.0",
    description: "Returns whether the current channel is an active ticket channel.",
    unwrap: false,
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx) {
        const ticket = await database_1.TicketsDatabase.getTicketByChannel(ctx.channel.id);
        return this.success(!!(ticket && !ticket.deleted));
    },
});
//# sourceMappingURL=isTicket.js.map