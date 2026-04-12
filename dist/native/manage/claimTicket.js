"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const __1 = require("../..");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$claimTicket",
    version: "1.0.0",
    description: "Claims a ticket for the executing user.",
    unwrap: true,
    brackets: false,
    args: [
        {
            name: "ticketID",
            description: "Ticket ID (defaults to current channel)",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "userID",
            description: "Who claims it (defaults to command author)",
            type: forgescript_1.ArgType.User,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [ticketID, user]) {
        const ext = ctx.client.getExtension(__1.ForgeTickets, true);
        const id = ticketID ?? (await database_1.TicketsDatabase.getTicketByChannel(ctx.channel.id))?.id;
        if (!id)
            return this.customError("No ticket found for this channel");
        const result = await ext.ticketsManager.claimTicket(id, user?.id ?? ctx.user.id);
        return this.success(!!result);
    },
});
//# sourceMappingURL=claimTicket.js.map