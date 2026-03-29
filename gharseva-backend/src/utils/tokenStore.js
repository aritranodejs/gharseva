const Redis = require('ioredis');

class TokenStore {
  constructor() {
    this.enabled = process.env.REDIS_ENABLED === 'true';
    if (this.enabled) {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      this.redis.on('error', (err) => {
        console.error('[REDIS] Connection Error:', err);
        this.enabled = false; // Fallback to memory
      });
    }
    this.memoryStore = new Map();
  }

  async set(key, value, ttlSeconds) {
    if (this.enabled) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      this.memoryStore.set(key, {
        value,
        expiry: Date.now() + ttlSeconds * 1000
      });
    }
  }

  async get(key) {
    if (this.enabled) {
      return await this.redis.get(key);
    } else {
      const data = this.memoryStore.get(key);
      if (!data) return null;
      if (Date.now() > data.expiry) {
        this.memoryStore.delete(key);
        return null;
      }
      return data.value;
    }
  }

  async del(key) {
    if (this.enabled) {
      await this.redis.del(key);
    } else {
      this.memoryStore.delete(key);
    }
  }
}

module.exports = new TokenStore();
