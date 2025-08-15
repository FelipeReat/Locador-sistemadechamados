
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
    return allKeys.filter(key => key.includes(pattern.replace('*', '')));
  }
  
  async ping(): Promise<string> {
    return 'PONG';
  }
  
  on(event: string, callback: Function) {
    return this;
  }
}

let redis: Redis | MockRedis;
let redisSubscriber: Redis | MockRedis;
let isRedisAvailable = false;

// Test if Redis is available without spamming connections
async function testRedisConnection(): Promise<boolean> {
  try {
    const testClient = new Redis(REDIS_URL, {
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      lazyConnect: true,
      retryDelayOnFailover: 1000,
      maxRetriesPerRequest: 1,
    });

    await testClient.ping();
    await testClient.disconnect();
    return true;
  } catch (error) {
    return false;
  }
}

// Initialize Redis with better error handling
async function initializeRedis() {
  isRedisAvailable = await testRedisConnection();
  
  if (isRedisAvailable) {
    try {
      redis = new Redis(REDIS_URL, {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        connectTimeout: 5000,
        lazyConnect: true,
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 1,
      });

      redisSubscriber = new Redis(REDIS_URL, {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        connectTimeout: 5000,
        lazyConnect: true,
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 1,
      });

      redis.on('error', (error) => {
        console.warn('Redis connection lost, falling back to mock Redis');
        isRedisAvailable = false;
      });

      redis.on('connect', () => {
        console.log('Connected to Redis');
        isRedisAvailable = true;
      });

      console.log('Redis clients initialized');
    } catch (error) {
      console.warn('Failed to initialize Redis, using mock Redis');
      isRedisAvailable = false;
    }
  }
  
  if (!isRedisAvailable) {
    console.log('Using mock Redis for development');
    redis = new MockRedis();
    redisSubscriber = new MockRedis();
  }
}

// Initialize on import
initializeRedis().catch(() => {
  console.log('Redis initialization failed, using mock Redis');
  redis = new MockRedis();
  redisSubscriber = new MockRedis();
});

export { redis, redisSubscriber, isRedisAvailable };
export default redis;
