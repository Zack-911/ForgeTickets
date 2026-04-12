"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$addGlobalStaffRole",
    version: "1.0.0",
    description: "Adds a role to the global staff list — members can manage all tickets.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "roleID",
            description: "Role to add as global staff",
            type: forgescript_1.ArgType.Role,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [role]) {
        const s = await database_1.TicketsDatabase.getSettings(ctx.guild.id);
        if (!s.globalStaffRoles.includes(role.id)) {
            s.globalStaffRoles.push(role.id);
            await database_1.TicketsDatabase.saveSettings(s);
        }
        return this.success(true);
    },
});
//# sourceMappingURL=addGlobalStaffRole.js.map