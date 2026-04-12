import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$addGlobalStaffRole",
    version: "1.0.0",
    description: "Adds a role to the global staff list — members can manage all tickets.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "roleID",
            description: "Role to add as global staff",
            type: ArgType.Role,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [role]) {
        const s = await TicketsDatabase.getSettings(ctx.guild!.id)
        if (!s.globalStaffRoles.includes(role.id)) {
            s.globalStaffRoles.push(role.id)
            await TicketsDatabase.saveSettings(s)
        }
        return this.success(true)
    },
})
