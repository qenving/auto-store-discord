"""Shop Commands - Browse and Buy Products"""

import discord
from discord import app_commands
from discord.ext import commands
from loguru import logger
from typing import Optional

from src.core.database import get_db
from src.shared.services import ProductService, UserService, OrderService
from src.shared.schemas.order_schemas import OrderItemCreate


class ShopCommands(commands.Cog):
    """Shop-related commands"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="shop", description="Lihat daftar produk yang tersedia")
    async def shop(self, interaction: discord.Interaction, kategori: Optional[str] = None):
        """View available products"""
        await interaction.response.defer()

        try:
            async for session in get_db():
                product_service = ProductService(session)

                # Get products
                if kategori:
                    products = await product_service.get_products_by_category(kategori)
                else:
                    products = await product_service.get_all_products()

                if not products:
                    await interaction.followup.send("❌ Tidak ada produk yang tersedia saat ini.")
                    return

                # Create embed
                embed = discord.Embed(
                    title=f"🛒 Daftar Produk {f'- {kategori}' if kategori else ''}",
                    description=f"Total: {len(products)} produk",
                    color=discord.Color.purple(),
                )

                # Add products (max 25 fields)
                for product in products[:25]:
                    price = product.discount_price if product.discount_price else product.price
                    original_price_text = (
                        f" ~~Rp {product.price:,.0f}~~" if product.discount_price else ""
                    )

                    stock_emoji = "✅" if product.available_stock > 0 else "❌"
                    stock_text = (
                        f"{product.available_stock} tersedia"
                        if product.available_stock > 0
                        else "Stok habis"
                    )

                    embed.add_field(
                        name=f"{stock_emoji} {product.name} ({product.code})",
                        value=(
                            f"💰 **Rp {price:,.0f}**{original_price_text}\n"
                            f"📦 {stock_text}\n"
                            f"_{product.description[:50] if product.description else 'Tidak ada deskripsi'}_"
                        ),
                        inline=False,
                    )

                if len(products) > 25:
                    embed.set_footer(text=f"Menampilkan 25 dari {len(products)} produk")

                await interaction.followup.send(embed=embed)

        except Exception as e:
            logger.error(f"Error in shop command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}")

    @app_commands.command(name="buy", description="Beli produk")
    @app_commands.describe(kode_produk="Kode produk yang ingin dibeli", jumlah="Jumlah yang ingin dibeli")
    async def buy(self, interaction: discord.Interaction, kode_produk: str, jumlah: int = 1):
        """Buy a product"""
        await interaction.response.defer(ephemeral=True)

        try:
            async for session in get_db():
                product_service = ProductService(session)
                user_service = UserService(session)
                order_service = OrderService(session)

                # Get or create user
                user = await user_service.get_or_create_user(
                    discord_id=str(interaction.user.id), username=interaction.user.name
                )

                # Check if banned
                if user.is_banned:
                    await interaction.followup.send("❌ Akun Anda telah dibanned.", ephemeral=True)
                    return

                # Get product
                product = await product_service.get_product_by_code(kode_produk.upper())
                if not product:
                    await interaction.followup.send(
                        f"❌ Produk dengan kode '{kode_produk}' tidak ditemukan.", ephemeral=True
                    )
                    return

                # Check availability
                available = await product_service.check_availability(product.id, jumlah)
                if not available:
                    await interaction.followup.send(
                        f"❌ Stok tidak cukup. Tersedia: {product.available_stock}, Diminta: {jumlah}",
                        ephemeral=True,
                    )
                    return

                # Calculate price
                unit_price = product.discount_price if product.discount_price else product.price
                total_price = unit_price * jumlah

                # Check balance
                if user.balance < total_price:
                    await interaction.followup.send(
                        f"❌ Saldo tidak cukup!\n"
                        f"Saldo Anda: Rp {user.balance:,.0f}\n"
                        f"Dibutuhkan: Rp {total_price:,.0f}\n"
                        f"Kurang: Rp {total_price - user.balance:,.0f}",
                        ephemeral=True,
                    )
                    return

                # Create order
                order_items = [
                    OrderItemCreate(
                        product_id=product.id,
                        quantity=jumlah,
                        unit_price=unit_price,
                        total_price=total_price,
                    )
                ]

                order = await order_service.create_order(
                    discord_id=str(interaction.user.id), items=order_items
                )

                # Complete order immediately
                order = await order_service.complete_order(order.id)

                # Get delivered content
                content = await order_service.get_order_items_content(order.id)

                # Send confirmation
                embed = discord.Embed(
                    title="✅ Pembelian Berhasil!",
                    description=f"Order #{order.order_number}",
                    color=discord.Color.green(),
                )

                embed.add_field(name="Produk", value=product.name, inline=True)
                embed.add_field(name="Jumlah", value=f"{jumlah}x", inline=True)
                embed.add_field(name="Total", value=f"Rp {total_price:,.0f}", inline=True)

                # Add delivered content
                for product_name, items in content.items():
                    content_text = "\n".join([f"`{item}`" for item in items])
                    embed.add_field(name=f"📦 {product_name}", value=content_text, inline=False)

                # Show remaining balance
                updated_user = await user_service.get_user_by_discord_id(str(interaction.user.id))
                if updated_user:
                    embed.add_field(
                        name="💰 Saldo Tersisa", value=f"Rp {updated_user.balance:,.0f}", inline=False
                    )

                embed.set_footer(text="Terima kasih atas pembelian Anda!")

                await interaction.followup.send(embed=embed, ephemeral=True)

                logger.success(
                    f"Purchase completed: {interaction.user.name} bought {jumlah}x {product.code} for Rp{total_price:,.0f}"
                )

        except Exception as e:
            logger.error(f"Error in buy command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)

    @app_commands.command(name="search", description="Cari produk")
    @app_commands.describe(kata_kunci="Kata kunci pencarian")
    async def search(self, interaction: discord.Interaction, kata_kunci: str):
        """Search products"""
        await interaction.response.defer()

        try:
            async for session in get_db():
                product_service = ProductService(session)

                products = await product_service.search_products(kata_kunci)

                if not products:
                    await interaction.followup.send(
                        f"❌ Tidak ada produk yang cocok dengan '{kata_kunci}'."
                    )
                    return

                # Create embed
                embed = discord.Embed(
                    title=f"🔍 Hasil Pencarian: '{kata_kunci}'",
                    description=f"Ditemukan {len(products)} produk",
                    color=discord.Color.blue(),
                )

                # Add products
                for product in products[:10]:
                    price = product.discount_price if product.discount_price else product.price
                    stock_text = (
                        f"{product.available_stock} tersedia"
                        if product.available_stock > 0
                        else "Stok habis"
                    )

                    embed.add_field(
                        name=f"{product.name} ({product.code})",
                        value=f"💰 Rp {price:,.0f} | 📦 {stock_text}",
                        inline=False,
                    )

                if len(products) > 10:
                    embed.set_footer(text=f"Menampilkan 10 dari {len(products)} produk")

                await interaction.followup.send(embed=embed)

        except Exception as e:
            logger.error(f"Error in search command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}")


async def setup(bot: commands.Bot):
    """Setup function to load the cog"""
    await bot.add_cog(ShopCommands(bot))
    logger.info("Shop commands cog loaded")
