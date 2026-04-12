"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$setTicketLogChannel",
    version: "1.0.0",
    description: "Sets the channel for ticket event logs.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "channelID",
            description: "Log channel",
            type: forgescript_1.ArgType.Channel,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [channel]) {
        const s = await database_1.TicketsDatabase.getSettings(ctx.guild.id);
        s.logChannelID = channel.id;
        await database_1.TicketsDatabase.saveSettings(s);
        return this.success(true);
    },
});
//# sourceMappingURL=setTicketLogChannel.js.map