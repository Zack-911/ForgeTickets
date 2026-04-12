"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$setCategoryEmbed",
    version: "1.0.0",
    description: "Sets the open or close embed config for a category.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to configure",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "type",
            description: "open or close",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "embedJSON",
            description: "Embed config as JSON {title,description,color,thumbnailURL,imageURL,footerText,footerIconURL}",
            type: forgescript_1.ArgType.Json,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [id, type, embedJSON]) {
        const cat = await database_1.TicketsDatabase.getCategory(id);
        if (!cat)
            return this.customError(`Category ${id} not found`);
        const embed = embedJSON;
        if (type === "open")
            cat.openEmbed = embed;
        else if (type === "close")
            cat.closeEmbed = embed;
        else
            return this.customError("type must be 'open' or 'close'");
        await database_1.TicketsDatabase.saveCategory(cat);
        return this.success(true);
    },
});
//# sourceMappingURL=setCategoryEmbed.js.map