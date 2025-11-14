const IUserRepository = require('../interfaces/IUserRepository');
const { User, BalanceHistory } = require('./schemas');
const logger = require('../../logger/Logger');
const { v4: uuidv4 } = require('uuid');

class MongoDBUserRepository extends IUserRepository {
  async findByDiscordId(discordId) {
    try {
      const user = await User.findOne({ discordId }).lean();
      return user ? this.mapToUser(user) : null;
    } catch (error) {
      logger.error('Failed to find user by Discord ID', error, { discordId });
      throw error;
    }
  }

  async create(userData) {
    try {
      const user = new User({
        discordId: userData.discordId,
        username: userData.username,
        discriminator: userData.discriminator || '0',
        avatar: userData.avatar || null,
        balance: userData.balance || 0
      });

      await user.save();
      logger.info('User created', { discordId: userData.discordId });
      return this.mapToUser(user.toObject());
    } catch (error) {
      logger.error('Failed to create user', error, { userData });
      throw error;
    }
  }

  async update(discordId, updates) {
    try {
      const updateData = {};

      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.discriminator !== undefined) updateData.discriminator = updates.discriminator;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

      if (Object.keys(updateData).length === 0) {
        return await this.findByDiscordId(discordId);
      }

      const user = await User.findOneAndUpdate(
        { discordId },
        { $set: updateData },
        { new: true }
      ).lean();

      logger.info('User updated', { discordId });
      return user ? this.mapToUser(user) : null;
    } catch (error) {
      logger.error('Failed to update user', error, { discordId, updates });
      throw error;
    }
  }

  async getBalance(discordId) {
    try {
      const user = await User.findOne({ discordId }).select('balance').lean();
      return user ? user.balance : 0;
    } catch (error) {
      logger.error('Failed to get balance', error, { discordId });
      throw error;
    }
  }

  async addBalance(discordId, amount, reason = 'manual') {
    const session = await User.startSession();
    try {
      await session.withTransaction(async () => {
        const user = await User.findOne({ discordId }).session(session);

        if (!user) {
          throw new Error('User not found');
        }

        const balanceBefore = user.balance;
        const balanceAfter = balanceBefore + amount;

        user.balance = balanceAfter;
        await user.save({ session });

        // Record history
        const history = new BalanceHistory({
          discordId,
          type: 'add',
          amount,
          balanceBefore,
          balanceAfter,
          reason,
          referenceId: uuidv4()
        });

        await history.save({ session });

        logger.info('Balance added', {
          discordId,
          amount,
          balanceBefore,
          balanceAfter,
          reason
        });
      });

      const user = await this.findByDiscordId(discordId);

      return {
        success: true,
        balanceBefore: user.balance - amount,
        balanceAfter: user.balance,
        amount
      };
    } catch (error) {
      logger.error('Failed to add balance', error, { discordId, amount, reason });
      throw error;
    } finally {
      session.endSession();
    }
  }

  async subtractBalance(discordId, amount, reason = 'purchase') {
    const session = await User.startSession();
    try {
      let result;

      await session.withTransaction(async () => {
        const user = await User.findOne({ discordId }).session(session);

        if (!user) {
          throw new Error('User not found');
        }

        const balanceBefore = user.balance;

        if (balanceBefore < amount) {
          throw new Error('Insufficient balance');
        }

        const balanceAfter = balanceBefore - amount;

        user.balance = balanceAfter;
        user.totalSpent += amount;
        await user.save({ session });

        // Record history
        const history = new BalanceHistory({
          discordId,
          type: 'subtract',
          amount,
          balanceBefore,
          balanceAfter,
          reason,
          referenceId: uuidv4()
        });

        await history.save({ session });

        result = {
          success: true,
          balanceBefore,
          balanceAfter,
          amount
        };

        logger.info('Balance subtracted', {
          discordId,
          amount,
          balanceBefore,
          balanceAfter,
          reason
        });
      });

      return result;
    } catch (error) {
      logger.error('Failed to subtract balance', error, { discordId, amount, reason });
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(limit = 100, offset = 0) {
    try {
      const users = await User.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return users.map(user => this.mapToUser(user));
    } catch (error) {
      logger.error('Failed to find all users', error);
      throw error;
    }
  }

  async count() {
    try {
      return await User.countDocuments();
    } catch (error) {
      logger.error('Failed to count users', error);
      throw error;
    }
  }

  async delete(discordId) {
    try {
      const result = await User.deleteOne({ discordId });
      logger.info('User deleted', { discordId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Failed to delete user', error, { discordId });
      throw error;
    }
  }

  mapToUser(doc) {
    return {
      id: doc._id ? doc._id.toString() : null,
      discordId: doc.discordId,
      username: doc.username,
      discriminator: doc.discriminator,
      avatar: doc.avatar,
      balance: doc.balance,
      totalSpent: doc.totalSpent || 0,
      totalOrders: doc.totalOrders || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }
}

module.exports = MongoDBUserRepository;
