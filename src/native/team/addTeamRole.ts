import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$addTeamRole",
    version: "1.0.0",
    description: "Adds a role to a support team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to add the role to",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "roleID",
            description: "Role to add",
            type: ArgType.Role,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id, role]) {
        const team = await TicketsDatabase.getTeam(id)
        if (!team) return this.customError(`Team ${id} not found`)
        if (!team.roles.includes(role.id)) {
            team.roles.push(role.id)
            await TicketsDatabase.saveTeam(team)
        }
        return this.success(true)
    },
})
