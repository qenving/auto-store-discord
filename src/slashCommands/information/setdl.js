let {
    EmbedBuilder,
    Client,
    CommandInteraction,
    ApplicationCommandOptionType,
} = require("discord.js")
let depo = require("../../Schema/depo.js");
let { Owner } = require("../../config/config.json");
let { COLOR, DL } = require("../../config/configEmoji.json");
module.exports = {
    name: 'setdl',
    description: "Set Rate DL For Payment Saweria Or Trakteer",
    accessableby: "admin",
    options: [
        {
            name: "ratedl",
            description: "This Rate DL Example 4500",
            type: ApplicationCommandOptionType.Number,
            required: true,
        }
    ],
    /** 
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        let amount = interaction.options.getNumber("ratedl");
        let total = amount / 100;
        let user = await client.users.fetch(Owner);

        if (isNaN(amount)) return interaction.reply({
            content: `Only Using Number!!`,
            ephemeral: true
        });

        await depo.findOneAndUpdate(
            {},
            { $set: { ratedl: total } },
            { upsert: true, new: true }
        )
            .then(async (res) => {
                await interaction.reply({
                    content: `Successfully Set Rate DL To **${parseFloat(amount)}**`,
                    ephemeral: true
                });

                let sendToOwner = new EmbedBuilder()
                    .setTitle("Rate DL History")
                    .setDescription(`Successfully Set Rate DL To **${parseFloat(amount)}**`)
                    .setTimestamp()
                    .setColor(COLOR);
                user.send({ embeds: [sendToOwner] });
            })
            .catch(console.error);
    }
}