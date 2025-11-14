const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  discriminator: { type: String, default: '0' },
  avatar: { type: String },
  balance: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 }
}, { timestamps: true });

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, default: 'General', index: true },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true, index: true },
  minPurchase: { type: Number, default: 1 },
  maxPurchase: { type: Number, default: 1 }
}, { timestamps: true });

// Stock Schema
const StockSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  data: { type: String, required: true },
  isUsed: { type: Boolean, default: false, index: true },
  usedBy: { type: String },
  usedAt: { type: Date },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
}, { timestamps: true });

StockSchema.index({ productId: 1, isUsed: 1 });

// Order Schema
const OrderSchema = new mongoose.Schema({
  discordId: { type: String, required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending', index: true },
  deliveryData: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

OrderSchema.index({ discordId: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

// Payment Schema
const PaymentSchema = new mongoose.Schema({
  discordId: { type: String, required: true, index: true },
  invoiceId: { type: String, required: true, unique: true, index: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed', 'expired'], default: 'pending', index: true },
  provider: { type: String, required: true },
  qrUrl: { type: String },
  paymentUrl: { type: String },
  expiredAt: { type: Date, required: true, index: true },
  paidAt: { type: Date },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

PaymentSchema.index({ status: 1, expiredAt: 1 });

// Balance History Schema
const BalanceHistorySchema = new mongoose.Schema({
  discordId: { type: String, required: true, index: true },
  type: { type: String, enum: ['add', 'subtract'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  reason: { type: String },
  referenceId: { type: String }
}, { timestamps: true });

BalanceHistorySchema.index({ discordId: 1, createdAt: -1 });

// Admin Schema
const AdminSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  role: { type: String, enum: ['owner', 'admin', 'helper'], default: 'admin' },
  permissions: { type: mongoose.Schema.Types.Mixed },
  createdBy: { type: String }
}, { timestamps: true });

// Export models
module.exports = {
  User: mongoose.model('User', UserSchema),
  Product: mongoose.model('Product', ProductSchema),
  Stock: mongoose.model('Stock', StockSchema),
  Order: mongoose.model('Order', OrderSchema),
  Payment: mongoose.model('Payment', PaymentSchema),
  BalanceHistory: mongoose.model('BalanceHistory', BalanceHistorySchema),
  Admin: mongoose.model('Admin', AdminSchema)
};
