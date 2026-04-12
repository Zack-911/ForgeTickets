import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$removeGlobalStaffRole",
    version: "1.0.0",
    description: "Removes a role from the global staff list.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "roleID",
            description: "Role to remove",
            type: ArgType.Role,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [role]) {
        const s = await TicketsDatabase.getSettings(ctx.guild!.id)
        s.globalStaffRoles = s.globalStaffRoles.filter((r) => r !== role.id)
        await TicketsDatabase.saveSettings(s)
        return this.success(true)
    },
})
