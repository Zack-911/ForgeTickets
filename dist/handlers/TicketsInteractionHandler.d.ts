import { ForgeClient } from "@tryforge/forgescript";
/** Custom ID prefixes used throughout the button/modal system */
export declare const CID: {
    readonly PANEL_OPEN: "fticket_panel_open";
    readonly TICKET_CLOSE: "fticket_close";
    readonly TICKET_CLAIM: "fticket_claim";
    readonly TICKET_UNCLAIM: "fticket_unclaim";
    readonly TICKET_LOCK: "fticket_lock";
    readonly TICKET_UNLOCK: "fticket_unlock";
    readonly TICKET_REOPEN: "fticket_reopen";
    readonly TICKET_DELETE: "fticket_delete";
    readonly FORM_SUBMIT: "fticket_form";
};
declare function encode(prefix: string, ...parts: string[]): string;
declare function decode(id: string): [string, string[]];
export declare class TicketsInteractionHandler {
    private readonly client;
    constructor(client: ForgeClient);
    private _register;
    private _handlePanelOpen;
    private _handleFormSubmit;
    private _handleClose;
    private _handleClaim;
    private _handleUnclaim;
    private _handleLock;
    private _handleUnlock;
    private _handleReopen;
    private _handleDelete;
    private _mgr;
    private _canManage;
}
export { encode as encodeCID, decode as decodeCID };
//# sourceMappingURL=TicketsInteractionHandler.d.ts.map