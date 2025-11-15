"""
Discord Bot - Main Entry Point
Professional Discord.py 2.0+ bot with slash commands
"""

import asyncio
import discord
from discord.ext import commands
from loguru import logger

from src.core.config import get_settings
from src.core.exceptions import DiscordBotError


class AutoStoreBot(commands.Bot):
    """Main Discord Bot class"""

    def __init__(self):
        # Get configuration
        self.settings = get_settings()

        # Validate bot is enabled
        if not self.settings.is_bot_enabled():
            raise DiscordBotError(
                "Bot is not enabled in current mode. "
                f"Current mode: {self.settings.mode.value}"
            )

        # Setup intents
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        intents.guilds = True

        # Initialize bot
        super().__init__(
            command_prefix="!",  # Fallback prefix (we use slash commands)
            intents=intents,
            help_command=None,  # We'll create custom help
        )

        self.start_time = discord.utils.utcnow()
        logger.info("Bot initialized successfully")

    async def setup_hook(self):
        """Called when bot is starting - Load extensions here"""
        logger.info("Running setup hook...")

        # TODO: Load command cogs
        # await self.load_extension("src.bot.cogs.user")
        # await self.load_extension("src.bot.cogs.admin")
        # await self.load_extension("src.bot.cogs.store")

        # Sync slash commands
        guild = discord.Object(id=int(self.settings.discord.guild_id))
        self.tree.copy_global_to(guild=guild)
        await self.tree.sync(guild=guild)

        logger.success(f"Slash commands synced to guild {self.settings.discord.guild_id}")

    async def on_ready(self):
        """Called when bot is ready"""
        logger.success("=" * 60)
        logger.success("AUTO-STORE DISCORD BOT - READY")
        logger.success("=" * 60)
        logger.info(f"Logged in as: {self.user} (ID: {self.user.id})")
        logger.info(f"Discord.py version: {discord.__version__}")
        logger.info(f"Guilds: {len(self.guilds)}")
        logger.info(f"Mode: {self.settings.mode.value}")
        logger.success("=" * 60)

        # Set bot status
        await self.change_presence(
            activity=discord.Activity(
                type=discord.ActivityType.watching, name="Auto-Store Ecosystem 🚀"
            )
        )

    async def on_command_error(self, ctx, error):
        """Global error handler"""
        logger.error(f"Command error: {error}")

        if isinstance(error, commands.CommandNotFound):
            return

        # Send user-friendly error message
        await ctx.send(
            f"❌ Terjadi error: {str(error)}\n" f"Silakan hubungi admin jika error terus muncul."
        )


def main():
    """Main entry point"""
    logger.info("Starting Auto-Store Discord Bot...")

    try:
        # Create bot instance
        bot = AutoStoreBot()

        # Get token from settings
        token = bot.settings.discord.token

        # Run bot
        logger.info("Connecting to Discord...")
        bot.run(token, log_handler=None)  # We use loguru for logging

    except DiscordBotError as e:
        logger.error(f"Bot configuration error: {e}")
        raise SystemExit(1)

    except Exception as e:
        logger.exception(f"Fatal error: {e}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
