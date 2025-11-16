"""
SQLAlchemy Models for MySQL Database
Professional models with proper relationships and constraints
"""

from datetime import datetime
from typing import Optional
from decimal import Decimal

from sqlalchemy import (
    String,
    Integer,
    BigInteger,
    Text,
    Boolean,
    Numeric,
    Enum as SQLEnum,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from src.core.database import Base, TimestampMixin


# ═══════════════════════════════════════════════════════════
# Enums
# ═══════════════════════════════════════════════════════════


class OrderStatus(str, enum.Enum):
    """Order status enum"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class PaymentStatus(str, enum.Enum):
    """Payment status enum"""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    EXPIRED = "expired"
    REFUNDED = "refunded"


class ProductType(str, enum.Enum):
    """Product type enum"""
    DIGITAL = "digital"
    VOUCHER = "voucher"
    ACCOUNT = "account"
    SERVICE = "service"


# ═══════════════════════════════════════════════════════════
# User Model
# ═══════════════════════════════════════════════════════════


class User(Base, TimestampMixin):
    """User/Customer model"""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    discord_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    discriminator: Mapped[str] = mapped_column(String(10), nullable=True)

    # Balance
    balance: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        default=Decimal("0.00"),
        nullable=False,
    )

    # Stats
    total_spent: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    total_orders: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Status
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.discord_id})>"


# ═══════════════════════════════════════════════════════════
# Product Model
# ═══════════════════════════════════════════════════════════


class Product(Base, TimestampMixin):
    """Product model"""

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Type & Category
    type: Mapped[ProductType] = mapped_column(
        SQLEnum(ProductType),
        default=ProductType.DIGITAL,
        nullable=False,
    )
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Pricing
    price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    discount_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)

    # Stock
    total_stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    available_stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Metadata
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    stock_items: Mapped[list["StockItem"]] = relationship(
        "StockItem",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    order_items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Product {self.code}: {self.name}>"


# ═══════════════════════════════════════════════════════════
# Stock Item Model
# ═══════════════════════════════════════════════════════════


class StockItem(Base, TimestampMixin):
    """Stock item (keys, vouchers, accounts)"""

    __tablename__ = "stock_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Stock content
    content: Mapped[str] = mapped_column(Text, nullable=False)  # Key/voucher/account data

    # Status
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    used_by: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # discord_id

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="stock_items")

    def __repr__(self) -> str:
        return f"<StockItem {self.id} for Product {self.product_id}>"


# ═══════════════════════════════════════════════════════════
# Order Model
# ═══════════════════════════════════════════════════════════


class Order(Base, TimestampMixin):
    """Order model"""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    # User
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Order details
    total_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    final_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    # Status
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus),
        default=OrderStatus.PENDING,
        nullable=False,
        index=True,
    )

    # Timestamps
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    payment: Mapped[Optional["Payment"]] = relationship(
        "Payment",
        back_populates="order",
        uselist=False,
    )

    def __repr__(self) -> str:
        return f"<Order {self.order_number} - {self.status.value}>"


# ═══════════════════════════════════════════════════════════
# Order Item Model
# ═══════════════════════════════════════════════════════════


class OrderItem(Base, TimestampMixin):
    """Order item (line item)"""

    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Foreign keys
    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Product snapshot (in case product is deleted)
    product_code: Mapped[str] = mapped_column(String(50), nullable=False)
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)

    # Pricing
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    # Delivered content
    delivered_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product", back_populates="order_items")

    def __repr__(self) -> str:
        return f"<OrderItem {self.product_code} x{self.quantity}>"


# ═══════════════════════════════════════════════════════════
# Payment Model
# ═══════════════════════════════════════════════════════════


class Payment(Base, TimestampMixin):
    """Payment/Transaction model"""

    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    # User & Order
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Amount
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    # Payment details
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    payment_provider: Mapped[str] = mapped_column(String(50), nullable=False)

    # Status
    status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=False,
        index=True,
    )

    # External references
    external_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    payment_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    qr_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Timestamps
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expired_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Metadata
    metadata: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="payments")
    order: Mapped[Optional["Order"]] = relationship("Order", back_populates="payment")

    def __repr__(self) -> str:
        return f"<Payment {self.transaction_id} - {self.status.value}>"


__all__ = [
    "OrderStatus",
    "PaymentStatus",
    "ProductType",
    "User",
    "Product",
    "StockItem",
    "Order",
    "OrderItem",
    "Payment",
]
