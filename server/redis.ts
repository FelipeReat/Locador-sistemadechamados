
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Mock Redis for development when Redis is not available
class MockRedis {
  private data: Map<string, string> = new Map();
  
  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }
  
  async set(key: string, value: string): Promise<string> {
    this.data.set(key, value);
    return 'OK';
  }
  
  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.data.set(key, value);
    // In a real implementation, you'd set a timeout to delete the key
    return 'OK';
  }
  
  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    keys.forEach(key => {
      if (this.data.delete(key)) deleted++;
    });
    return deleted;
  }
  
  async keys(pattern: string): Promise<string[]> {
    const allKeys = Array.from(this.data.keys());
    if (pattern === '*') return allKeys;
    // Simple pattern matching for cache keys
    return allKeys.filter(key => key.includes(pattern.replace('*', '')));
  }
  
  on(event: string, callback: Function) {
    // Mock event listener
    return this;
  }
}

let redis: Redis | MockRedis;
let redisSubscriber: Redis | MockRedis;

try {
  redis = new Redis(REDIS_URL, {
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    lazyConnect: true,
  });

  redisSubscriber = new Redis(REDIS_URL, {
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    lazyConnect: true,
  });

  redis.on('error', (error) => {
    console.warn('Redis not available, using mock Redis for development');
    redis = new MockRedis();
  });

  redis.on('connect', () => {
    console.log('Connected to Redis');
  });

  // Test connection
  redis.ping().catch(() => {
    console.warn('Redis not available, using mock Redis for development');
    redis = new MockRedis();
    redisSubscriber = new MockRedis();
  });

} catch (error) {
  console.warn('Redis not available, using mock Redis for development');
  redis = new MockRedis();
  redisSubscriber = new MockRedis();
}

export { redis, redisSubscriber };
export default redis;
