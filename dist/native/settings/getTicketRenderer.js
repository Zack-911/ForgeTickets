"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
const TicketRenderer_1 = require("../../managers/TicketRenderer");
exports.default = new forgescript_1.NativeFunction({
    name: "$getTicketRenderer",
    description: "Returns the current guild renderer code for a ticket event, or empty string if none is set (using global or default).",
    version: "1.0.0",
    brackets: true,
    unwrap: true,
    args: [
        {
            name: "event",
            description: "The ticket event to retrieve the renderer for.",
            type: forgescript_1.ArgType.Enum,
            enum: TicketRenderer_1.TicketRendererEventEnum,
            required: true,
            rest: false,
        },
        {
            name: "guildId",
            description: "Guild ID. Defaults to current guild.",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.String,
    async execute(ctx, [event, guildId]) {
        const gid = guildId ?? ctx.guild?.id;
        if (!gid)
            return this.customError("No guild ID provided.");
        const eventName = TicketRenderer_1.TicketRendererEventEnum[event];
        if (eventName === undefined)
            return this.customError(`Invalid event. Valid events: ${TicketRenderer_1.RENDERER_EVENTS.join(", ")}`);
        const settings = await database_1.TicketsDatabase.getSettings(gid);
        return this.success(settings.renderers?.[eventName] ?? "");
    },
});
//# sourceMappingURL=getTicketRenderer.js.map