import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { ITicketEvents } from "../../handlers"

export default new NativeFunction({
  name: "$ticketEvent",
  version: "1.0.0",
  description: "Returns the extras in an event.",
  unwrap: false,
  output: ArgType.Boolean,
  async execute(ctx) {
    // @ts-ignore
    return this.successJSON((ctx.runtime.extras))
  },
})
