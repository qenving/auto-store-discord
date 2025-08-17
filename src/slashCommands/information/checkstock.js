let {
    EmbedBuilder,
    Client,
    CommandInteraction,
    ChannelType,
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ApplicationCommandOptionType,
} = require("discord.js");
let list = require("../../Schema/list.js");
let shop = require("../../Schema/shop.js");
let { Loading, Warning, CROWN, ARROW } = require("../../config/configEmoji.json");
module.exports = {
    name: 'checkstock',
    description: "Check Stock Of Product",
    accessableby: "admin",
    options: [
        {
            name: "code",
            description: "Code Of Product",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    /** 
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        let code = interaction.options.getString("code");

        let getCodes = await list
            .findOne({ code: code })
            .then((d) => {
                return d;
            })
            .catch(console.error);

        if (!getCodes) return interaction.reply({
            content: `Product With That Code Doesn't Exist`,
            ephemeral: true
        });

        let getCode = await shop
            .find({ code: code })
            .then((res) => {
                return res;
            })
            .catch(console.error);

        if (getCode.length == 0) return interaction.reply({
            content: "No Stock Yet",
            ephemeral: true
         });

        if (getCode.length < 1) return interaction.reply({
            content: `**Not Have Stock Right Now!**`,
            ephemeral: true
        });

        await interaction.reply({
            content:`Proccesssing Your Data In Database! ${Loading}`,
            ephemeral: true
        });

        let text = "";
        for (let i = 0; i < getCode.length; i++) {
            let data = await shop
                .findOneAndDelete({ code: code })
                .then((res) => {
                    return res;
                })
                .catch(console.error);
            text += data.data + "\n";
            console.log(`[COMMANDS]`.bgMagenta.bold, `Getting Data: ${data.data}`.bgGreen.bold);
            await new shop({
                code: code,
                data: data.data,
            })
            .save()
            .catch(console.error);
        }
        
        await interaction.followUp({
            content: `**This Is Your All Stock In Code ${code}**`,
            files: [
                {
                    attachment: Buffer.from(text),
                    name: `Your_Stock.txt`,
                },
            ],
            ephemeral: true
        });
        console.log(`[COMMANDS]`.bgMagenta.bold, `Successfully Scanning Stock`.bgBlue.bold);
    }
}