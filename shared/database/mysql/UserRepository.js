const IUserRepository = require('../interfaces/IUserRepository');
const mysqlConnection = require('./MySQLConnection');
const logger = require('../../logger/Logger');
const { v4: uuidv4 } = require('uuid');

/**
 * MySQL implementation of IUserRepository
 */
class MySQLUserRepository extends IUserRepository {
  async findByDiscordId(discordId) {
    try {
      const sql = 'SELECT * FROM users WHERE discord_id = ? LIMIT 1';
      const results = await mysqlConnection.query(sql, [discordId]);
      return results.length > 0 ? this.mapToUser(results[0]) : null;
    } catch (error) {
      logger.error('Failed to find user by Discord ID', error, { discordId });
      throw error;
    }
  }

  async create(userData) {
    try {
      const sql = `
        INSERT INTO users (discord_id, username, discriminator, avatar, balance)
        VALUES (?, ?, ?, ?, ?)
      `;

      await mysqlConnection.query(sql, [
        userData.discordId,
        userData.username,
        userData.discriminator || '0',
        userData.avatar || null,
        userData.balance || 0
      ]);

      return await this.findByDiscordId(userData.discordId);
    } catch (error) {
      logger.error('Failed to create user', error, { userData });
      throw error;
    }
  }

  async update(discordId, updates) {
    try {
      const fields = [];
      const values = [];

      if (updates.username !== undefined) {
        fields.push('username = ?');
        values.push(updates.username);
      }
      if (updates.discriminator !== undefined) {
        fields.push('discriminator = ?');
        values.push(updates.discriminator);
      }
      if (updates.avatar !== undefined) {
        fields.push('avatar = ?');
        values.push(updates.avatar);
      }

      if (fields.length === 0) {
        return await this.findByDiscordId(discordId);
      }

      values.push(discordId);
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE discord_id = ?`;

      await mysqlConnection.query(sql, values);
      return await this.findByDiscordId(discordId);
    } catch (error) {
      logger.error('Failed to update user', error, { discordId, updates });
      throw error;
    }
  }

  async getBalance(discordId) {
    try {
      const user = await this.findByDiscordId(discordId);
      return user ? parseFloat(user.balance) : 0;
    } catch (error) {
      logger.error('Failed to get balance', error, { discordId });
      throw error;
    }
  }

  async addBalance(discordId, amount, reason = 'manual') {
    const connection = await mysqlConnection.getConnection();
    try {
      await connection.beginTransaction();

      // Get current balance
      const [users] = await connection.execute(
        'SELECT balance FROM users WHERE discord_id = ? FOR UPDATE',
        [discordId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const balanceBefore = parseFloat(users[0].balance);
      const balanceAfter = balanceBefore + amount;

      // Update balance
      await connection.execute(
        'UPDATE users SET balance = ? WHERE discord_id = ?',
        [balanceAfter, discordId]
      );

      // Record history
      await connection.execute(
        `INSERT INTO balance_history
         (discord_id, type, amount, balance_before, balance_after, reason, reference_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [discordId, 'add', amount, balanceBefore, balanceAfter, reason, uuidv4()]
      );

      await connection.commit();

      logger.info('Balance added', {
        discordId,
        amount,
        balanceBefore,
        balanceAfter,
        reason
      });

      return {
        success: true,
        balanceBefore,
        balanceAfter,
        amount
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Failed to add balance', error, { discordId, amount, reason });
      throw error;
    } finally {
      connection.release();
    }
  }

  async subtractBalance(discordId, amount, reason = 'purchase') {
    const connection = await mysqlConnection.getConnection();
    try {
      await connection.beginTransaction();

      // Get current balance with lock
      const [users] = await connection.execute(
        'SELECT balance FROM users WHERE discord_id = ? FOR UPDATE',
        [discordId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const balanceBefore = parseFloat(users[0].balance);

      if (balanceBefore < amount) {
        throw new Error('Insufficient balance');
      }

      const balanceAfter = balanceBefore - amount;

      // Update balance
      await connection.execute(
        'UPDATE users SET balance = ?, total_spent = total_spent + ? WHERE discord_id = ?',
        [balanceAfter, amount, discordId]
      );

      // Record history
      await connection.execute(
        `INSERT INTO balance_history
         (discord_id, type, amount, balance_before, balance_after, reason, reference_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [discordId, 'subtract', amount, balanceBefore, balanceAfter, reason, uuidv4()]
      );

      await connection.commit();

      logger.info('Balance subtracted', {
        discordId,
        amount,
        balanceBefore,
        balanceAfter,
        reason
      });

      return {
        success: true,
        balanceBefore,
        balanceAfter,
        amount
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Failed to subtract balance', error, { discordId, amount, reason });
      throw error;
    } finally {
      connection.release();
    }
  }

  async findAll(limit = 100, offset = 0) {
    try {
      const sql = `
        SELECT * FROM users
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      const results = await mysqlConnection.query(sql, [limit, offset]);
      return results.map(row => this.mapToUser(row));
    } catch (error) {
      logger.error('Failed to find all users', error);
      throw error;
    }
  }

  async count() {
    try {
      const results = await mysqlConnection.query('SELECT COUNT(*) as count FROM users');
      return results[0].count;
    } catch (error) {
      logger.error('Failed to count users', error);
      throw error;
    }
  }

  async delete(discordId) {
    try {
      const sql = 'DELETE FROM users WHERE discord_id = ?';
      const result = await mysqlConnection.query(sql, [discordId]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Failed to delete user', error, { discordId });
      throw error;
    }
  }

  /**
   * Map database row to user object
   */
  mapToUser(row) {
    return {
      id: row.id,
      discordId: row.discord_id,
      username: row.username,
      discriminator: row.discriminator,
      avatar: row.avatar,
      balance: parseFloat(row.balance),
      totalSpent: parseFloat(row.total_spent),
      totalOrders: row.total_orders,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = MySQLUserRepository;
