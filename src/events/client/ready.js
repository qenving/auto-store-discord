let client = require('../../index.js');
let {
    ActivityType,
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder,
    MessageEmbed,
    ButtonBuilder,
} = require("discord.js");
let shop = require("../../Schema/shop.js");
let mt = require("../../Schema/mt.js");
let Price = require("../../Schema/price.js");
let list = require("../../Schema/list.js");
let realtime = require("../../Schema/channelrealtime.js");
let { Crown, Dolar, Warning, Yes, No, WL, imageUrl, COLOR, Watermark } = require("../../config/configEmoji.json");

module.exports = {
    name: "ready"
};

client.once("ready", async (client) => {
    try {
        let activities = [`${client.user.username} Online!`, `AutoSend Bot V4.1 By Tama Store`, `/help to see commands`], i = 0;
        setInterval(async () => {
            client.user.setPresence({
                activities: [{ name: `${activities[i++ % activities.length]}`, type: ActivityType.Custom }],
                status: "dnd",
            });
            
            let MT = await mt
                .findOne({})
                .then((d) => {
                    return d?.mt;
                })
                .catch(console.error);

            let check = await realtime
                .findOne({})
                .then((res) => {
                    return res;
                })
                .catch(console.error);

            let getCodes = await list
                .find({})
                .then((res) => {
                    return res;
                })
                .catch(console.error);
            if (getCodes.length < 1) return;
            let text = "";
            for (let i = 0; i < getCodes.length; i++) {
                let code = getCodes[i];
                let stock = await shop
                    .find({ code: code.code })
                    .then((res) => {
                        return res;
                    })
                    .catch(console.error);
                let price = await Price.findOne({ code: code.code })
                    .then((res) => {
                        return res;
                    })
                    .catch(console.error);

                let haveStock = stock.length > 0;
                let emojis = haveStock ? Yes : No;
                let stockMessage = haveStock ? `${stock.length}` : "";
                text += `**--------------------------------------------**
                    ${Crown} **${code.name}** ${Crown}
                  - Code: **${code.code}**
                  - Stock: **${stockMessage} ${emojis}**
                  - Price: **${price ? new Intl.NumberFormat().format(price.price) : "Not Set Yet"} ${WL}**
                  `.replace(/ {2,}/g, "");
            }
            let polas = new Date();
            let format = `<t:${Math.floor(polas.getTime() / 1000)}:R>`;
            let texts =
                `**--------------------------------------------**\n` +
                `${Warning} **HOW TO BUY** ${Warning}\n` +
                `- Click Button **Set GrowID**\n` +
                `- Click Button **Balance** To Check Your GrowID\n` +
                `- Click Button **Deposit** To See World Deposit\n` +
                `- Click Button **Buy** For Buying The Items`;

            let embed = new EmbedBuilder()
                .setTitle(`${Crown} PRODUCT LIST ${Crown}`)
                .setDescription(`**Last Update: ${format}**\n${text}${texts}`)
                .setImage(imageUrl)
                .setColor(COLOR);

            let row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Buy")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("<:emoji_72:1210797404731740181>")
                    .setCustomId("Howmanys"),
                new ButtonBuilder()
                    .setLabel("Set GrowID")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("<a:MagicBook:1248244747307319406>")
                    .setCustomId("growid23"),
                new ButtonBuilder()
                    .setLabel("Balance")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("<a:faq:1174339877333119068>")
                    .setCustomId("balance1"),
                new ButtonBuilder()
                    .setLabel("Deposit")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("<a:globekyy:1018386276480716800>")
                    .setCustomId("deposit"),
            );

            let rowmt = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Buy")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("<:emoji_72:1210797404731740181>")
                    .setDisabled(true)
                    .setCustomId("Howmanys"),
                new ButtonBuilder()
                    .setLabel("Set GrowID")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("<a:MagicBook:1248244747307319406>")
                    .setDisabled(true)
                    .setCustomId("growid23"),
                new ButtonBuilder()
                    .setLabel("Balance")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("<a:faq:1174339877333119068>")
                    .setDisabled(true)
                    .setCustomId("balance1"),
                new ButtonBuilder()
                    .setLabel("Deposit")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("<a:globekyy:1018386276480716800>")
                    .setDisabled(true)
                    .setCustomId("deposit"),
            );

            if (check) {
                let channel = await client.channels.fetch(check.Channel);
                let messageid = await channel.messages.fetch(check.MessageID);
                if (channel && messageid) {
                    if (MT) {
                        messageid.edit({
                            content: `**${Watermark}**`,
                            embeds: [embed],
                            components: [rowmt]
                        });
                    } else {
                        messageid.edit({
                            content: `**${Watermark}**`,
                            embeds: [embed],
                            components: [row]
                        });
                    }
                }
            }
        }, 20000);
        console.log("----------------------------------------".white);
        console.log(`[READY] ${client.user.tag} is up and ready to go.`.bold);
        console.log("----------------------------------------".white);
    } catch (err) {
        console.error(err);
    }
})