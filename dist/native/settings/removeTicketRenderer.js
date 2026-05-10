"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
const TicketRenderer_1 = require("../../managers/TicketRenderer");
exports.default = new forgescript_1.NativeFunction({
    name: "$removeTicketRenderer",
    description: "Removes the guild-specific renderer for a ticket event. Falls back to the global renderer or default embed.",
    version: "1.0.0",
    brackets: true,
    unwrap: true,
    args: [
        {
            name: "event",
            description: "The ticket event to remove the renderer from.",
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
    async execute(ctx, [event, guildId]) {
        const gid = guildId ?? ctx.guild?.id;
        if (!gid)
            return this.customError("No guild ID provided.");
        const eventName = TicketRenderer_1.TicketRendererEventEnum[event];
        if (eventName === undefined)
            return this.customError(`Invalid event. Valid events: ${TicketRenderer_1.RENDERER_EVENTS.join(", ")}`);
        const settings = await database_1.TicketsDatabase.getSettings(gid);
        if (settings.renderers?.[eventName]) {
            delete settings.renderers[eventName];
            await database_1.TicketsDatabase.saveSettings(settings);
        }
        return this.success("true");
    },
});
//# sourceMappingURL=removeTicketRenderer.js.map