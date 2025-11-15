let { Owner } = require("../../config/config.json");
let {
    InteractionType,
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
} = require("discord.js");
let Bal = require("../../Schema/balance.js");
let shop = require("../../Schema/shop.js");
let list = require("../../Schema/list.js");
let Price = require("../../Schema/price.js");
let order = require("../../Schema/order.js");
let { MessageEmbed } = require("discord.js");
let ctesti = require("../../Schema/AllSettingChannel.js");
let client = require('../../index.js');
let { Dolar, Crown, Yes, Loading, WL, ARROW, COLOR, imageUrl } = require("../../config/configEmoji.json");

module.exports = {
    name: "Buying Item Of Menu"
};

client.on("interactionCreate", async (interaction) => {
    if (interaction.customId === "sammuh") {
        if (interaction.type !== InteractionType.ModalSubmit) return;
        try {
            let howmuch = interaction.fields.getTextInputValue("summah");
            let item = interaction.fields.getTextInputValue("kontol");
            let user = interaction.user;
            let userars = await client.users.fetch(Owner);
            let member = interaction.guild.members.cache.get(user.id);

            let chaneltesti = await ctesti
                .findOne({})
                .then((d) => {
                    return d.ChanelTesti;
                })
                .catch((e) => console.error(e));
                
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
                content: "Use a Positif Number!",
                ephemeral: true,
            });

            if (isNaN(howmuch)) return interaction.reply({
                content: "Only Use Number For Amount",
                ephemeral: true,
            });

            if (howmuch < Number(getCode.minimum)) return interaction.reply({
                content: `**Minimum Order Of Product Is ${getCode.minimum}**`,
                ephemeral: true
            })

            let row6050 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Set GrowID")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("<:Bot:1170169208273903677>")
                    .setCustomId("growid23")
            );

            let getBal = await Bal.findOne({ DiscordID: user.id })
                .then((d) => {
                    return d;
                })
                .catch((e) => console.error(e));

            if (!getBal) return interaction.reply({
                content: "Register First Before Using This Button!",
                components: [row6050],
                ephemeral: true,
            });

            let pricao = await Price.findOne({ code: item })
                .then((d) => {
                    return d;
                })
                .catch((e) => console.error(e));

            let data = await shop
                .find({ code: item })
                .then((res) => {
                    return res;
                })
                .catch(console.error);

            if (data.length == 0) return interaction.reply({
                content: "No Stock Yet",
                ephemeral: true
            });

            if (Number(data.length) < Number(howmuch)) return interaction.reply({
                content: "Not That Much Stock",
                ephemeral: true
            });

            if (!pricao) return interaction.reply({
                content: `Tag Owner To Set Price For **${item}**`,
                ephemeral: true
            });

            let price = pricao.price;
            let wallet = getBal.Balance;
            let oprice = Number(price) * Number(howmuch);
            let testichannel = interaction.guild.channels.cache.get(chaneltesti);

            if (wallet < oprice) return interaction.reply({
                content: "Ur Money Is Less, The Price Is " + oprice,
                ephemeral: true,
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
                .setDescription(`${ARROW} Buyer: **<@${user.id}>**\n${ARROW} Produk: **${getCode.name}**\n${ARROW} Jumlah: **${howmuch}**\n${ARROW} Total Price: **${oprice} ${WL}**\n**Thanks For Purchasing Our Product**`)
                .setColor(COLOR)
                .setTimestamp()
                .setImage(imageUrl);

            await Bal.updateOne(
                { DiscordID: user.id },
                { $inc: { Balance: -Number(oprice) } }
            );

            let sending = "";
            await interaction.reply({
                content: `**Processing Your Order ${Loading}**`,
                ephemeral: true,
            });
            try {
                if (!getCode.type.includes("script")) {
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

                if (!member.roles.cache.some((r) => r.id == getCode.role)) {
                    member.roles.add(getCode.role);
                }

                let orderan = await order
                    .findOne({})
                    .then((d) => {
                        return d?.Order;
                    })
                    .catch((e) => console.error(e));

                user.send({
                    content: `# Order Number : ${orderan}\n*This Is ${interaction.user.username} Order*`,
                    files: [
                        {
                            attachment: Buffer.from(sending),
                            name: `${interaction.user.username} Order.txt`,
                        },
                    ],
                });

                await interaction.followUp({
                    content: `**Check Your Direct Message For Your Order! ${Yes}**`,
                    ephemeral: true
                });

                userars.send({
                    content: "This Is <@" + interaction.user.id + "> Order",
                    files: [
                        {
                            attachment: Buffer.from(sending),
                            name: `${interaction.user.username} Order.txt`,
                        },
                    ],
                });

                await testichannel.send({ embeds: [testi] });
            } catch (erorr) {
                await interaction.followUp({
                    content: "Did you turn off DM? if Yes u can dm Owner, if he is good maybe will be given your order :):",
                    ephemeral: true
                });

                userars.send({
                    content: "This Is <@" + interaction.user.id + "> Order",
                    files: [
                        {
                            attachment: Buffer.from(sending),
                            name: `${interaction.user.username} Order.txt`,
                        },
                    ],
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
})