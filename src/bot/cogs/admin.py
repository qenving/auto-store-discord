"""Admin Commands - Product & User Management"""

import discord
from discord import app_commands
from discord.ext import commands
from loguru import logger
from decimal import Decimal
from typing import Optional

from src.core.database import get_db
from src.shared.services import ProductService, UserService, OrderService
from src.shared.schemas.product_schemas import ProductCreate, ProductUpdate


class AdminCommands(commands.Cog):
    """Admin-only commands"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def is_admin(self, interaction: discord.Interaction) -> bool:
        """Check if user is admin"""
        async for session in get_db():
            user_service = UserService(session)
            user = await user_service.get_user_by_discord_id(str(interaction.user.id))
            return user is not None and user.is_admin

    @app_commands.command(name="addproduct", description="[ADMIN] Tambah produk baru")
    @app_commands.describe(
        kode="Kode produk (contoh: NITRO1M)",
        nama="Nama produk",
        harga="Harga produk",
        deskripsi="Deskripsi produk",
        kategori="Kategori produk",
    )
    async def addproduct(
        self,
        interaction: discord.Interaction,
        kode: str,
        nama: str,
        harga: int,
        deskripsi: Optional[str] = None,
        kategori: Optional[str] = None,
    ):
        """Add new product"""
        await interaction.response.defer(ephemeral=True)

        try:
            # Check if admin
            if not await self.is_admin(interaction):
                await interaction.followup.send("❌ Command ini hanya untuk admin.", ephemeral=True)
                return

            async for session in get_db():
                product_service = ProductService(session)

                # Create product
                product_data = ProductCreate(
                    code=kode.upper(),
                    name=nama,
                    price=Decimal(str(harga)),
                    description=deskripsi,
                    category=kategori,
                )

                product = await product_service.create_product(product_data)

                # Send confirmation
                embed = discord.Embed(
                    title="✅ Produk Berhasil Ditambahkan",
                    description=f"**{product.name}** ({product.code})",
                    color=discord.Color.green(),
                )

                embed.add_field(name="Harga", value=f"Rp {product.price:,.0f}", inline=True)
                embed.add_field(name="Kategori", value=product.category or "Tidak ada", inline=True)
                embed.add_field(name="Stok", value="0 (belum ada stok)", inline=True)

                if product.description:
                    embed.add_field(name="Deskripsi", value=product.description, inline=False)

                await interaction.followup.send(embed=embed, ephemeral=True)

                logger.info(f"Admin {interaction.user.name} added product: {product.code}")

        except Exception as e:
            logger.error(f"Error in addproduct command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)

    @app_commands.command(name="addstock", description="[ADMIN] Tambah stok produk")
    @app_commands.describe(
        kode_produk="Kode produk", stock_items="Item stok (pisahkan dengan |, contoh: key1|key2|key3)"
    )
    async def addstock(self, interaction: discord.Interaction, kode_produk: str, stock_items: str):
        """Add stock to product"""
        await interaction.response.defer(ephemeral=True)

        try:
            # Check if admin
            if not await self.is_admin(interaction):
                await interaction.followup.send("❌ Command ini hanya untuk admin.", ephemeral=True)
                return

            async for session in get_db():
                product_service = ProductService(session)

                # Get product
                product = await product_service.get_product_by_code(kode_produk.upper())
                if not product:
                    await interaction.followup.send(
                        f"❌ Produk '{kode_produk}' tidak ditemukan.", ephemeral=True
                    )
                    return

                # Parse stock items
                items = [item.strip() for item in stock_items.split("|") if item.strip()]

                if not items:
                    await interaction.followup.send(
                        "❌ Format stok tidak valid. Gunakan format: key1|key2|key3", ephemeral=True
                    )
                    return

                # Add stock
                updated_product = await product_service.add_stock(product.id, items)

                # Send confirmation
                embed = discord.Embed(
                    title="✅ Stok Berhasil Ditambahkan",
                    description=f"**{updated_product.name}** ({updated_product.code})",
                    color=discord.Color.green(),
                )

                embed.add_field(name="Items Ditambahkan", value=str(len(items)), inline=True)
                embed.add_field(name="Total Stok", value=str(updated_product.total_stock), inline=True)
                embed.add_field(
                    name="Stok Tersedia", value=str(updated_product.available_stock), inline=True
                )

                await interaction.followup.send(embed=embed, ephemeral=True)

                logger.info(
                    f"Admin {interaction.user.name} added {len(items)} stock to {updated_product.code}"
                )

        except Exception as e:
            logger.error(f"Error in addstock command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)

    @app_commands.command(name="addbalance", description="[ADMIN] Tambah saldo user")
    @app_commands.describe(user="User yang akan ditambah saldo", jumlah="Jumlah saldo yang ditambahkan")
    async def addbalance(self, interaction: discord.Interaction, user: discord.User, jumlah: int):
        """Add balance to user"""
        await interaction.response.defer(ephemeral=True)

        try:
            # Check if admin
            if not await self.is_admin(interaction):
                await interaction.followup.send("❌ Command ini hanya untuk admin.", ephemeral=True)
                return

            async for session in get_db():
                user_service = UserService(session)

                # Add balance
                updated_user = await user_service.add_balance(
                    str(user.id), Decimal(str(jumlah))
                )

                # Send confirmation
                embed = discord.Embed(
                    title="✅ Saldo Berhasil Ditambahkan",
                    description=f"User: {user.mention}",
                    color=discord.Color.green(),
                )

                embed.add_field(name="Jumlah Ditambahkan", value=f"Rp {jumlah:,.0f}", inline=True)
                embed.add_field(name="Saldo Baru", value=f"Rp {updated_user.balance:,.0f}", inline=True)

                await interaction.followup.send(embed=embed, ephemeral=True)

                logger.info(
                    f"Admin {interaction.user.name} added Rp{jumlah:,.0f} to {user.name} ({user.id})"
                )

        except Exception as e:
            logger.error(f"Error in addbalance command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)

    @app_commands.command(name="ban", description="[ADMIN] Ban/unban user")
    @app_commands.describe(user="User yang akan di-ban/unban", action="ban atau unban")
    async def ban_user(
        self, interaction: discord.Interaction, user: discord.User, action: str = "ban"
    ):
        """Ban or unban user"""
        await interaction.response.defer(ephemeral=True)

        try:
            # Check if admin
            if not await self.is_admin(interaction):
                await interaction.followup.send("❌ Command ini hanya untuk admin.", ephemeral=True)
                return

            async for session in get_db():
                user_service = UserService(session)

                is_ban = action.lower() == "ban"
                updated_user = await user_service.ban_user(str(user.id), is_ban)

                # Send confirmation
                action_text = "Banned" if is_ban else "Unbanned"
                color = discord.Color.red() if is_ban else discord.Color.green()

                embed = discord.Embed(
                    title=f"✅ User {action_text}",
                    description=f"User: {user.mention}",
                    color=color,
                )

                embed.add_field(name="Status", value="🚫 Banned" if is_ban else "✅ Active", inline=True)

                await interaction.followup.send(embed=embed, ephemeral=True)

                logger.warning(f"Admin {interaction.user.name} {action_text.lower()} {user.name} ({user.id})")

        except Exception as e:
            logger.error(f"Error in ban command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)

    @app_commands.command(name="setadmin", description="[ADMIN] Set user sebagai admin")
    @app_commands.describe(user="User yang akan dijadikan admin", action="grant atau revoke")
    async def setadmin(
        self, interaction: discord.Interaction, user: discord.User, action: str = "grant"
    ):
        """Grant or revoke admin status"""
        await interaction.response.defer(ephemeral=True)

        try:
            # Check if admin
            if not await self.is_admin(interaction):
                await interaction.followup.send("❌ Command ini hanya untuk admin.", ephemeral=True)
                return

            async for session in get_db():
                user_service = UserService(session)

                is_grant = action.lower() == "grant"
                updated_user = await user_service.set_admin(str(user.id), is_grant)

                # Send confirmation
                action_text = "Granted" if is_grant else "Revoked"
                color = discord.Color.gold() if is_grant else discord.Color.blue()

                embed = discord.Embed(
                    title=f"✅ Admin {action_text}",
                    description=f"User: {user.mention}",
                    color=color,
                )

                embed.add_field(
                    name="Status", value="⭐ Admin" if is_grant else "👤 User", inline=True
                )

                await interaction.followup.send(embed=embed, ephemeral=True)

                logger.info(
                    f"Admin {interaction.user.name} {action_text.lower()} admin to {user.name} ({user.id})"
                )

        except Exception as e:
            logger.error(f"Error in setadmin command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)


async def setup(bot: commands.Bot):
    """Setup function to load the cog"""
    await bot.add_cog(AdminCommands(bot))
    logger.info("Admin commands cog loaded")
