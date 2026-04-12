import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { IRoutingRule } from "../../structures/entities"

export default new NativeFunction({
    name: "$addCategoryRoutingRule",
    version: "1.0.0",
    description:
        "Adds a smart routing rule to a category. Tickets whose subject contains any keyword are routed to the target team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to add the rule to",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "targetTeamID",
            description: "Team to route matching tickets to",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "keywords",
            description: "Comma-separated subject keywords that trigger this rule",
            type: ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id, targetTeamID, keywords]) {
        const cat = await TicketsDatabase.getCategory(id)
        if (!cat) return this.customError(`Category ${id} not found`)
        const rule: IRoutingRule = {
            targetTeamID,
            keywords: keywords ? keywords.split(",").map((k) => k.trim()) : undefined,
        }
        cat.routingRules = [...(cat.routingRules ?? []), rule]
        await TicketsDatabase.saveCategory(cat)
        return this.success(true)
    },
})
