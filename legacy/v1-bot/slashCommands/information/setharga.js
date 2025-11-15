let {
    EmbedBuilder,
    Client,
    CommandInteraction,
    ApplicationCommandOptionType,
} = require("discord.js");
let list = require("../../Schema/list.js");
let Price = require("../../Schema/price.js");
module.exports = {
    name: 'setprice',
    description: "Set Price For Product",
    accessableby: "admin",
    options: [
        {
            name: "code",
            description: "Code Of Product",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "price",
            description: "Howmany Price To Add In Product?",
            type: ApplicationCommandOptionType.Number,
            required: true
        }
    ],
    /** 
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        let wut = interaction.options.getString("code");
        let price = interaction.options.getNumber("price");
        let getCode = await list
            .findOne({ code: wut })
            .then((res) => {
                return res;
            })
            .catch(console.error);

        if (!getCode) return interaction.reply({ content: "Code Not Found", ephemeral: true });

        let has = parseFloat(price);

        if (!isNaN(price)) {
            await Price.findOneAndUpdate(
                { code: wut },
                { price: has },
                { upsert: true, new: true }
            )
                .then(async (res) => {
                    await interaction.reply({
                        content: "Successfully Set " + res.code + " Price With Price " + res.price, ephemeral: true
                    });
                })
                .catch(console.error);
        } else {
            interaction.reply({ content: `Number No Falid!`, ephemeral: true });
        }
    }
}