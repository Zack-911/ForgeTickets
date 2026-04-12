import { TextChannel } from "discord.js";
import { Ticket, TicketCategory } from "../structures/entities";
export declare class TranscriptGenerator {
    /**
     * Generates and uploads a transcript for a ticket.
     * Automatically sends it to the transcript channel if configured.
     */
    static generate(ticket: Ticket, channel: TextChannel, category: TicketCategory): Promise<void>;
    private static _buildHTML;
    private static _buildText;
    private static _fetchAllMessages;
    private static _escapeHTML;
    private static _priorityColor;
}
//# sourceMappingURL=TranscriptGenerator.d.ts.map