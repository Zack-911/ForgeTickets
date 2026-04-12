"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$setTicketDMOption",
    version: "1.0.0",
    description: "Enables or disables DM notifications to the opener on ticket open or close.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "event",
            description: "open or close",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "enabled",
            description: "true or false",
            type: forgescript_1.ArgType.Boolean,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [event, enabled]) {
        const s = await database_1.TicketsDatabase.getSettings(ctx.guild.id);
        if (event === "open")
            s.dmOnOpen = enabled;
        else if (event === "close")
            s.dmOnClose = enabled;
        else
            return this.customError("event must be 'open' or 'close'");
        await database_1.TicketsDatabase.saveSettings(s);
        return this.success(true);
    },
});
//# sourceMappingURL=setTicketDMOption.js.map