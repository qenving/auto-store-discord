"""
Pydantic Configuration Models - Type-safe config management
"""

from enum import Enum
from functools import lru_cache
from pathlib import Path
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class ModeType(str, Enum):
    """Application operation modes"""

    DISCORD_BOT_ONLY = "DiscordBotOnly"
    WEB_ONLY = "WebOnly"
    INTEGRATED = "IntegratedMode"


class DatabaseType(str, Enum):
    """Supported database types"""

    MYSQL = "mysql"
    MONGODB = "mongodb"
    LOCAL_JSON = "local_json"


class PaymentProvider(str, Enum):
    """Supported payment providers"""

    MIDTRANS = "midtrans"
    DUITKU = "duitku"
    TRIPAY = "tripay"
    MANUAL = "manual"


# ═══════════════════════════════════════════════════════════
# Discord Configuration
# ═══════════════════════════════════════════════════════════


class DiscordChannels(BaseModel):
    """Discord notification channels"""

    testimoni: Optional[str] = None
    order_log: Optional[str] = Field(None, alias="orderLog")
    payment_log: Optional[str] = Field(None, alias="paymentLog")
    admin_log: Optional[str] = Field(None, alias="adminLog")

    model_config = SettingsConfigDict(populate_by_name=True)


class DiscordConfig(BaseModel):
    """Discord bot configuration"""

    token: str = Field(..., description="Discord bot token")
    client_id: str = Field(..., alias="clientId", description="Application/Client ID")
    guild_id: str = Field(..., alias="guildId", description="Server/Guild ID")
    owner_id: str = Field(..., alias="ownerId", description="Bot owner user ID")
    channels: DiscordChannels = Field(default_factory=DiscordChannels)

    @field_validator("token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        if "PASTE_" in v or not v:
            raise ValueError(
                "❌ discord.token belum diisi!\n"
                "   Cara: Baca CARA_SETUP.md bagian 'Mendapatkan Bot Token'\n"
                "   Portal: https://discord.com/developers/applications"
            )
        return v

    @field_validator("client_id", "guild_id", "owner_id")
    @classmethod
    def validate_snowflake(cls, v: str, info) -> str:
        field_name = info.field_name
        if "PASTE_" in v or not v:
            raise ValueError(
                f"❌ discord.{field_name} belum diisi!\n"
                f"   Cara: Lihat CARA_SETUP.md untuk mendapatkan {field_name}"
            )
        if not v.isdigit():
            raise ValueError(f"❌ discord.{field_name} harus berupa angka (Discord Snowflake ID)")
        return v

    model_config = SettingsConfigDict(populate_by_name=True)


# ═══════════════════════════════════════════════════════════
# Database Configuration
# ═══════════════════════════════════════════════════════════


class MySQLConfig(BaseModel):
    """MySQL database configuration"""

    host: str = Field(default="localhost", description="MySQL host")
    port: int = Field(default=3306, ge=1, le=65535, description="MySQL port")
    user: str = Field(default="root", description="MySQL username")
    password: str = Field(..., description="MySQL password")
    database: str = Field(..., description="Database name")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if "ISI_PASSWORD" in v or not v:
            raise ValueError(
                "⚠️  database.mysql.password belum diisi!\n"
                "   Ini akan menyebabkan gagal koneksi ke database"
            )
        return v

    @property
    def connection_string(self) -> str:
        """Generate async MySQL connection string"""
        return f"mysql+aiomysql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"


class MongoDBConfig(BaseModel):
    """MongoDB database configuration"""

    uri: str = Field(..., description="MongoDB connection URI")

    @field_validator("uri")
    @classmethod
    def validate_uri(cls, v: str) -> str:
        if not v or not v.startswith(("mongodb://", "mongodb+srv://")):
            raise ValueError(
                "❌ database.mongodb.uri tidak valid!\n"
                "   Format: mongodb://localhost:27017/autostore (local)\n"
                "   Atau: mongodb+srv://user:pass@cluster.mongodb.net/db (Atlas)"
            )
        return v


class LocalJSONConfig(BaseModel):
    """Local JSON database configuration"""

    path: str = Field(default="data", description="Directory untuk menyimpan file JSON")

    @field_validator("path")
    @classmethod
    def validate_path(cls, v: str) -> str:
        if not v:
            raise ValueError(
                "❌ database.local_json.path tidak boleh kosong!\n"
                "   Gunakan: 'data' atau path lain untuk menyimpan file JSON"
            )
        return v


class DatabaseConfig(BaseModel):
    """Database configuration"""

    type: DatabaseType = Field(..., description="Database type")
    mysql: Optional[MySQLConfig] = None
    mongodb: Optional[MongoDBConfig] = None
    local_json: Optional[LocalJSONConfig] = Field(None, alias="localJson")

    @field_validator("mysql")
    @classmethod
    def validate_mysql(cls, v: Optional[MySQLConfig], info) -> Optional[MySQLConfig]:
        db_type = info.data.get("type")
        if db_type == DatabaseType.MYSQL and v is None:
            raise ValueError(
                "❌ database.mysql section tidak ditemukan!\n"
                "   Cara: Lihat config.example.json untuk template MySQL"
            )
        return v

    @field_validator("mongodb")
    @classmethod
    def validate_mongodb(cls, v: Optional[MongoDBConfig], info) -> Optional[MongoDBConfig]:
        db_type = info.data.get("type")
        if db_type == DatabaseType.MONGODB and v is None:
            raise ValueError(
                "❌ database.mongodb section tidak ditemukan!\n"
                "   Cara: Lihat config.example.json untuk template MongoDB"
            )
        return v

    @field_validator("local_json")
    @classmethod
    def validate_local_json(cls, v: Optional[LocalJSONConfig], info) -> Optional[LocalJSONConfig]:
        db_type = info.data.get("type")
        if db_type == DatabaseType.LOCAL_JSON:
            # Auto-create dengan default jika tidak ada
            if v is None:
                return LocalJSONConfig()
        return v

    model_config = SettingsConfigDict(populate_by_name=True)


# ═══════════════════════════════════════════════════════════
# Website Configuration
# ═══════════════════════════════════════════════════════════


class WebsiteConfig(BaseModel):
    """Website/API server configuration"""

    url: str = Field(default="http://localhost:3000", description="Base URL")
    port: int = Field(default=3000, ge=1, le=65535, description="Server port")
    jwt_secret: str = Field(..., alias="jwtSecret", description="JWT secret key")
    admin_secret_key: str = Field(..., alias="adminSecretKey", description="Admin password")
    session_secret: str = Field(..., alias="sessionSecret", description="Session secret")

    @field_validator("jwt_secret", "admin_secret_key", "session_secret")
    @classmethod
    def validate_secrets(cls, v: str, info) -> str:
        field_name = info.field_name
        if "GANTI_" in v or "PASSWORD_" in v or len(v) < 32:
            raise ValueError(
                f"⚠️  website.{field_name} belum diisi atau terlalu pendek!\n"
                f"   Minimal 32 karakter untuk keamanan\n"
                f"   Generate: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )
        return v

    model_config = SettingsConfigDict(populate_by_name=True)


# ═══════════════════════════════════════════════════════════
# OAuth Configuration
# ═══════════════════════════════════════════════════════════


class OAuthConfig(BaseModel):
    """Discord OAuth2 configuration for web login"""

    client_id: str = Field(..., alias="clientId")
    client_secret: str = Field(..., alias="clientSecret")
    redirect_uri: str = Field(..., alias="redirectUri")

    model_config = SettingsConfigDict(populate_by_name=True)


# ═══════════════════════════════════════════════════════════
# Payment Gateway Configurations
# ═══════════════════════════════════════════════════════════


class MidtransConfig(BaseModel):
    """Midtrans payment gateway configuration"""

    server_key: str = Field(..., alias="serverKey")
    client_key: str = Field(..., alias="clientKey")
    is_production: bool = Field(default=False, alias="isProduction")

    model_config = SettingsConfigDict(populate_by_name=True)


class DuitkuConfig(BaseModel):
    """Duitku payment gateway configuration"""

    merchant_code: str = Field(..., alias="merchantCode")
    api_key: str = Field(..., alias="apiKey")
    callback_url: str = Field(..., alias="callbackUrl")

    model_config = SettingsConfigDict(populate_by_name=True)


class TripayConfig(BaseModel):
    """Tripay payment gateway configuration"""

    merchant_code: str = Field(..., alias="merchantCode")
    api_key: str = Field(..., alias="apiKey")
    private_key: str = Field(..., alias="privateKey")
    callback_url: str = Field(..., alias="callbackUrl")

    model_config = SettingsConfigDict(populate_by_name=True)


class PaymentConfig(BaseModel):
    """Payment gateway configuration"""

    provider: PaymentProvider = Field(default=PaymentProvider.MANUAL)
    auto_expire_minutes: int = Field(default=15, alias="autoExpireMinutes", ge=1, le=1440)
    midtrans: Optional[MidtransConfig] = None
    duitku: Optional[DuitkuConfig] = None
    tripay: Optional[TripayConfig] = None

    model_config = SettingsConfigDict(populate_by_name=True)


# ═══════════════════════════════════════════════════════════
# Features & Limits
# ═══════════════════════════════════════════════════════════


class FeaturesConfig(BaseModel):
    """Feature flags"""

    auto_delivery: bool = Field(default=True, alias="autoDelivery")
    auto_expire_invoice: bool = Field(default=True, alias="autoExpireInvoice")
    testimoni_integration: bool = Field(default=False, alias="testimoniIntegration")
    maintenance: bool = Field(default=False)

    model_config = SettingsConfigDict(populate_by_name=True)


class LimitsConfig(BaseModel):
    """System limits configuration"""

    max_pending_orders: int = Field(default=5, alias="maxPendingOrders", ge=1, le=100)
    min_deposit: int = Field(default=10000, alias="minDeposit", ge=1000)
    max_deposit: int = Field(default=10000000, alias="maxDeposit", ge=10000)

    model_config = SettingsConfigDict(populate_by_name=True)


# ═══════════════════════════════════════════════════════════
# Main Settings
# ═══════════════════════════════════════════════════════════


class Settings(BaseSettings):
    """
    Main application settings - Loaded from config.json

    Professional configuration management with:
    - Type safety via Pydantic v2
    - Automatic validation
    - Friendly error messages in Indonesian
    - Support for both .env and config.json
    """

    mode: ModeType = Field(default=ModeType.DISCORD_BOT_ONLY)

    # Core configurations
    discord: DiscordConfig
    database: DatabaseConfig
    payment: PaymentConfig = Field(default_factory=PaymentConfig)

    # Optional configurations
    website: Optional[WebsiteConfig] = None
    oauth: Optional[OAuthConfig] = None

    # Feature flags & limits
    features: FeaturesConfig = Field(default_factory=FeaturesConfig)
    limits: LimitsConfig = Field(default_factory=LimitsConfig)

    model_config = SettingsConfigDict(
        json_file="config.json",
        json_file_encoding="utf-8",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore unknown fields (for _comment fields)
    )

    def is_bot_enabled(self) -> bool:
        """Check if Discord bot should run"""
        return self.mode in (ModeType.DISCORD_BOT_ONLY, ModeType.INTEGRATED)

    def is_web_enabled(self) -> bool:
        """Check if web server should run"""
        return self.mode in (ModeType.WEB_ONLY, ModeType.INTEGRATED)

    def is_integrated(self) -> bool:
        """Check if running in integrated mode"""
        return self.mode == ModeType.INTEGRATED

    def validate_web_config(self) -> None:
        """Validate web configuration if web is enabled"""
        if self.is_web_enabled() and self.website is None:
            raise ValueError(
                "⚠️  website section tidak ditemukan!\n"
                "   Mode WebOnly/Integrated memerlukan konfigurasi website"
            )

    def validate_oauth_config(self) -> None:
        """Validate OAuth configuration if integrated mode"""
        if self.is_integrated() and self.oauth is None:
            raise ValueError(
                "⚠️  oauth section tidak ditemukan!\n"
                "   Mode Integrated memerlukan konfigurasi OAuth untuk login Discord"
            )


# ═══════════════════════════════════════════════════════════
# Settings Factory (Singleton)
# ═══════════════════════════════════════════════════════════


@lru_cache
def get_settings() -> Settings:
    """
    Get application settings (cached singleton)

    Usage:
        from src.core.config import get_settings

        settings = get_settings()
        print(settings.discord.token)
    """
    try:
        settings = Settings()

        # Validate mode-specific requirements
        if settings.is_web_enabled():
            settings.validate_web_config()

        if settings.is_integrated():
            settings.validate_oauth_config()

        return settings

    except ValueError as e:
        # Friendly error message
        print("\n╔════════════════════════════════════════════════════════╗")
        print("║        KONFIGURASI ERROR - HARUS DIPERBAIKI!           ║")
        print("╚════════════════════════════════════════════════════════╝\n")
        print(f"❌ {str(e)}\n")
        print("📚 Dokumentasi:")
        print("   - Baca KONFIGURASI.md untuk penjelasan setiap field")
        print("   - Baca CARA_SETUP.md untuk panduan setup lengkap")
        print("   - Jalankan: python -m src.cli test-config untuk validasi\n")
        raise SystemExit(1)

    except Exception as e:
        print(f"\n❌ Error loading config: {e}\n")
        print("Pastikan file config.json ada dan valid.\n")
        raise SystemExit(1)
