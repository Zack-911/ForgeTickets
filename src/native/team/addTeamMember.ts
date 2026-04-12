import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$addTeamMember",
    version: "1.0.0",
    description: "Adds a user to a support team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to add the member to",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "userID",
            description: "User to add",
            type: ArgType.User,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id, user]) {
        const team = await TicketsDatabase.getTeam(id)
        if (!team) return this.customError(`Team ${id} not found`)
        if (!team.members.includes(user.id)) {
            team.members.push(user.id)
            await TicketsDatabase.saveTeam(team)
        }
        return this.success(true)
    },
})
