import { ArgType, NativeFunction } from "@tryforge/forgescript";
import { TicketRendererEventEnum } from "../../managers/TicketRenderer";
declare const _default: NativeFunction<[{
    name: string;
    description: string;
    type: ArgType.Enum;
    enum: typeof TicketRendererEventEnum;
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
//# sourceMappingURL=getTicketRenderer.d.ts.map