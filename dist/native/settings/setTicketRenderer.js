"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
const TicketRenderer_1 = require("../../managers/TicketRenderer");
exports.default = new forgescript_1.NativeFunction({
    name: "$setTicketRenderer",
    description: "Registers a ForgeScript code string as the renderer for a ticket event in this guild. " +
        "The code runs inside the ticket channel with ticket data available via $env[key]. ",
    version: "1.0.0",
    brackets: true,
    unwrap: false,
    args: [
        {
            name: "event",
            description: "The ticket event to set a renderer for.",
            type: forgescript_1.ArgType.Enum,
            enum: TicketRenderer_1.TicketRendererEventEnum,
            required: true,
            rest: false,
        },
        {
            name: "code",
            description: "The ForgeScript code to run when this event fires.",
            type: forgescript_1.ArgType.String,
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
    async execute(ctx) {
        const eventResult = await this["resolveUnhandledArg"](ctx, 0);
        if (!this["isValidReturnType"](eventResult))
            return eventResult;
        const code = this["displayField"](1);
        if (!code)
            return this.customError("No code provided.");
        const guildIdResult = await this["resolveUnhandledArg"](ctx, 2);
        if (!this["isValidReturnType"](guildIdResult))
            return guildIdResult;
        const gid = guildIdResult.value ?? ctx.guild?.id;
        if (!gid)
            return this.customError("No guild ID provided.");
        const eventIndex = eventResult.value;
        const eventName = TicketRenderer_1.TicketRendererEventEnum[eventIndex];
        if (eventName === undefined) {
            return this.customError(`Invalid event. Valid events: ${TicketRenderer_1.RENDERER_EVENTS.join(", ")}`);
        }
        const settings = await database_1.TicketsDatabase.getSettings(gid);
        settings.renderers ??= {};
        settings.renderers[eventName] = code;
        await database_1.TicketsDatabase.saveSettings(settings);
        return this.success("true");
    },
});
//# sourceMappingURL=setTicketRenderer.js.map