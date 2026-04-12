"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$removeGlobalStaffRole",
    version: "1.0.0",
    description: "Removes a role from the global staff list.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "roleID",
            description: "Role to remove",
            type: forgescript_1.ArgType.Role,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [role]) {
        const s = await database_1.TicketsDatabase.getSettings(ctx.guild.id);
        s.globalStaffRoles = s.globalStaffRoles.filter((r) => r !== role.id);
        await database_1.TicketsDatabase.saveSettings(s);
        return this.success(true);
    },
});
//# sourceMappingURL=removeGlobalStaffRole.js.map