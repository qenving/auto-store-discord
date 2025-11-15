let {
    InteractionType,
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
} = require("discord.js");
let client = require('../../index');
let { Crown, Dolar, Wallet, Bot, Globe, Saweria, Trakteer, WL, imageUrl, COLOR, DL, ARROW } = require("../../config/configEmoji.json");
let Bal = require("../../Schema/balance.js");
let { MessageEmbed } = require("discord.js");
let depo = require("../../Schema/depo.js");
let cd = new Map();

module.exports = {
    name: "ButtonMessage"
};

client.on("interactionCreate", async (interaction) => {
    if (interaction.customId === "balance1") {
        try {
            let user = interaction.user.id;
            let row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Set GrowID")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("<:Bot:1170169208273903677>")
                    .setCustomId("growid23")
            );

            let lcd = cd.get(interaction.user.id);
            if (lcd && Date.now() < lcd) {
                let rt = Math.ceil((lcd - Date.now()) / 1000);
                return interaction.reply({
                    content: `Just Wait **${rt} Seconds** Before Using The Button Again!`,
                    ephemeral: true
                });
            }

            cd.set(interaction.user.id, Date.now() + 5000)

            let wallet1 = await Bal.findOne({ DiscordID: user })
                .then((d) => {
                    return d;
                })
                .catch((e) => console.error(e));

            if (!wallet1) return interaction.reply({
                content: "**Set Growid** First Before Use This Button!",
                components: [row],
                ephemeral: true
            });

            let username = interaction.user.username;
            let convert = parseFloat(wallet1.Balance).toFixed(1);

            let embed = new EmbedBuilder()
                .setTitle(`${Crown} ${username}'s Balance ${Crown}`)
                .setDescription(
                    `- [${Bot}] GrowID: **${wallet1.GrowIDNow}**\n` +
                    `- [${Wallet}] Balance: **${convert} ${WL}**\n` +
                    `- [${Wallet}] Total Deposit: **${wallet1.Deposit} ${WL}**`
                )
                .setImage(imageUrl)
                .setColor(COLOR);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
        }
    }
    if (interaction.customId === "deposit") {
        try {
            let user = interaction.user.id;
            let row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Set GrowID")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("<:Bot:1170169208273903677>")
                    .setCustomId("growid23")
            );

            let lcd = cd.get(interaction.user.id);
            if (lcd && Date.now() < lcd) {
                let rt = Math.ceil((lcd - Date.now()) / 1000);
                return interaction.reply({
                    content: `Just Wait **${rt} Seconds** Before Using The Button Again!`,
                    ephemeral: true
                });
            }

            cd.set(interaction.user.id, Date.now() + 5000)

            let wallet1 = await Bal.findOne({ DiscordID: user })
                .then((d) => {
                    return d;
                })
                .catch((e) => console.error(e));

            if (!wallet1) return interaction.reply({
                content: "**Set Growid** First Before Use This Button!",
                components: [row],
                ephemeral: true
            });

            let deposit = await depo
                .findOne({})
                .then((d) => {
                    return d;
                })
                .catch((e) => console.error(e));
            
            let total = deposit.ratedl * 100;

            let embed = new EmbedBuilder()
                .setTitle(`${Crown} Deposit World ${Crown}`)
                .setDescription(`- [${Globe}] World: **${deposit?.world ? deposit.world : "Not Set"}**\n- [${Crown}] Owner: **${deposit?.owner ? deposit.owner : "Not Set"}**\n- [${Bot}] Bot Name: **${deposit?.botName ? deposit.botName : "Not Set"}**${deposit?.saweria != "Not Set" ? `\n- [${Saweria}] Saweria Link: **${deposit.saweria}**` : ""}${deposit?.Trakteer != "Not Set" ? `\n- [${Trakteer}] Trakteer Link: **${deposit.Trakteer}**` : ""}${deposit?.ratedl && deposit?.saweria != "Not Set" || deposit?.Trakteer != "Not Set" ? `\n- [${DL}] Rate DL: **${new Intl.NumberFormat().format(total)}**` : ""}`)
                .setTimestamp()
                .setImage(imageUrl)
                .setColor(COLOR)
                .setFooter({
                    text: `Note: Don't Donate If Bot Isnt The World`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
        }
    }
    if (interaction.customId === "growid1") {
        if (interaction.type !== InteractionType.ModalSubmit) return;
        try {
            let id = interaction.fields.getTextInputValue("kontol");
            let correct = interaction.fields.getTextInputValue("confirm");

            let GrowID = id.toLowerCase();
            let user = interaction.user.id;

            if (!correct.includes(id)) return interaction.reply({
                content: `Can You Correctly Ser?`,
                ephemeral: true
            });

            let checkuser = await Bal
                .findOne({ DiscordID: user })
                .then((d) => {
                    return d;
                })
                .catch(console.error);

            let existingEntry = await Bal.findOne({ GrowID: GrowID })
                .then((d) => {
                    return d?.DiscordID;
                })
                .catch((e) => console.error(e));

            if (existingEntry && existingEntry !== user) return interaction.reply({
                content: `GrowID Is Already Used!!`,
                ephemeral: true
            });

            if (existingEntry) {
                if (checkuser.GrowID == GrowID) {
                    return interaction.reply({
                        content: `**GrowID Already Used By You!**`,
                        ephemeral: true
                    });
                }
            }

            await Bal.findOneAndUpdate(
                { DiscordID: user },
                { $set: { GrowID: GrowID, GrowIDNow: id } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            )
                .then(async (res) => {
                    if (!checkuser) {
                        await interaction.reply({
                            content: `Successfully Set Your GrowID to **${id}**`,
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            content: `Successfully Updated Your GrowID **${checkuser.GrowIDNow}** to **${id}**`,
                            ephemeral: true,
                        });
                    }
                });
        } catch (error) {
            console.error(error);
        }
    }
})