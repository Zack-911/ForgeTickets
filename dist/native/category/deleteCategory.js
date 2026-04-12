"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$deleteCategory",
    version: "1.0.0",
    description: "Deletes a ticket category.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to delete",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [id]) {
        await database_1.TicketsDatabase.deleteCategory(id);
        return this.success(true);
    },
});
//# sourceMappingURL=deleteCategory.js.map