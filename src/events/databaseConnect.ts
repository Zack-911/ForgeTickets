import { Interpreter } from "@tryforge/forgescript"
import { TicketEventHandler } from "../handlers"
import { ForgeTickets } from ".."

export default new TicketEventHandler({
    name: "databaseConnect",
    version: "1.0.0",
    description: "Fired when the database connects.",
    listener: async function () {
        const ext = this.getExtension(ForgeTickets, true)
        const commands = ext.commands.get("databaseConnect")
        for (const command of commands) {
            Interpreter.run({
                client: this,
                command,
                data: command.compiled.code,
                obj: {},
            })
        }
    },
})
