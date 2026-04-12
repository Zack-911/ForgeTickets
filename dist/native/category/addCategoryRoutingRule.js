"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$addCategoryRoutingRule",
    version: "1.0.0",
    description: "Adds a smart routing rule to a category. Tickets whose subject contains any keyword are routed to the target team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to add the rule to",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "targetTeamID",
            description: "Team to route matching tickets to",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "keywords",
            description: "Comma-separated subject keywords that trigger this rule",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [id, targetTeamID, keywords]) {
        const cat = await database_1.TicketsDatabase.getCategory(id);
        if (!cat)
            return this.customError(`Category ${id} not found`);
        const rule = {
            targetTeamID,
            keywords: keywords ? keywords.split(",").map((k) => k.trim()) : undefined,
        };
        cat.routingRules = [...(cat.routingRules ?? []), rule];
        await database_1.TicketsDatabase.saveCategory(cat);
        return this.success(true);
    },
});
//# sourceMappingURL=addCategoryRoutingRule.js.map