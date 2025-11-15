"""Custom Exception Classes for Auto-Store"""


class AutoStoreException(Exception):
    """Base exception for all Auto-Store errors"""

    pass


class ConfigurationError(AutoStoreException):
    """Configuration related errors"""

    pass


class DatabaseError(AutoStoreException):
    """Database operation errors"""

    pass


class PaymentError(AutoStoreException):
    """Payment gateway errors"""

    pass


class DiscordBotError(AutoStoreException):
    """Discord bot operation errors"""

    pass


class ValidationError(AutoStoreException):
    """Data validation errors"""

    pass


class AuthenticationError(AutoStoreException):
    """Authentication/Authorization errors"""

    pass


__all__ = [
    "AutoStoreException",
    "ConfigurationError",
    "DatabaseError",
    "PaymentError",
    "DiscordBotError",
    "ValidationError",
    "AuthenticationError",
]
