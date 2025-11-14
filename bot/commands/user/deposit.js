const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const databaseProvider = require('../../../shared/database/provider/DatabaseProvider');
const paymentManager = require('../../../shared/payment/PaymentManager');
const configManager = require('../../../shared/config/ConfigManager');
const Formatter = require('../../../shared/utils/Formatter');
const logger = require('../../../shared/logger/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Deposit balance via QRIS')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Amount to deposit')
        .setRequired(true)
        .setMinValue(10000)
        .setMaxValue(10000000)
    ),

  cooldown: 10,

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const amount = interaction.options.getNumber('amount');
      const limits = configManager.getLimits();

      // Validate amount
      if (amount < limits.minDeposit) {
        return interaction.editReply({
          content: `❌ Minimum deposit is ${Formatter.formatCurrency(limits.minDeposit)}`
        });
      }

      if (amount > limits.maxDeposit) {
        return interaction.editReply({
          content: `❌ Maximum deposit is ${Formatter.formatCurrency(limits.maxDeposit)}`
        });
      }

      // Check for pending payments
      const paymentRepo = databaseProvider.getPaymentRepository();
      const pendingPayments = await paymentRepo.findByUser(interaction.user.id, { status: 'pending' });

      if (pendingPayments.length >= 2) {
        return interaction.editReply({
          content: '❌ You have too many pending payments. Please complete or wait for them to expire first.'
        });
      }

      // Ensure user exists
      const userRepo = databaseProvider.getUserRepository();
      let user = await userRepo.findByDiscordId(interaction.user.id);

      if (!user) {
        user = await userRepo.create({
          discordId: interaction.user.id,
          username: interaction.user.username,
          discriminator: interaction.user.discriminator,
          avatar: interaction.user.avatar,
          balance: 0
        });
      }

      // Create payment
      const paymentData = {
        discordId: interaction.user.id,
        username: interaction.user.username,
        amount: amount,
        email: `${interaction.user.id}@discord.user`
      };

      const payment = await paymentManager.createPayment(paymentData);

      // Save to database
      const paymentConfig = configManager.getPaymentConfig();
      const expiryMinutes = paymentConfig.autoExpireMinutes || 15;

      await paymentRepo.create({
        discordId: interaction.user.id,
        invoiceId: payment.invoiceId,
        amount: amount,
        status: 'pending',
        provider: payment.provider,
        qrUrl: payment.qrUrl,
        paymentUrl: payment.paymentUrl,
        expiredAt: payment.expiredAt,
        metadata: payment.rawResponse
      });

      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('💳 Deposit Request Created')
        .setDescription('Scan the QR code below to complete your payment')
        .addFields(
          { name: 'Invoice ID', value: `\`${payment.invoiceId}\``, inline: true },
          { name: 'Amount', value: Formatter.formatCurrency(amount), inline: true },
          { name: 'Status', value: '⏳ Waiting for payment', inline: true },
          { name: 'Payment Method', value: 'QRIS', inline: true },
          { name: 'Provider', value: payment.provider.toUpperCase(), inline: true },
          { name: 'Expires At', value: Formatter.formatDate(payment.expiredAt), inline: true }
        )
        .setFooter({ text: `This payment will expire in ${expiryMinutes} minutes` })
        .setTimestamp();

      if (payment.qrUrl) {
        embed.setImage(payment.qrUrl);
      }

      const replyData = { embeds: [embed] };

      if (payment.paymentUrl && !payment.qrUrl) {
        replyData.content = `Click here to pay: ${payment.paymentUrl}`;
      }

      await interaction.editReply(replyData);

      logger.payment('Deposit request created', {
        discordId: interaction.user.id,
        invoiceId: payment.invoiceId,
        amount
      });
    } catch (error) {
      logger.error('Error creating deposit', error);
      await interaction.editReply({
        content: `❌ Failed to create deposit request: ${error.message}`
      });
    }
  }
};
