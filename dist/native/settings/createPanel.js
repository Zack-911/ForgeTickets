"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const discord_js_1 = require("discord.js");
const database_1 = require("../../structures/database");
const entities_1 = require("../../structures/entities");
const TicketsInteractionHandler_1 = require("../../handlers/TicketsInteractionHandler");
exports.default = new forgescript_1.NativeFunction({
    name: "$createPanel",
    version: "1.0.0",
    description: "Sends a ticket panel to a channel with one button per enabled category. Returns the panel ID.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "channelID",
            description: "Channel to post the panel in",
            type: forgescript_1.ArgType.Channel,
            required: true,
            rest: false,
        },
        {
            name: "embedJSON",
            description: "Optional embed config JSON {title,description,color,thumbnailURL,footerText,footerIconURL}",
            type: forgescript_1.ArgType.Json,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.String,
    async execute(ctx, [channel, embedJSON]) {
        const cats = await database_1.TicketsDatabase.getCategoriesByGuild(ctx.guild.id);
        if (!cats.length)
            return this.customError("No categories configured. Create a category first with $createCategory.");
        const panelEmbedDef = embedJSON ? embedJSON : null;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(panelEmbedDef?.title ?? "🎫 Support Tickets")
            .setDescription(panelEmbedDef?.description ?? "Select a category below to open a support ticket.")
            .setColor(panelEmbedDef?.color ?? 0x5865f2);
        if (panelEmbedDef?.footerText)
            embed.setFooter({ text: panelEmbedDef.footerText, iconURL: panelEmbedDef.footerIconURL });
        if (panelEmbedDef?.thumbnailURL)
            embed.setThumbnail(panelEmbedDef.thumbnailURL);
        const buttons = [];
        const rows = [];
        let currentRow = new discord_js_1.ActionRowBuilder();
        for (const cat of cats.filter((c) => c.enabled).slice(0, 25)) {
            const btn = new discord_js_1.ButtonBuilder()
                .setCustomId((0, TicketsInteractionHandler_1.encodeCID)(TicketsInteractionHandler_1.CID.PANEL_OPEN, cat.id))
                .setLabel(cat.name)
                .setStyle(discord_js_1.ButtonStyle.Primary);
            if (cat.emoji)
                btn.setEmoji(cat.emoji);
            currentRow.addComponents(btn);
            buttons.push({ categoryID: cat.id, label: cat.name, emoji: cat.emoji, style: "primary" });
            if (currentRow.components.length === 5) {
                rows.push(currentRow);
                currentRow = new discord_js_1.ActionRowBuilder();
            }
        }
        if (currentRow.components.length > 0)
            rows.push(currentRow);
        const ch = channel;
        const msg = await ch.send({ embeds: [embed], components: rows.map((r) => r.toJSON()) });
        const panel = new entities_1.TicketPanel({
            guildID: ctx.guild.id,
            channelID: channel.id,
            messageID: msg.id,
            embed: panelEmbedDef ?? undefined,
            buttons,
        });
        await database_1.TicketsDatabase.savePanel(panel);
        return this.success(panel.id);
    },
});
//# sourceMappingURL=createPanel.js.map