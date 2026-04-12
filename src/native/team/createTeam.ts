import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { TicketTeam } from "../../structures/entities"

export default new NativeFunction({
    name: "$createTeam",
    version: "1.0.0",
    description: "Creates a support team. Returns the team ID.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "name",
            description: "Team name",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "description",
            description: "Team description",
            type: ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.String,
    async execute(ctx, [name, description]) {
        const team = new TicketTeam({ guildID: ctx.guild!.id, name, description: description ?? undefined })
        await TicketsDatabase.saveTeam(team)
        return this.success(team.id)
    },
})
