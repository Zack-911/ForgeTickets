import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$removeTeamMember",
    version: "1.0.0",
    description: "Removes a user from a support team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to remove the member from",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "userID",
            description: "User to remove",
            type: ArgType.User,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id, user]) {
        const team = await TicketsDatabase.getTeam(id)
        if (!team) return this.customError(`Team ${id} not found`)
        team.members = team.members.filter((m) => m !== user.id)
        await TicketsDatabase.saveTeam(team)
        return this.success(true)
    },
})
