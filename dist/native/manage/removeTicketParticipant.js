"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const __1 = require("../..");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$removeTicketParticipant",
    version: "1.0.0",
    description: "Removes a user from a ticket's participant list.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "userID",
            description: "User to remove",
            type: forgescript_1.ArgType.User,
            required: true,
            rest: false,
        },
        {
            name: "ticketID",
            description: "Ticket ID (defaults to current channel)",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [user, ticketID]) {
        const ext = ctx.client.getExtension(__1.ForgeTickets, true);
        const id = ticketID ?? (await database_1.TicketsDatabase.getTicketByChannel(ctx.channel.id))?.id;
        if (!id)
            return this.customError("No ticket found for this channel");
        const result = await ext.ticketsManager.removeParticipant(id, user.id);
        return this.success(!!result);
    },
});
//# sourceMappingURL=removeTicketParticipant.js.map