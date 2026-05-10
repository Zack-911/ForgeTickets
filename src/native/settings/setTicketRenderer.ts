import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { TicketRendererEventEnum, RENDERER_EVENTS } from "../../managers/TicketRenderer"

export default new NativeFunction({
    name: "$setTicketRenderer",
    description:
        "Registers a ForgeScript code string as the renderer for a ticket event in this guild. " +
        "The code runs inside the ticket channel with ticket data available via $env[key]. ",
    version: "1.0.0",
    brackets: true,
    unwrap: false,

    args: [
        {
            name: "event",
            description: "The ticket event to set a renderer for.",
            type: ArgType.Enum,
            enum: TicketRendererEventEnum,
            required: true,
            rest: false,
        },
        {
            name: "code",
            description: "The ForgeScript code to run when this event fires.",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "guildId",
            description: "Guild ID. Defaults to current guild.",
            type: ArgType.String,
            required: false,
            rest: false,
        },
    ],

    async execute(ctx) {
        const eventResult = await this["resolveUnhandledArg"](ctx, 0)
        if (!this["isValidReturnType"](eventResult)) return eventResult
        const code = this["displayField"](1)
        if (!code) return this.customError("No code provided.")

        const guildIdResult = await this["resolveUnhandledArg"](ctx, 2)
        if (!this["isValidReturnType"](guildIdResult)) return guildIdResult

        const gid = (guildIdResult.value as string | null) ?? ctx.guild?.id
        if (!gid) return this.customError("No guild ID provided.")

        const eventIndex = eventResult.value as unknown as number
        const eventName = TicketRendererEventEnum[eventIndex] as keyof typeof TicketRendererEventEnum
        if (eventName === undefined) {
            return this.customError(`Invalid event. Valid events: ${RENDERER_EVENTS.join(", ")}`)
        }

        const settings = await TicketsDatabase.getSettings(gid)
        settings.renderers ??= {}
        settings.renderers[eventName] = code
        await TicketsDatabase.saveSettings(settings)

        return this.success("true")
    },
})
