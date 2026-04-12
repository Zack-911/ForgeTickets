"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const __1 = require("../..");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$transferTicket",
    version: "1.0.0",
    description: "Transfers a ticket to a different support team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to transfer to",
            type: forgescript_1.ArgType.String,
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
    async execute(ctx, [teamID, ticketID]) {
        const ext = ctx.client.getExtension(__1.ForgeTickets, true);
        const id = ticketID ?? (await database_1.TicketsDatabase.getTicketByChannel(ctx.channel.id))?.id;
        if (!id)
            return this.customError("No ticket found for this channel");
        const result = await ext.ticketsManager.transferTicket(id, teamID);
        return this.success(!!result);
    },
});
//# sourceMappingURL=transferTicket.js.map