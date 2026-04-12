"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$deleteTeam",
    version: "1.0.0",
    description: "Deletes a support team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to delete",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [id]) {
        await database_1.TicketsDatabase.deleteTeam(id);
        return this.success(true);
    },
});
//# sourceMappingURL=deleteTeam.js.map