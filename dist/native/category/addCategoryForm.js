"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$addCategoryForm",
    version: "1.0.0",
    description: "Adds a form field to a category (max 5). Fields are shown as a Discord modal when opening a ticket.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to add the field to",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "key",
            description: "Unique field identifier",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "label",
            description: "Label shown to the user in the modal",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "style",
            description: "short (one line) or paragraph (multi-line)",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "required",
            description: "Whether the field must be filled",
            type: forgescript_1.ArgType.Boolean,
            required: false,
            rest: false,
        },
        {
            name: "placeholder",
            description: "Placeholder text shown inside the input",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [id, key, label, style, required, placeholder]) {
        const cat = await database_1.TicketsDatabase.getCategory(id);
        if (!cat)
            return this.customError(`Category ${id} not found`);
        if ((cat.form?.length ?? 0) >= 5)
            return this.customError("Max 5 form fields per category");
        const field = {
            key,
            label,
            style: style ?? "short",
            required: required ?? false,
            placeholder: placeholder ?? undefined,
        };
        cat.form = [...(cat.form ?? []), field];
        await database_1.TicketsDatabase.saveCategory(cat);
        return this.success(true);
    },
});
//# sourceMappingURL=addCategoryForm.js.map