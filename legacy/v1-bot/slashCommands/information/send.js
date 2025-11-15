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
let { Owner } = require("../../config/config.json");
let { WL, imageUrl, COLOR, ARROW, Loading, Warning } = require("../../config/configEmoji.json");
let Bal = require("../../Schema/balance.js");
let shop = require("../../Schema/shop.js");
let list = require("../../Schema/list.js");
let Price = require("../../Schema/price.js");
let order = require("../../Schema/order.js");
let mt = require("../../Schema/mt.js");
let { MessageEmbed } = require("discord.js");
let ctesti = require("../../Schema/AllSettingChannel.js");

module.exports = {
    name: 'send',
    description: "sending item product",
    accessableby: "admin",
    options: [
        {
            name: "user",
            description: "Tag User Do You Want To Send Product!",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "code",
            description: "Code Of Product",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "amount",
            description: "Howmuch Do You Want To Sell?",
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
        let item = interaction.options.getString("code");
        let howmuch = interaction.options.getNumber("amount");
        let usertosend = interaction.options.getUser("user");
        let usertosender = usertosend.id;
        let user = interaction.user;
        let userars = await client.users.fetch(Owner);
        let usertosends = await client.users.fetch(usertosender);
        let member = interaction.guild.members.cache.get(usertosender);

        let MT = await mt
            .findOne({})
            .then((d) => {
                return d?.mt;
            })
            .catch(console.error);

        if (MT) return interaction.reply({
            content: `Bot In Mode Maintenance`,
            ephemeral: true
        });

        let chaneltesti = await ctesti
            .findOne({})
            .then((d) => {
                return d.ChanelTesti;
            })
            .catch((e) => console.error(e));

        if (!chaneltesti) return interaction.reply({
            content: "Channel Testimoni Not Set Now!!!!",
            ephemeral: true,
        });

        let getCode = await list
            .findOne({ code: item })
            .then((res) => {
                return res;
            })
            .catch(console.error);

        if (!getCode) return interaction.reply({
            content: "Code Not Found", 
            ephemeral: true
        });

        if (howmuch < 1) return interaction.reply({
            content: "Use a positif number!",
            ephemeral: true,
        });

        if (isNaN(howmuch))
            return interaction.reply({
                content: "Only Use Number For Amount",
                ephemeral: true,
            });

        let getBal = await Bal.findOne({ DiscordID: user.id })
            .then((d) => {
                //console.log(d);
                return d;
            })
            .catch((e) => console.error(e));

        if (!getBal)return interaction.reply({
            content: "Register First Before Using This Command!",
            ephemeral: true
        });

        let prices = await Price.findOne({ code: item })
            .then((d) => {
                return d?.price;
            })
            .catch((e) => console.error(e));

        if (!prices) return interaction.reply({
            content: "Tag Owner To Set Price For " + item,
            ephemeral: true,
        });

        let data = await shop
            .find({ code: item })
            .then((res) => {
                return res;
            })
            .catch(console.error);

        if (data.length == 0) return interaction.reply({
            content: "No Stock Yet",
            ephemeral: true,
        });

        if (Number(data.length) < Number(howmuch)) return interaction.reply({
            content: "Not That Much Stock",
            ephemeral: true,
        });

        let price = Number(prices) * Number(howmuch);

        let typo = await list
            .findOne({ code: item })
            .then((d) => {
                return d?.type
            })
            .catch(console.error);

        let Ytta = await list
            .findOne({ code: item })
            .then((res) => {
                return res?.role;
            })
            .catch(console.error);

        let sending = "";
        await interaction.reply({
            content: `Proccessing Your Order ${Loading}`,
            ephemeral: true,
        });
        if (!typo.includes("script")) {
            for (let i = 0; i < howmuch; i++) {
                let send = await shop
                    .findOneAndDelete({ code: item })
                    .then((res) => {
                        return res;
                    })
                    .catch(console.error);
                sending += send.data + "\n";
            }
        } else {
            let send = await shop
                .findOne({ code: item })
                .then((res) => {
                    return res;
                })
                .catch(console.error);
            sending += send.data;
        }
        try {
            let itemName = await list
                .findOne({ code: item })
                .then((res) => {
                    return res?.name;
                })
                .catch(console.error);

            let doneBuy = new EmbedBuilder()
                .setTitle(`${Warning} Sending Item Successfull ${Warning}`)
                .setDescription(
                    `${ARROW} Sender: <@${interaction.user.id}>\n` +
                    `${ARROW} Buyer: <@${usertosender}>\n` +
                    `${ARROW} Product: **${itemName}**\n` +
                    `${ARROW} Code: **${item}**\n` +
                    `${ARROW} Total: **${howmuch}**\n` +
                    `${ARROW} Total Price: **${price}** ${WL}\n`
                )
                .setTimestamp()
                .setFooter({
                    text: `No Reps , No Waranty`,
                    iconURL: client.user.displayAvatarURL({ dynamic: true }),
                });

            usertosends.send({
                content: `This Is ${usertosend} Order\n# NO REPS NO WARRANTY`,
                files: [
                    {
                        attachment: Buffer.from(sending),
                        name: `${usertosend.username} Order.txt`,
                    },
                ],
                embeds: [doneBuy],
            });

            userars.send({
                content: "This Is <@" + usertosender + "> Order",
                files: [
                    {
                        attachment: Buffer.from(sending),
                        name: `${usertosend.username} Order.txt`,
                    },
                ],
            });

            if (!member.roles.cache.some((r) => r.id == Ytta)) {
                member.roles.add(Ytta);
            }

            await interaction.followUp({
                content: `Successffully Send To Costumer!`,
                ephemeral: true
            });

            let orderN = await order
                .findOneAndUpdate(
                    {},
                    { $inc: { Order: 1 } },
                    { upsert: true, new: true }
                )
                .then((d) => {
                    return d?.Order;
                })
                .catch(console.error);
            if (!orderN) orderN = 1;
            let testi = new EmbedBuilder()
                .setTitle("#Order Number: " + orderN)
                .setDescription(
                    ARROW +
                    "Sender: **<@" +
                    user.id +
                    ">**\n" +
                    ARROW +
                    "Buyer: **<@" +
                    usertosender +
                    ">**\n" +
                    ARROW +
                    "Product: **" +
                    (itemName || "IDK Name") +
                    "**\n" +
                    ARROW +
                    "Jumlah: **" +
                    howmuch +
                    "**\n" +
                    ARROW +
                    "Total Price: **" +
                    price +
                    WL +
                    " **\n**Thanks For Purchasing Our Product**"
                )
                .setColor(COLOR)
                .setTimestamp()
                .setImage(imageUrl);

            let ch = interaction.guild.channels.cache.get(chaneltesti);

            await ch.send({ embeds: [testi] });
        } catch (erorr) {
            interaction.followUp({
                content: "Did you turn off DM? if Yes u can dm Owner, if he is good maybe will be given your order :):",
                ephemeral: true,
            });
            userars.send({
                content: "This Is <@" + usertosender + "> Order",
                files: [
                    {
                        attachment: Buffer.from(sending),
                        name: `${usertosend.username} Order.txt`,
                    },
                ],
            });
        }
    }
}