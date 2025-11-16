"""User Commands - Balance, Profile, Deposit"""

import discord
from discord import app_commands
from discord.ext import commands
from loguru import logger

from src.core.database import get_db
from src.shared.services import UserService


class UserCommands(commands.Cog):
    """User-related commands"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="balance", description="Cek saldo Anda")
    async def balance(self, interaction: discord.Interaction):
        """Check user balance"""
        await interaction.response.defer(ephemeral=True)

        try:
            async for session in get_db():
                user_service = UserService(session)

                # Get or create user
                user = await user_service.get_or_create_user(
                    discord_id=str(interaction.user.id), username=interaction.user.name
                )

                # Create embed
                embed = discord.Embed(
                    title="💰 Saldo Anda",
                    description=f"**Rp {user.balance:,.0f}**",
                    color=discord.Color.green(),
                )

                embed.add_field(name="Total Pembelian", value=f"Rp {user.total_spent:,.0f}", inline=True)
                embed.add_field(name="Total Order", value=f"{user.total_orders}", inline=True)
                embed.set_footer(text=f"User ID: {user.discord_id}")

                await interaction.followup.send(embed=embed, ephemeral=True)

        except Exception as e:
            logger.error(f"Error in balance command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)

    @app_commands.command(name="profile", description="Lihat profil Anda")
    async def profile(self, interaction: discord.Interaction):
        """View user profile"""
        await interaction.response.defer(ephemeral=True)

        try:
            async for session in get_db():
                user_service = UserService(session)

                # Get or create user
                user = await user_service.get_or_create_user(
                    discord_id=str(interaction.user.id), username=interaction.user.name
                )

                # Create embed
                embed = discord.Embed(
                    title=f"👤 Profil {interaction.user.name}",
                    color=discord.Color.blue(),
                )

                embed.set_thumbnail(url=interaction.user.display_avatar.url)
                embed.add_field(name="Discord ID", value=user.discord_id, inline=False)
                embed.add_field(name="💰 Saldo", value=f"Rp {user.balance:,.0f}", inline=True)
                embed.add_field(name="🛒 Total Order", value=f"{user.total_orders}", inline=True)
                embed.add_field(
                    name="💸 Total Pembelian", value=f"Rp {user.total_spent:,.0f}", inline=True
                )

                # Status badges
                status_badges = []
                if user.is_admin:
                    status_badges.append("⭐ Admin")
                if user.is_banned:
                    status_badges.append("🚫 Banned")

                if status_badges:
                    embed.add_field(name="Status", value=" | ".join(status_badges), inline=False)

                embed.set_footer(text=f"Member sejak {user.created_at.strftime('%d %b %Y')}")

                await interaction.followup.send(embed=embed, ephemeral=True)

        except Exception as e:
            logger.error(f"Error in profile command: {e}")
            await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)

    @app_commands.command(name="deposit", description="Cara deposit saldo")
    async def deposit(self, interaction: discord.Interaction):
        """Show deposit instructions"""
        await interaction.response.defer(ephemeral=True)

        embed = discord.Embed(
            title="💳 Cara Deposit Saldo",
            description=(
                "Untuk menambah saldo, hubungi admin atau gunakan salah satu metode berikut:\n\n"
                "**Metode Pembayaran:**\n"
                "• QRIS\n"
                "• Transfer Bank (BCA, Mandiri, BRI, BNI)\n"
                "• E-Wallet (OVO, Dana, GoPay, LinkAja)\n\n"
                "**Cara Deposit:**\n"
                "1. Hubungi admin dengan menyebutkan jumlah deposit\n"
                "2. Admin akan memberikan instruksi pembayaran\n"
                "3. Lakukan pembayaran sesuai instruksi\n"
                "4. Kirim bukti transfer ke admin\n"
                "5. Saldo akan ditambahkan otomatis\n\n"
                "**Minimum deposit:** Rp 10.000\n"
                "**Processing time:** 1-5 menit"
            ),
            color=discord.Color.gold(),
        )

        embed.set_footer(text="Auto-Store | Deposit cepat & aman")

        await interaction.followup.send(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    """Setup function to load the cog"""
    await bot.add_cog(UserCommands(bot))
    logger.info("User commands cog loaded")
