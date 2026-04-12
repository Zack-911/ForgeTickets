import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { IFormField } from "../../structures/entities"

export default new NativeFunction({
    name: "$addCategoryForm",
    version: "1.0.0",
    description: "Adds a form field to a category (max 5). Fields are shown as a Discord modal when opening a ticket.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to add the field to",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "key",
            description: "Unique field identifier",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "label",
            description: "Label shown to the user in the modal",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "style",
            description: "short (one line) or paragraph (multi-line)",
            type: ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "required",
            description: "Whether the field must be filled",
            type: ArgType.Boolean,
            required: false,
            rest: false,
        },
        {
            name: "placeholder",
            description: "Placeholder text shown inside the input",
            type: ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id, key, label, style, required, placeholder]) {
        const cat = await TicketsDatabase.getCategory(id)
        if (!cat) return this.customError(`Category ${id} not found`)
        if ((cat.form?.length ?? 0) >= 5) return this.customError("Max 5 form fields per category")
        const field: IFormField = {
            key,
            label,
            style: (style as "short" | "paragraph") ?? "short",
            required: required ?? false,
            placeholder: placeholder ?? undefined,
        }
        cat.form = [...(cat.form ?? []), field]
        await TicketsDatabase.saveCategory(cat)
        return this.success(true)
    },
})
