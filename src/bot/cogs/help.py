"""Help Command - Show available commands"""

import discord
from discord import app_commands
from discord.ext import commands
from loguru import logger


class HelpCommands(commands.Cog):
    """Help commands"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="help", description="Lihat daftar perintah yang tersedia")
    async def help(self, interaction: discord.Interaction):
        """Show help message"""
        await interaction.response.defer(ephemeral=True)

        embed = discord.Embed(
            title="🤖 Auto-Store Bot - Bantuan",
            description="Daftar perintah yang tersedia:",
            color=discord.Color.blue(),
        )

        # User commands
        user_commands = (
            "• `/balance` - Cek saldo Anda\n"
            "• `/profile` - Lihat profil Anda\n"
            "• `/deposit` - Cara deposit saldo"
        )
        embed.add_field(name="👤 User Commands", value=user_commands, inline=False)

        # Shop commands
        shop_commands = (
            "• `/shop [kategori]` - Lihat daftar produk\n"
            "• `/buy <kode> [jumlah]` - Beli produk\n"
            "• `/search <kata_kunci>` - Cari produk"
        )
        embed.add_field(name="🛒 Shop Commands", value=shop_commands, inline=False)

        # Order commands
        order_commands = (
            "• `/orders [limit]` - Lihat riwayat pesanan\n"
            "• `/order <order_number>` - Lihat detail pesanan"
        )
        embed.add_field(name="📦 Order Commands", value=order_commands, inline=False)

        # Admin commands
        admin_commands = (
            "• `/addproduct` - Tambah produk baru\n"
            "• `/addstock` - Tambah stok produk\n"
            "• `/addbalance` - Tambah saldo user\n"
            "• `/ban` - Ban/unban user\n"
            "• `/setadmin` - Set user sebagai admin"
        )
        embed.add_field(name="⭐ Admin Commands", value=admin_commands, inline=False)

        embed.set_footer(text="Auto-Store Ecosystem v3.0 | Python Edition")

        await interaction.followup.send(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    """Setup function to load the cog"""
    await bot.add_cog(HelpCommands(bot))
    logger.info("Help commands cog loaded")
