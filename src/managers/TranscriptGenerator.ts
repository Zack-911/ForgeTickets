import { Collection, Message, TextChannel } from "discord.js"
import { AttachmentBuilder } from "discord.js"
import { Ticket, TicketCategory, TranscriptFormat } from "../structures/entities"
import { TicketsDatabase } from "../structures/database"
import noop from "../functions/noop"

export class TranscriptGenerator {
    /**
     * Generates and uploads a transcript for a ticket.
     * Automatically sends it to the transcript channel if configured.
     */
    public static async generate(ticket: Ticket, channel: TextChannel, category: TicketCategory): Promise<void> {
        const messages = await this._fetchAllMessages(channel)
        const sorted = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp)

        const format = category.transcriptFormat ?? TranscriptFormat.HTML

        const files: AttachmentBuilder[] = []

        if (format === TranscriptFormat.HTML || format === TranscriptFormat.Both) {
            const html = this._buildHTML(ticket, sorted, category)
            files.push(new AttachmentBuilder(Buffer.from(html, "utf-8"), { name: `ticket-${ticket.number}.html` }))
        }

        if (format === TranscriptFormat.Text || format === TranscriptFormat.Both) {
            const text = this._buildText(ticket, sorted)
            files.push(new AttachmentBuilder(Buffer.from(text, "utf-8"), { name: `ticket-${ticket.number}.txt` }))
        }

        if (!files.length || !category.transcriptChannelID) return

        const transcriptChannel = channel.guild.channels.cache.get(category.transcriptChannelID) as
            | TextChannel
            | undefined
        if (!transcriptChannel) return

        const opener = await channel.guild.members.fetch(ticket.openerID).catch(() => null)

