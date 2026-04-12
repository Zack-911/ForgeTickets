"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
exports.default = new forgescript_1.NativeFunction({
    name: "$ticketEvent",
    version: "1.0.0",
    description: "Returns the extras in an event.",
    unwrap: false,
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx) {
        // @ts-ignore
        return this.successJSON((ctx.runtime.extras));
    },
});
//# sourceMappingURL=ticketEvent.js.map