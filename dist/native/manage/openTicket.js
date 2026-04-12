"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const __1 = require("../..");
const entities_1 = require("../../structures/entities");
exports.default = new forgescript_1.NativeFunction({
    name: "$openTicket",
    version: "1.0.0",
    description: "Opens a ticket for a user. Returns the ticket channel ID.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "userID",
            description: "The user to open the ticket for",
            type: forgescript_1.ArgType.User,
            required: true,
            rest: false,
        },
        {
            name: "categoryID",
            description: "The ticket category ID",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "subject",
            description: "Subject or reason for the ticket",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "priority",
            description: "Ticket priority (low/medium/high/urgent)",
            type: forgescript_1.ArgType.Enum,
            enum: entities_1.TicketPriority,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.String,
    async execute(ctx, [user, categoryID, subject, priority]) {
        const ext = ctx.client.getExtension(__1.ForgeTickets, true);
        const guild = ctx.guild;
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member)
            return this.customError("Member not found in this guild");
        const ticket = await ext.ticketsManager.openTicket({
            guildID: guild.id,
            openerID: user.id,
            categoryID: categoryID ?? undefined,
            member,
            subject: subject ?? undefined,
            priority: priority ?? undefined,
        });
        return this.success(ticket?.channelID);
    },
});
//# sourceMappingURL=openTicket.js.map