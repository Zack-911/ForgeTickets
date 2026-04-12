import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$removeTeamRole",
    version: "1.0.0",
    description: "Removes a role from a support team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to remove the role from",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "roleID",
            description: "Role to remove",
            type: ArgType.Role,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id, role]) {
        const team = await TicketsDatabase.getTeam(id)
        if (!team) return this.customError(`Team ${id} not found`)
        team.roles = team.roles.filter((r) => r !== role.id)
        await TicketsDatabase.saveTeam(team)
        return this.success(true)
    },
})
