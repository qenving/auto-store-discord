const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const databaseProvider = require('../../../shared/database/provider/DatabaseProvider');
const Formatter = require('../../../shared/utils/Formatter');
const Validator = require('../../../shared/utils/Validator');
const logger = require('../../../shared/logger/Logger');
const globalEvents = require('../../../shared/utils/EventEmitter');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase a product')
    .addStringOption(option =>
      option
        .setName('product_id')
        .setDescription('Product ID to purchase')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('quantity')
        .setDescription('Quantity to purchase')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  cooldown: 5,

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const productId = interaction.options.getString('product_id');
      const quantity = interaction.options.getInteger('quantity') || 1;

      // Get repositories
      const productRepo = databaseProvider.getProductRepository();
      const stockRepo = databaseProvider.getStockRepository();
      const userRepo = databaseProvider.getUserRepository();
      const orderRepo = databaseProvider.getOrderRepository();

      // Get product
      const product = await productRepo.findById(productId);

      if (!product) {
        return interaction.editReply({ content: '❌ Product not found!' });
      }

      if (!product.isActive) {
        return interaction.editReply({ content: '❌ This product is not available!' });
      }

      // Validate quantity
      if (quantity < product.minPurchase) {
        return interaction.editReply({
          content: `❌ Minimum purchase is ${product.minPurchase}`
        });
      }

      if (quantity > product.maxPurchase) {
        return interaction.editReply({
          content: `❌ Maximum purchase is ${product.maxPurchase}`
        });
      }

      // Check stock
      const availableStock = await stockRepo.getAvailableCount(productId);

      if (availableStock < quantity) {
        return interaction.editReply({
          content: `❌ Not enough stock! Available: ${availableStock}`
        });
      }

      // Calculate total
      const totalPrice = product.price * quantity;

      // Get or create user
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

      // Check balance
      if (user.balance < totalPrice) {
        return interaction.editReply({
          content: `❌ Insufficient balance!\n\n**Need:** ${Formatter.formatCurrency(totalPrice)}\n**Your Balance:** ${Formatter.formatCurrency(user.balance)}\n**Missing:** ${Formatter.formatCurrency(totalPrice - user.balance)}\n\nUse \`/deposit\` to add balance.`
        });
      }

      // Process purchase
      const deliveryData = [];

      // Get stock items
      for (let i = 0; i < quantity; i++) {
        const stockItem = await stockRepo.getOneStock(productId);

        if (!stockItem) {
          // Rollback if something goes wrong
          logger.error('Failed to get stock during purchase', null, {
            productId,
            quantity,
            index: i
          });
          return interaction.editReply({
            content: '❌ An error occurred while processing your order. Please try again.'
          });
        }

        deliveryData.push(stockItem.data);
      }

      // Deduct balance
      await userRepo.subtractBalance(
        interaction.user.id,
        totalPrice,
        `Purchase - ${product.name} x${quantity}`
      );

      // Create order
      const order = await orderRepo.create({
        discordId: interaction.user.id,
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        totalPrice: totalPrice,
        status: 'success',
        deliveryData: deliveryData
      });

      // Mark stocks as used
      // (Note: In production, this should be done in a transaction)
      const stockItems = await stockRepo.findByProduct(productId, true);
      for (let i = 0; i < quantity && i < stockItems.length; i++) {
        await stockRepo.markAsUsed(stockItems[i].id, order.id);
      }

      // Send delivery to user DM
      try {
        const deliveryEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Purchase Successful!')
          .setDescription(`Thank you for your purchase!`)
          .addFields(
            { name: 'Product', value: product.name, inline: true },
            { name: 'Quantity', value: quantity.toString(), inline: true },
            { name: 'Total Paid', value: Formatter.formatCurrency(totalPrice), inline: true },
            { name: 'Order ID', value: `\`${Formatter.formatOrderId(order.id)}\``, inline: true },
            { name: 'Remaining Balance', value: Formatter.formatCurrency(user.balance - totalPrice), inline: true }
          )
          .setFooter({ text: `Order Date: ${Formatter.formatDate(new Date())}` })
          .setTimestamp();

        // Add delivery data
        const deliveryText = deliveryData.join('\n');
        if (deliveryText.length <= 1024) {
          deliveryEmbed.addFields({
            name: '📦 Your Product(s)',
            value: `\`\`\`\n${deliveryText}\n\`\`\``
          });
        } else {
          // If too long, send as separate message
          await interaction.user.send({ embeds: [deliveryEmbed] });
          await interaction.user.send({
            content: `**📦 Your Product(s):**\n\`\`\`\n${deliveryText}\n\`\`\``
          });
        }

        if (deliveryText.length <= 1024) {
          await interaction.user.send({ embeds: [deliveryEmbed] });
        }

        logger.order('Order completed and delivered', {
          orderId: order.id,
          discordId: interaction.user.id,
          productId: product.id,
          quantity,
          totalPrice
        });

        // Emit event for integrated mode
        globalEvents.emitOrder({
          orderId: order.id,
          discordId: interaction.user.id,
          productName: product.name,
          quantity,
          totalPrice,
          status: 'success'
        });

      } catch (dmError) {
        logger.error('Failed to send DM to user', dmError, {
          orderId: order.id,
          discordId: interaction.user.id
        });

        // Still show success but warn about DM
        return interaction.editReply({
          content: `✅ Purchase successful!\n\n**Order ID:** \`${Formatter.formatOrderId(order.id)}\`\n\n⚠️ I couldn't send you a DM with your product. Please enable DMs and contact an admin with your Order ID.`
        });
      }

      // Success message in channel
      await interaction.editReply({
        content: `✅ Purchase successful! Check your DM for product delivery.\n\n**Order ID:** \`${Formatter.formatOrderId(order.id)}\`\n**Total Paid:** ${Formatter.formatCurrency(totalPrice)}`
      });

    } catch (error) {
      logger.error('Error processing purchase', error);
      await interaction.editReply({
        content: '❌ An error occurred while processing your purchase. Please try again or contact an admin.'
      });
    }
  }
};
