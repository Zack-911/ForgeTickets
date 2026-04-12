import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { TranscriptFormat, RoutingStrategy } from "../../structures/entities"

export default new NativeFunction({
    name: "$setCategoryOption",
    version: "1.0.0",
    description:
        "Sets a configuration option on a ticket category. Options: maxPerUser, autoCloseAfter, deleteAfter, enabled, channelNameTemplate, transcriptFormat, routingStrategy, transcriptChannelID, teamID, parentChannelID.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to configure",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "option",
            description: "Option name",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "value",
            description: "New value",
            type: ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id, option, value]) {
        const cat = await TicketsDatabase.getCategory(id)
        if (!cat) return this.customError(`Category ${id} not found`)
        switch (option) {
            case "maxPerUser":
                cat.maxPerUser = parseInt(value)
                break
            case "autoCloseAfter":
                cat.autoCloseAfter = parseInt(value)
                break
            case "deleteAfter":
                cat.deleteAfter = parseInt(value)
                break
            case "enabled":
                cat.enabled = value === "true"
                break
            case "channelNameTemplate":
                cat.channelNameTemplate = value
                break
            case "transcriptFormat":
                cat.transcriptFormat = value as TranscriptFormat
                break
            case "routingStrategy":
                cat.routingStrategy = value as RoutingStrategy
                break
            case "transcriptChannelID":
                cat.transcriptChannelID = value
                break
            case "teamID":
                cat.teamID = value
                break
            case "parentChannelID":
                cat.parentChannelID = value
                break
            default:
                return this.customError(`Unknown option: ${option}`)
        }
        await TicketsDatabase.saveCategory(cat)
        return this.success(true)
    },
})
