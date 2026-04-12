import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { ISLAConfig } from "../../structures/entities"

export default new NativeFunction({
    name: "$setCategorySLA",
    version: "1.0.0",
    description: "Configures SLA timers for a category.",
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
            name: "responseTimeMS",
            description: "First-response SLA in milliseconds (0 = disabled)",
            type: ArgType.Number,
            required: false,
            rest: false,
        },
        {
            name: "resolutionTimeMS",
            description: "Resolution SLA in milliseconds (0 = disabled)",
            type: ArgType.Number,
            required: false,
            rest: false,
        },
        {
            name: "alertChannelID",
            description: "Channel to post SLA breach alerts in",
            type: ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id, responseTimeMS, resolutionTimeMS, alertChannelID]) {
        const cat = await TicketsDatabase.getCategory(id)
        if (!cat) return this.customError(`Category ${id} not found`)
        const sla: ISLAConfig = {
            responseTime: responseTimeMS || undefined,
            resolutionTime: resolutionTimeMS || undefined,
            alertChannelID: alertChannelID || undefined,
        }
        cat.sla = sla
        await TicketsDatabase.saveCategory(cat)
        return this.success(true)
    },
})
