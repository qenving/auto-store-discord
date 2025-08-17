let { MessageEmbed, EmbedBuilder } = require('discord.js');
let client = require('../../index');
let Bal = require("../../Schema/balance.js");
let depos = require("../../Schema/depo.js");
let { WL, DL, BGL } = require("../../config/configEmoji.json");
let { ChannelDonationLog, ChannelSaweriaLog, ChannelTrakteerLog } = require("../../config/config.json");

module.exports = {
    name: "Catch Of Donation Embeds"
};

client.on("messageCreate", async (message) => {
    if (message.channel.id === ChannelSaweriaLog) {
        if (message.embeds.length > 0) {
            let title = message.embeds[0].title;
            if (title) {
                let Deposito = title.match(/Senilai (.*)/);
                let GrowIdk = title.match(/Dari (.*) Senilai/);
                let depok = await depos
                    .findOne({})
                    .then((res) => {
                        return res?.ratedl;
                    })
                    .catch(console.error());

                if (Deposito) {
                    let growkids = GrowIdk[1];
                    let growIds = growkids.toLowerCase();
                    let depo = Deposito[1].replace(/\./g, '');

                    let wallet1 = await Bal.findOne({ GrowID: growIds })
                        .then((d) => {
                            return d;
                        })
                        .catch(console.error());

                    try {
                        if (!wallet1) return message.reply(`User **${growkids}** Not Register In Database`);
                        if (!depok) return message.reply(`Owner Do Not Set Rate DL Right Now!`);

                        let totals = Math.floor(depo / depok);
                        await Bal.updateOne(
                            { GrowID: growIds },
                            { $inc: { Balance: totals, Deposit: totals } }
                        );

                        let wallets = await Bal.findOne({ GrowID: growIds })
                            .then((d) => {
                                return d.Balance;
                            })
                            .catch(console.error());

                        let recev = new Intl.NumberFormat().format(wallets);
                        let userars = await client.users.fetch(wallet1.DiscordID);
                        let embed = new EmbedBuilder()
                            .setDescription(`**${userars.username}'s** Donate **Rp.${new Intl.NumberFormat().format(depo)}**\nYour Balance Has Been Convert To **${new Intl.NumberFormat().format(totals)} ${WL}**\nNow Your Balance Is **${recev}** ${WL}`);

                        userars.send({ embeds: [embed] });
                        await message.reply(`Successfully Adding **Rp.${new Intl.NumberFormat().format(depo)}** to **${growkids}**\nYour Balance Has Been Convert To **${new Intl.NumberFormat().format(totals)} ${WL}**`);
                    } catch (error) {
                        console.error("erorr", error);
                    }
                }
            }
        }
    }

    if (message.channel.id === ChannelTrakteerLog) {
        if (message.embeds.length > 0) {
            let description = message.embeds[0].description;
            if (description) {
                let Deposite = description.match(/Senilai (.*)/);
                let Deposit = description.match(/(\w+) Mentraktir/);
                let depok = await depos
                    .findOne({})
                    .then((res) => {
                        return res?.ratedl;
                    })
                    .catch(console.error());

                if (Deposit && Deposite) {
                    let growId1 = Deposit[1];
                    let growIds = growId1.toLowerCase();
                    let depo = parseInt(Deposite[1]);

                    let wallet1 = await Bal.findOne({ GrowID: growIds })
                        .then((d) => {
                            return d;
                        });

                    try {
                        if (!wallet1) return message.reply(`User **${growId1}** Not Register In Database`);
                        if (!depok) return message.reply(`Owner Do Not Set Rate DL Right Now!`);

                        let totals = Math.floor(depo / depok);
                        await Bal.updateOne(
                            { GrowID: growIds },
                            { $inc: { Balance: totals, Deposit: totals } }
                        );

                        let wallets = await Bal.findOne({ GrowID: growIds })
                            .then((d) => {
                                return d.Balance;
                            });

                        let userars = await client.users.fetch(wallet1.DiscordID);
                        let recev = new Intl.NumberFormat().format(wallets);
                        let embed = new EmbedBuilder()
                            .setDescription(`**${userars.username}'s** Donate **Rp.${new Intl.NumberFormat().format(depo)}**\nYour Balance Has Been Convert To **${new Intl.NumberFormat().format(totals)} ${WL}**\nNow Your Balance Is **${recev}** ${WL}`);

                        userars.send({ embeds: [embed] });
                        await message.reply(`Successfully Adding **Rp.${new Intl.NumberFormat().format(depo)}** to **${growId1}**\nYour Balance Has Been Convert To **${new Intl.NumberFormat().format(totals)} ${WL}**`);
                    } catch (error) {
                        console.error("erorr", error);
                    }
                }
            }
        }
    }
    
    if (message.channel.id === ChannelDonationLog) {
        if (message.embeds.length > 0) {
            let description = message.embeds[0].description;
            if (description) {
                let GrowIDs = description.match(/GrowID: (\w+)/);
                let Deposita = description.match(/Amount: (\d+) (\w+)/);

                if (GrowIDs && Deposita) {
                    let growId = GrowIDs[1];
                    let growIds = growId.toLowerCase();
                    let depo = parseInt(Deposita[1]);
                    let item = Deposita[2];

                    let itemvalue = {
                        "WorldLock": 1,
                        "DiamondLock": 100,
                        "BlueGemLock": 10000,
                    };

                    let Lko = {
                        "WorldLock": WL,
                        "DiamondLock": DL,
                        "BlueGemLock": BGL,
                    }

                    let wallet1 = await Bal.findOne({ GrowID: growIds })
                        .then((d) => {
                            return d;
                        })
                        .catch(console.error);

                    try {
                        if (!wallet1) return message.reply("User Not Register In Database");
                        if (!itemvalue[item]) return message.reply("Unknown Item Name");

                        await Bal.updateOne(
                            { GrowID: growIds },
                            { $inc: { Balance: depo * itemvalue[item], Deposit: depo * itemvalue[item] } }
                        );

                        let wallets = await Bal.findOne({ GrowID: growIds })
                            .then((d) => {
                                return d.Balance;
                            });

                        let userars = await client.users.fetch(wallet1.DiscordID);
                        userars.send(`Successfully Adding **${depo} ${Lko[item]}** to **${growId}**\nYour New Balance Is **${wallets}** ${WL}`);
                        await message.reply(`Successfully Adding **${depo} ${Lko[item]}** to **${growId}**\nYour New Balance Is **${wallets}** ${WL}`);
                    } catch (error) {
                        console.error("erorr", error);
                    }
                }
            }
        }
    }
})