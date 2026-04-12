"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$setCategoryOption",
    version: "1.0.0",
    description: "Sets a configuration option on a ticket category. Options: maxPerUser, autoCloseAfter, deleteAfter, enabled, channelNameTemplate, transcriptFormat, routingStrategy, transcriptChannelID, teamID, parentChannelID.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to configure",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "option",
            description: "Option name",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "value",
            description: "New value",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [id, option, value]) {
        const cat = await database_1.TicketsDatabase.getCategory(id);
        if (!cat)
            return this.customError(`Category ${id} not found`);
        switch (option) {
            case "maxPerUser":
                cat.maxPerUser = parseInt(value);
                break;
            case "autoCloseAfter":
                cat.autoCloseAfter = parseInt(value);
                break;
            case "deleteAfter":
                cat.deleteAfter = parseInt(value);
                break;
            case "enabled":
                cat.enabled = value === "true";
                break;
            case "channelNameTemplate":
                cat.channelNameTemplate = value;
                break;
            case "transcriptFormat":
                cat.transcriptFormat = value;
                break;
            case "routingStrategy":
                cat.routingStrategy = value;
                break;
            case "transcriptChannelID":
                cat.transcriptChannelID = value;
                break;
            case "teamID":
                cat.teamID = value;
                break;
            case "parentChannelID":
                cat.parentChannelID = value;
                break;
            default:
                return this.customError(`Unknown option: ${option}`);
        }
        await database_1.TicketsDatabase.saveCategory(cat);
        return this.success(true);
    },
});
//# sourceMappingURL=setCategoryOption.js.map