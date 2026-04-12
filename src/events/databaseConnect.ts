import { Interpreter } from "@tryforge/forgescript"
import { TicketEventHandler } from "../handlers"
import { ForgeTickets } from ".."

export default new TicketEventHandler({
    name: "databaseConnect",
    version: "1.0.0",
    description: "Fired on databaseConnect.",
    listener: function(...args: any[]) {
        const commands = this.getExtension(ForgeTickets, true).commands.get("databaseConnect")
        for (const command of commands) {
            Interpreter.run({ client: this, command, data: command.compiled.code, obj: args[0], extras: { args } })
        }
    },
})