        await transcriptChannel
            .send({
                content: `📄 Transcript for ticket **#${ticket.number}** (opened by ${opener?.displayName ?? ticket.openerID})`,
                files,
            })
            .catch(noop)
    }

    // ─── HTML Transcript ───────────────────────────────────────────────────

    private static _buildHTML(ticket: Ticket, messages: Message[], category: TicketCategory): string {
        const rows = messages
            .map((msg) => {
                const avatar = msg.author.displayAvatarURL({ size: 32, extension: "webp" })
                const time = new Date(msg.createdTimestamp).toLocaleString()
                const content = this._escapeHTML(msg.content || "")
                const attachments = msg.attachments
                    .map((a: any) =>
                        a.contentType?.startsWith("image")
                            ? `<img src="${a.url}" class="attachment-img" alt="attachment" />`
                            : `<a href="${a.url}" class="attachment-link" target="_blank">📎 ${this._escapeHTML(a.name)}</a>`
                    )
                    .join("")

                const embeds = msg.embeds
                    .map(
                        (e: any) => `
                <div class="embed" style="border-left-color: #${(e.color ?? 0x5865f2).toString(16).padStart(6, "0")}">
                    ${e.title ? `<div class="embed-title">${this._escapeHTML(e.title)}</div>` : ""}
                    ${e.description ? `<div class="embed-desc">${this._escapeHTML(e.description)}</div>` : ""}
                    ${e.fields.map((f: any) => `<div class="embed-field"><b>${this._escapeHTML(f.name)}</b>: ${this._escapeHTML(f.value)}</div>`).join("")}
                </div>`
                    )
                    .join("")

                return `
            <div class="message">
                <img class="avatar" src="${avatar}" alt="" />
                <div class="message-body">
                    <div class="message-header">
                        <span class="username">${this._escapeHTML(msg.author.username)}</span>
                        <span class="timestamp">${time}</span>
                        ${msg.author.bot ? `<span class="bot-tag">BOT</span>` : ""}
                    </div>
                    ${content ? `<div class="message-content">${content}</div>` : ""}
                    ${attachments}
                    ${embeds}
                </div>
            </div>`
            })
            .join("\n")

        const openedAt = new Date(ticket.createdAt).toLocaleString()
        const closedAt = ticket.closedAt ? new Date(ticket.closedAt).toLocaleString() : "N/A"
        const formSection =
            ticket.formAnswers && Object.keys(ticket.formAnswers).length
                ? `<div class="meta-section"><h3>📋 Form Answers</h3><table>${Object.entries(ticket.formAnswers)
                      .map(([k, v]) => `<tr><td><b>${this._escapeHTML(k)}</b></td><td>${this._escapeHTML(v)}</td></tr>`)
                      .join("")}</table></div>`
                : ""

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Ticket #${ticket.number} Transcript</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Segoe UI",system-ui,sans-serif;background:#313338;color:#dbdee1;font-size:14px;line-height:1.5}
  header{background:#2b2d31;padding:20px 32px;border-bottom:1px solid #1e1f22;display:flex;align-items:center;gap:16px}
  header h1{font-size:20px;font-weight:700;color:#fff}
  .badge{background:#5865f2;color:#fff;font-size:11px;padding:2px 8px;border-radius:12px;font-weight:600}
  .meta{background:#2b2d31;padding:16px 32px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;border-bottom:1px solid #1e1f22}
  .meta-item{display:flex;flex-direction:column;gap:2px}
  .meta-item .label{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#949ba4}
  .meta-item .value{color:#dbdee1;font-weight:500}
  .meta-section{padding:16px 32px;background:#2b2d31;border-bottom:1px solid #1e1f22}
  .meta-section h3{margin-bottom:8px;color:#949ba4;font-size:12px;text-transform:uppercase}
  table{width:100%;border-collapse:collapse}
  table td{padding:6px 10px;border-bottom:1px solid #3b3d44}
  .messages{padding:16px 32px;display:flex;flex-direction:column;gap:4px}
  .message{display:flex;gap:12px;padding:6px 0;border-radius:4px}
  .message:hover{background:rgba(255,255,255,.03)}
  .avatar{width:40px;height:40px;border-radius:50%;flex-shrink:0;align-self:flex-start;margin-top:2px}
  .message-body{flex:1;min-width:0}
  .message-header{display:flex;align-items:baseline;gap:8px;margin-bottom:2px}
  .username{font-weight:600;color:#fff}
  .timestamp{font-size:11px;color:#72767d}
  .bot-tag{background:#5865f2;color:#fff;font-size:10px;padding:1px 5px;border-radius:3px;font-weight:700}
  .message-content{white-space:pre-wrap;word-break:break-word}
  .attachment-img{max-width:400px;max-height:300px;border-radius:4px;margin-top:8px;display:block}
  .attachment-link{color:#00a8fc;text-decoration:none;display:inline-block;margin-top:4px}
  .embed{border-left:4px solid #5865f2;background:#2b2d31;border-radius:4px;padding:12px 16px;margin-top:8px;max-width:520px}
  .embed-title{font-weight:700;margin-bottom:4px}
  .embed-desc{color:#dbdee1;font-size:13px;margin-bottom:6px}
  .embed-field{font-size:13px;color:#b5bac1;margin-top:4px}
  footer{text-align:center;padding:24px;color:#72767d;font-size:12px;border-top:1px solid #1e1f22}
</style>
</head>
<body>
<header>
  <div>
    <div style="display:flex;align-items:center;gap:10px">
      <h1>Ticket #${ticket.number}</h1>
      <span class="badge">${ticket.state.toUpperCase()}</span>
      <span class="badge" style="background:#${this._priorityColor(ticket.priority)}">${ticket.priority.toUpperCase()}</span>
    </div>
    <div style="color:#949ba4;font-size:13px;margin-top:4px">${category.name} • ${messages.length} messages</div>
  </div>
</header>
<div class="meta">
  <div class="meta-item"><span class="label">Opener</span><span class="value">${ticket.openerID}</span></div>
  <div class="meta-item"><span class="label">Opened</span><span class="value">${openedAt}</span></div>
  <div class="meta-item"><span class="label">Closed</span><span class="value">${closedAt}</span></div>
  ${ticket.closedBy ? `<div class="meta-item"><span class="label">Closed by</span><span class="value">${ticket.closedBy}</span></div>` : ""}
  ${ticket.closeReason ? `<div class="meta-item"><span class="label">Reason</span><span class="value">${this._escapeHTML(ticket.closeReason)}</span></div>` : ""}
  ${ticket.claimedBy ? `<div class="meta-item"><span class="label">Claimed by</span><span class="value">${ticket.claimedBy}</span></div>` : ""}
  <div class="meta-item"><span class="label">Participants</span><span class="value">${ticket.participants.join(", ") || "N/A"}</span></div>
  ${ticket.tags.length ? `<div class="meta-item"><span class="label">Tags</span><span class="value">${this._escapeHTML(ticket.tags.join(", "))}</span></div>` : ""}
</div>
${formSection}
<div class="messages">${rows}</div>
<footer>Generated by ForgeTickets • ${new Date().toLocaleString()}</footer>
</body></html>`
    }

    // ─── Plain Text Transcript ─────────────────────────────────────────────

    private static _buildText(ticket: Ticket, messages: Message[]): string {
        const lines: string[] = [
            `=== TICKET #${ticket.number} TRANSCRIPT ===`,
            `Opener: ${ticket.openerID}`,
            `State: ${ticket.state}`,
            `Priority: ${ticket.priority}`,
            `Created: ${new Date(ticket.createdAt).toLocaleString()}`,
            ticket.closedAt ? `Closed: ${new Date(ticket.closedAt).toLocaleString()}` : "",
            ticket.closedBy ? `Closed by: ${ticket.closedBy}` : "",
            ticket.closeReason ? `Reason: ${ticket.closeReason}` : "",
            ticket.tags.length ? `Tags: ${ticket.tags.join(", ")}` : "",
            `Participants: ${ticket.participants.join(", ")}`,
            "",
            "=== MESSAGES ===",
            "",
        ].filter(Boolean)

        for (const msg of messages) {
            const ts = new Date(msg.createdTimestamp).toLocaleString()
            lines.push(
                `[${ts}] ${msg.author.username}${msg.author.bot ? " [BOT]" : ""}: ${msg.content || "(no content)"}`
            )
            for (const embed of msg.embeds) {
                if (embed.title) lines.push(`  [EMBED] ${embed.title}`)
                if (embed.description) lines.push(`  ${embed.description}`)
            }
            for (const [, att] of msg.attachments) {
                lines.push(`  [ATTACHMENT] ${att.name}: ${att.url}`)
            }
        }

        return lines.join("\n")
    }

    // ─── Utilities ─────────────────────────────────────────────────────────

    private static async _fetchAllMessages(channel: TextChannel): Promise<Collection<string, Message>> {
        let all = new Collection<string, Message>()
        let before: string | undefined

        for (let i = 0; i < 100; i++) {
            // cap at 10,000 messages
            const batch = await channel.messages
                .fetch({ limit: 100, before })
                .catch(() => new Collection<string, Message>())
            if (!batch.size) break
            all = all.concat(batch)
            before = batch.last()?.id
        }

        return all
    }

    private static _escapeHTML(str: string): string {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    }

    private static _priorityColor(priority: string): string {
        const map: Record<string, string> = { low: "57f287", medium: "fee75c", high: "e67e22", urgent: "ed4245" }
        return map[priority] ?? "5865f2"
    }
}
