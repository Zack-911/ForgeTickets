"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$setCategorySLA",
    version: "1.0.0",
    description: "Configures SLA timers for a category.",
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
            name: "responseTimeMS",
            description: "First-response SLA in milliseconds (0 = disabled)",
            type: forgescript_1.ArgType.Number,
            required: false,
            rest: false,
        },
        {
            name: "resolutionTimeMS",
            description: "Resolution SLA in milliseconds (0 = disabled)",
            type: forgescript_1.ArgType.Number,
            required: false,
            rest: false,
        },
        {
            name: "alertChannelID",
            description: "Channel to post SLA breach alerts in",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [id, responseTimeMS, resolutionTimeMS, alertChannelID]) {
        const cat = await database_1.TicketsDatabase.getCategory(id);
        if (!cat)
            return this.customError(`Category ${id} not found`);
        const sla = {
            responseTime: responseTimeMS || undefined,
            resolutionTime: resolutionTimeMS || undefined,
            alertChannelID: alertChannelID || undefined,
        };
        cat.sla = sla;
        await database_1.TicketsDatabase.saveCategory(cat);
        return this.success(true);
    },
});
//# sourceMappingURL=setCategorySLA.js.map