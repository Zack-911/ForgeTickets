import { TextChannel } from "discord.js";
import { Ticket, TicketCategory, TranscriptFormat } from "../structures/entities";
export declare class TranscriptGenerator {
    /**
     * Generates and uploads a transcript for a ticket.
     * Automatically sends it to the transcript channel if configured.
     */
    /**
     * Builds the transcript content without sending it anywhere.
     * Returns the raw HTML and/or text strings based on the configured format.
     */
    static build(ticket: Ticket, channel: TextChannel, format?: TranscriptFormat): Promise<{
        html: string | null;
        text: string | null;
    }>;
    static generate(ticket: Ticket, channel: TextChannel, category: TicketCategory): Promise<void>;
    private static _buildHTML;
    private static _buildText;
    private static _fetchAllMessages;
    private static _escapeHTML;
    private static _priorityColor;
}
//# sourceMappingURL=TranscriptGenerator.d.ts.map