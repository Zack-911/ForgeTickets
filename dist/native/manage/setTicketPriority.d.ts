import { ArgType, NativeFunction } from "@tryforge/forgescript";
import { TicketPriority } from "../../structures/entities";
declare const _default: NativeFunction<[{
    name: string;
    description: string;
    type: ArgType.Enum;
    enum: typeof TicketPriority;
    required: true;
    rest: false;
}, {
    name: string;
    description: string;
    type: ArgType.String;
    required: false;
    rest: false;
}], true>;
export default _default;
//# sourceMappingURL=setTicketPriority.d.ts.map