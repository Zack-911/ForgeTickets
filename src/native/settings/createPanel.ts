import { ArgType, NativeFunction } from "@tryforge/forgescript"
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from "discord.js"
import type { TextChannel } from "discord.js"
import { TicketsDatabase } from "../../structures/database"
import { TicketPanel, ICategoryEmbed, IPanelButton } from "../../structures/entities"
import { encodeCID, CID } from "../../handlers/TicketsInteractionHandler"

export default new NativeFunction({
    name: "$createPanel",
    version: "1.0.0",
    description: "Sends a ticket panel to a channel with one button per enabled category. Returns the panel ID.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "channelID",
            description: "Channel to post the panel in",
            type: ArgType.Channel,
            required: true,
            rest: false,
        },
        {
            name: "embedJSON",
            description: "Optional embed config JSON {title,description,color,thumbnailURL,footerText,footerIconURL}",
            type: ArgType.Json,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.String,
    async execute(ctx, [channel, embedJSON]) {
        const cats = await TicketsDatabase.getCategoriesByGuild(ctx.guild!.id)
        if (!cats.length) return this.customError("No categories configured. Create a category first with $createCategory.")

        const panelEmbedDef = embedJSON ? (embedJSON as unknown as ICategoryEmbed) : null
        const embed = new EmbedBuilder()
            .setTitle(panelEmbedDef?.title ?? "🎫 Support Tickets")
            .setDescription(panelEmbedDef?.description ?? "Select a category below to open a support ticket.")
            .setColor(panelEmbedDef?.color ?? 0x5865f2)
        if (panelEmbedDef?.footerText) embed.setFooter({ text: panelEmbedDef.footerText, iconURL: panelEmbedDef.footerIconURL })
        if (panelEmbedDef?.thumbnailURL) embed.setThumbnail(panelEmbedDef.thumbnailURL)

        const buttons: IPanelButton[] = []
        const rows: ActionRowBuilder<ButtonBuilder>[] = []
        let currentRow = new ActionRowBuilder<ButtonBuilder>()

        for (const cat of cats.filter((c) => c.enabled).slice(0, 25)) {
            const btn = new ButtonBuilder()
                .setCustomId(encodeCID(CID.PANEL_OPEN, cat.id))
                .setLabel(cat.name)
                .setStyle(ButtonStyle.Primary)
            if (cat.emoji) btn.setEmoji(cat.emoji)
            currentRow.addComponents(btn)
            buttons.push({ categoryID: cat.id, label: cat.name, emoji: cat.emoji, style: "primary" })
            if (currentRow.components.length === 5) {
                rows.push(currentRow)
                currentRow = new ActionRowBuilder<ButtonBuilder>()
            }
        }
        if (currentRow.components.length > 0) rows.push(currentRow)

        const ch = channel as unknown as TextChannel
        const msg = await ch.send({ embeds: [embed], components: rows.map((r) => r.toJSON()) })

        const panel = new TicketPanel({
            guildID: ctx.guild!.id,
            channelID: channel.id,
            messageID: msg.id,
            embed: panelEmbedDef ?? undefined,
            buttons,
        })
        await TicketsDatabase.savePanel(panel)
        return this.success(panel.id)
    },
})
