"""Order Commands - View Order History"""

import discord
from discord import app_commands
from discord.ext import commands
from loguru import logger
from typing import Optional

from src.core.database import get_db
from src.shared.services import OrderService, UserService
from src.shared.models.sql_models import OrderStatus


class OrderCommands(commands.Cog):
    """Order-related commands"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="orders", description="Lihat riwayat pesanan Anda")
    @app_commands.describe(limit="Jumlah pesanan yang ditampilkan (default: 10)")
    async def orders(self, interaction: discord.Interaction, limit: int = 10):
        """View order history"""
        await interaction.response.defer(ephemeral=True)

        try:
            async for session in get_db():
                user_service = UserService(session)
                order_service = OrderService(session)

                # Get or create user
                user = await user_service.get_or_create_user(
                    discord_id=str(interaction.user.id), username=interaction.user.name
                )

                # Get orders
                orders = await order_service.get_user_orders(user.id, limit=min(limit, 50))

                if not orders:
                    await interaction.followup.send(
                        "📦 Anda belum memiliki pesanan.", ephemeral=True
                    )
                    return

                # Create embed
                embed = discord.Embed(
                    title="📦 Riwayat Pesanan",
                    description=f"Total: {len(orders)} pesanan terakhir",
                    color=discord.Color.blue(),
                )

                # Status emoji mapping
                status_emoji = {
                    OrderStatus.PENDING: "⏳",
                    OrderStatus.PROCESSING: "🔄",
                    OrderStatus.COMPLETED: "✅",
                    OrderStatus.CANCELLED: "❌",
                }

                # Add orders
                for order in orders[:25]:
                    emoji = status_emoji.get(order.status, "❓")
                    items_count = len(order.items) if hasattr(order, "items") else 0

                    value_text = (
                        f"{emoji} **{order.status.value.title()}**\n"
                        f"💰 Rp {order.final_amount:,.0f}\n"
                        f"📦 {items_count} item(s)\n"
                        f"🕐 {order.created_at.strftime('%d %b %Y %H:%M')}"
                    )

                    embed.add_field(
                        name=f"Order #{order.order_number}", value=value_text, inline=False
                    )

                embed.set_footer(
                    text=f"Total pembelian: Rp {user.total_spent:,.0f} | {user.total_orders} order"
                )

                await interaction.followup.send(embed=embed, ephemeral=True)

        except Exception as e:
            logger.error(f"Error in orders command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)

    @app_commands.command(name="order", description="Lihat detail pesanan spesifik")
    @app_commands.describe(order_number="Nomor pesanan (contoh: ORD-20250116-ABCD)")
    async def order(self, interaction: discord.Interaction, order_number: str):
        """View specific order details"""
        await interaction.response.defer(ephemeral=True)

        try:
            async for session in get_db():
                user_service = UserService(session)
                order_service = OrderService(session)

                # Get or create user
                user = await user_service.get_or_create_user(
                    discord_id=str(interaction.user.id), username=interaction.user.name
                )

                # Get order
                order = await order_service.get_order_by_number(order_number.upper())

                if not order:
                    await interaction.followup.send(
                        f"❌ Pesanan '{order_number}' tidak ditemukan.", ephemeral=True
                    )
                    return

                # Check if order belongs to user
                if order.user_id != user.id:
                    await interaction.followup.send(
                        "❌ Pesanan ini bukan milik Anda.", ephemeral=True
                    )
                    return

                # Create embed
                status_colors = {
                    OrderStatus.PENDING: discord.Color.yellow(),
                    OrderStatus.PROCESSING: discord.Color.blue(),
                    OrderStatus.COMPLETED: discord.Color.green(),
                    OrderStatus.CANCELLED: discord.Color.red(),
                }

                embed = discord.Embed(
                    title=f"📦 Order #{order.order_number}",
                    description=f"Status: **{order.status.value.title()}**",
                    color=status_colors.get(order.status, discord.Color.blue()),
                )

                # Add order items
                for item in order.items:
                    embed.add_field(
                        name=f"📦 Item #{item.id}",
                        value=(
                            f"Produk ID: {item.product_id}\n"
                            f"Jumlah: {item.quantity}x\n"
                            f"Harga satuan: Rp {item.unit_price:,.0f}\n"
                            f"Total: Rp {item.total_price:,.0f}"
                        ),
                        inline=False,
                    )

                    # Show delivered content if completed
                    if order.status == OrderStatus.COMPLETED and item.delivered_content:
                        content_lines = item.delivered_content.split("\n")
                        content_text = "\n".join([f"`{line}`" for line in content_lines])
                        embed.add_field(
                            name="✅ Konten Terkirim", value=content_text, inline=False
                        )

                # Order summary
                embed.add_field(name="💰 Total", value=f"Rp {order.total_amount:,.0f}", inline=True)
                embed.add_field(
                    name="💸 Dibayar", value=f"Rp {order.final_amount:,.0f}", inline=True
                )

                embed.set_footer(
                    text=f"Dibuat pada {order.created_at.strftime('%d %b %Y %H:%M WIB')}"
                )

                await interaction.followup.send(embed=embed, ephemeral=True)

        except Exception as e:
            logger.error(f"Error in order command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)


async def setup(bot: commands.Bot):
    """Setup function to load the cog"""
    await bot.add_cog(OrderCommands(bot))
    logger.info("Order commands cog loaded")
