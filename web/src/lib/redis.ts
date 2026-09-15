import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
  const redisPassword = process.env.REDIS_PASSWORD || undefined;

  try {
    if (redisUrl) {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        lazyConnect: false,
        connectTimeout: 2000,
      });
    } else {
      redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        maxRetriesPerRequest: 1,
        lazyConnect: false,
        connectTimeout: 2000,
      });
    }
    redisClient.on("error", (err) => {
      console.error("[REDIS_ERROR] Redis connection error:", err.message);
    });
    return redisClient;
  } catch (err: any) {
    console.error("[REDIS_INIT_ERROR] Failed to initialize Redis client:", err.message);
    return null;
  }
}

export function setRedisClientForTesting(client: any) {
  redisClient = client;
}

/**
 * Atomically claims an event ID using Redis SET NX EX 600.
 * 
 * Returns:
 * - { status: 'claimed' } if key was set successfully (first time)
 * - { status: 'duplicate' } if key already exists
 * - { status: 'unavailable', error: string } if Redis is not reachable / fails
 */
export async function claimDistributedWebhookEvent(
  eventId: string,
  ttlSeconds: number = 600
): Promise<{ status: "claimed" | "duplicate" | "unavailable"; error?: string }> {
  const client = getRedisClient();
  if (!client) {
    return { status: "unavailable", error: "Redis client not initialized" };
  }

  const key = `whatsapp:webhook:${eventId}`;
  try {
    // Atomic SET key value EX ttl NX
    const result = await client.set(key, "processed", "EX", ttlSeconds, "NX");
    if (result === "OK") {
      return { status: "claimed" };
    }
    return { status: "duplicate" };
  } catch (err: any) {
    console.error("[REDIS_CLAIM_ERROR] Error executing SET NX EX:", err.message);
    return { status: "unavailable", error: err.message };
  }
}
