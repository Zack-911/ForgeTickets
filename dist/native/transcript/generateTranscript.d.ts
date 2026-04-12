import { ArgType, NativeFunction } from "@tryforge/forgescript";
import { TranscriptFormat } from "../../structures/entities";
declare const _default: NativeFunction<[{
    name: string;
    description: string;
    type: ArgType.String;
    required: false;
    rest: false;
}, {
    name: string;
    description: string;
    type: ArgType.Enum;
    enum: typeof TranscriptFormat;
    required: false;
    rest: false;
}], true>;
export default _default;
//# sourceMappingURL=generateTranscript.d.ts.map