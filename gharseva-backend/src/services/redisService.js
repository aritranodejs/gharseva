const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isEnabled = process.env.REDIS_ENABLED === 'true';
  }

  async connect() {
    if (!this.isEnabled) return;
    try {
      this.client = redis.createClient({ url: process.env.REDIS_URL });
      this.client.on('error', (err) => console.error('Redis Client Error', err));
      await this.client.connect();
      console.log('Redis connected successfully for Assignment State');
    } catch (err) {
      console.warn('Could not connect to Redis, falling back to Memory... (Check if Redis is running)');
      this.isEnabled = false;
    }
  }

  async set(key, value, expirySec = 3600) {
    if (this.isEnabled && this.client) {
      await this.client.set(key, JSON.stringify(value), { EX: expirySec });
    }
  }

  async get(key) {
    if (this.isEnabled && this.client) {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  async del(key) {
    if (this.isEnabled && this.client) {
      await this.client.del(key);
    }
  }
}

module.exports = new RedisService();
