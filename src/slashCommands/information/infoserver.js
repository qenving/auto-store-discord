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
module.exports = {
    name: 'uptime',
    description: "sending informasi server",
    accessableby: "admin",
    /** 
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        try {
            let Ct = Date.now();
            let UIS = Math.floor((Ct - client.startTime) / 1000);
            let hours = Math.floor(UIS / 3600);
            let minutes = Math.floor((UIS % 3600) / 60);
            let seconds = UIS % 60;
            
            let serverInfo = (
        `- Bot Has Been Running For: ${hours} Hours, ${minutes} Minutes, ${seconds} Seconds\n` +
        `- Ping: ${client.ws.ping} Ms\n`
        );

            let embeds = new EmbedBuilder()
                .setTitle("INFORMASI SERVER")
                .setDescription(serverInfo)
                .setTimestamp();

            await interaction.reply({
                content: `INFORMASI SERVER`,
                embeds: [embeds],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error fetching server information:', error);
            interaction.reply({
                content: `An error occurred while fetching server information.`,
                ephemeral: true
            });
        }
    }
}