import { ArgType, NativeFunction } from "@tryforge/forgescript";
export declare enum TicketProperty {
    id = "id",
    number = "number",
    state = "state",
    priority = "priority",
    openerID = "openerID",
    channelID = "channelID",
    categoryID = "categoryID",
    teamID = "teamID",
    claimedBy = "claimedBy",
    subject = "subject",
    createdAt = "createdAt",
    closedAt = "closedAt",
    closedBy = "closedBy",
    closeReason = "closeReason",
    lastActivityAt = "lastActivityAt",
    participants = "participants",
    tags = "tags",
    formAnswers = "formAnswers",
    notes = "notes",
    slaStatus = "slaStatus"
}
declare const _default: NativeFunction<[{
    name: string;
    description: string;
    type: ArgType.Enum;
    enum: typeof TicketProperty;
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
//# sourceMappingURL=ticketEventData.d.ts.map