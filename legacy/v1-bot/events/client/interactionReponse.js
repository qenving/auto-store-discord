let {
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
let client = require('../../index');
let Bal = require("../../Schema/balance.js");
let ctesti = require("../../Schema/AllSettingChannel.js");
let cd = new Map();
let { Bot } = require("../../config/configEmoji.json");
module.exports = {
    name: "Button Menu"
};

client.on("interactionCreate", async (interaction) => {
    let Code = new ModalBuilder()
        .setCustomId("sammuh")
        .setTitle("BUYING PRODUCT");

    let Codes = new TextInputBuilder()
        .setCustomId("kontol")
        .setLabel("Code Of Products")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(10)
        .setMinLength(1)
        .setPlaceholder("Input Code Of Products Like You!")
        .setRequired(true);
    let row1 = new ActionRowBuilder().addComponents(Codes);

    let Amount = new TextInputBuilder()
        .setCustomId("summah")
        .setLabel("Amount")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(3)
        .setMinLength(1)
        .setPlaceholder("Howmany You Want To Buy?")
        .setValue("1")
        .setRequired(true);
    let row2 = new ActionRowBuilder().addComponents(Amount);

    let GrowID = new ModalBuilder()
        .setCustomId("growid1")
        .setTitle("SET GROWID");

    let Growids = new TextInputBuilder()
        .setCustomId("kontol")
        .setLabel("Input Your GrowID")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(50)
        .setMinLength(2)
        .setPlaceholder("Input Your GrowID In Here And Make Sure It's Correct")
        .setRequired(true);
    let row4 = new ActionRowBuilder().addComponents(Growids);

    let Confirm = new TextInputBuilder()
        .setCustomId("confirm")
        .setLabel("Confirm Your GrowID")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(50)
        .setMinLength(2)
        .setPlaceholder("Input Same Like Above!")
        .setRequired(true);
    let row5 = new ActionRowBuilder().addComponents(Confirm);

    GrowID.addComponents(row4, row5);
    Code.addComponents(row1, row2);

    if (interaction.customId === "Howmanys") {
        try {
            let getBal = await Bal.findOne({ DiscordID: interaction.user.id })
                .then((d) => {
                    return d;
                })
                .catch((e) => console.error(e));

            let row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Set GrowID")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(Bot)
                    .setCustomId("growid23")
            );

            let chaneltesti = await ctesti
                .findOne({})
                .then((d) => {
                    return d.ChanelTesti;
                })
                .catch((e) => console.error(e));

            if (!chaneltesti) return interaction.reply({
                content: "Tag Owner For Setting Channel Testimoni Now!!!!",
                ephemeral: true,
            });

            if (!getBal) return interaction.reply({
                content: "**Set Growid** First Before Using This Button!",
                components: [row],
                ephemeral: true
            });

            let lcd = cd.get(interaction.user.id);
            if (lcd && Date.now() < lcd) {
                let rt = Math.ceil((lcd - Date.now()) / 1000);
                return interaction.reply({
                    content: `Just Wait **${rt} Seconds** Before Using The Button Again!`,
                    ephemeral: true
                });
            }

            cd.set(interaction.user.id, Date.now() + 10000)

            await interaction.showModal(Code);
        } catch (error) {
            console.error(error);
        }
    }
    if (interaction.customId === "growid23") {
        try {
            let lcd = cd.get(interaction.user.id);
            if (lcd && Date.now() < lcd) {
                let rt = Math.ceil((lcd - Date.now()) / 1000);
                return interaction.reply({
                    content: `Just Wait **${rt} Seconds** Before Using The Button Again!`,
                    ephemeral: true
                });
            }

            cd.set(interaction.user.id, Date.now() + 10000)

            await interaction.showModal(GrowID);
        } catch (error) {
            console.error(error);
        }
    }
})