const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const databaseProvider = require('../../../shared/database/provider/DatabaseProvider');
const Formatter = require('../../../shared/utils/Formatter');
const logger = require('../../../shared/logger/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Manage user balance')
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Check your balance')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add balance to a user (Admin only)')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to add balance to')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option
            .setName('amount')
            .setDescription('Amount to add')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for adding balance')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove balance from a user (Admin only)')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to remove balance from')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option
            .setName('amount')
            .setDescription('Amount to remove')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for removing balance')
        )
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'check') {
      await this.checkBalance(interaction);
    } else if (subcommand === 'add') {
      await this.addBalance(interaction);
    } else if (subcommand === 'remove') {
      await this.removeBalance(interaction);
    }
  },

  async checkBalance(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const userRepo = databaseProvider.getUserRepository();
      let user = await userRepo.findByDiscordId(interaction.user.id);

      if (!user) {
        // Create user if not exists
        user = await userRepo.create({
          discordId: interaction.user.id,
          username: interaction.user.username,
          discriminator: interaction.user.discriminator,
          avatar: interaction.user.avatar,
          balance: 0
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💰 Your Balance')
        .addFields(
          { name: 'Current Balance', value: Formatter.formatCurrency(user.balance), inline: true },
          { name: 'Total Spent', value: Formatter.formatCurrency(user.totalSpent), inline: true },
          { name: 'Total Orders', value: user.totalOrders.toString(), inline: true }
        )
        .setFooter({ text: `User ID: ${interaction.user.id}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error checking balance', error);
      await interaction.editReply({ content: 'Failed to check balance. Please try again.' });
    }
  },

  async addBalance(interaction) {
    try {
      // Check if user has admin permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ You do not have permission to use this command.',
          ephemeral: true
        });
      }

      await interaction.deferReply();

      const targetUser = interaction.options.getUser('user');
      const amount = interaction.options.getNumber('amount');
      const reason = interaction.options.getString('reason') || 'Admin add balance';

      const userRepo = databaseProvider.getUserRepository();
      let user = await userRepo.findByDiscordId(targetUser.id);

      if (!user) {
        user = await userRepo.create({
          discordId: targetUser.id,
          username: targetUser.username,
          discriminator: targetUser.discriminator,
          avatar: targetUser.avatar,
          balance: 0
        });
      }

      const result = await userRepo.addBalance(targetUser.id, amount, reason);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Balance Added Successfully')
        .addFields(
          { name: 'User', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Amount', value: Formatter.formatCurrency(amount), inline: true },
          { name: 'Previous Balance', value: Formatter.formatCurrency(result.balanceBefore), inline: true },
          { name: 'New Balance', value: Formatter.formatCurrency(result.balanceAfter), inline: true },
          { name: 'Reason', value: reason }
        )
        .setFooter({ text: `Admin: ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Try to DM the user
      try {
        await targetUser.send({
          embeds: [
            new EmbedBuilder()
              .setColor('#00FF00')
              .setTitle('💰 Balance Added')
              .setDescription(`Your balance has been increased by **${Formatter.formatCurrency(amount)}**`)
              .addFields(
                { name: 'New Balance', value: Formatter.formatCurrency(result.balanceAfter) },
                { name: 'Reason', value: reason }
              )
              .setTimestamp()
          ]
        });
      } catch (e) {
        // User has DMs disabled
      }
    } catch (error) {
      logger.error('Error adding balance', error);
      await interaction.editReply({ content: 'Failed to add balance. Please try again.' });
    }
  },

  async removeBalance(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: '❌ You do not have permission to use this command.',
          ephemeral: true
        });
      }

      await interaction.deferReply();

      const targetUser = interaction.options.getUser('user');
      const amount = interaction.options.getNumber('amount');
      const reason = interaction.options.getString('reason') || 'Admin remove balance';

      const userRepo = databaseProvider.getUserRepository();
      const user = await userRepo.findByDiscordId(targetUser.id);

      if (!user) {
        return interaction.editReply({ content: '❌ User not found in database.' });
      }

      if (user.balance < amount) {
        return interaction.editReply({ content: `❌ User only has ${Formatter.formatCurrency(user.balance)}` });
      }

      const result = await userRepo.subtractBalance(targetUser.id, amount, reason);

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('✅ Balance Removed Successfully')
        .addFields(
          { name: 'User', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Amount', value: Formatter.formatCurrency(amount), inline: true },
          { name: 'Previous Balance', value: Formatter.formatCurrency(result.balanceBefore), inline: true },
          { name: 'New Balance', value: Formatter.formatCurrency(result.balanceAfter), inline: true },
          { name: 'Reason', value: reason }
        )
        .setFooter({ text: `Admin: ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      try {
        await targetUser.send({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('💸 Balance Deducted')
              .setDescription(`Your balance has been decreased by **${Formatter.formatCurrency(amount)}**`)
              .addFields(
                { name: 'New Balance', value: Formatter.formatCurrency(result.balanceAfter) },
                { name: 'Reason', value: reason }
              )
              .setTimestamp()
          ]
        });
      } catch (e) {
        // User has DMs disabled
      }
    } catch (error) {
      logger.error('Error removing balance', error);
      await interaction.editReply({ content: 'Failed to remove balance. Please try again.' });
    }
  }
};
