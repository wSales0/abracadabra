import { MongoClient, Db } from 'mongodb'

// Conexão direta com os shards da réplica no MongoDB Atlas (evita falhas de resolução DNS SRV em Windows, Vercel e redes corporativas)
const DIRECT_REPLICA_URI =
  'mongodb://rny:eWEcZsZhZXDeM0Yf@ac-vsip0zs-shard-00-00.mohf51x.mongodb.net:27017,ac-vsip0zs-shard-00-01.mohf51x.mongodb.net:27017,ac-vsip0zs-shard-00-02.mohf51x.mongodb.net:27017/abracadabra?ssl=true&replicaSet=atlas-8mfh9z-shard-0&authSource=admin&retryWrites=true&w=majority'

const PRIMARY_URI = process.env.MONGODB_URI || DIRECT_REPLICA_URI
const DB_NAME = process.env.MONGODB_DB || 'abracadabra'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    try {
      await cachedDb.command({ ping: 1 })
      return { client: cachedClient, db: cachedDb }
    } catch {
      cachedClient = null
      cachedDb = null
    }
  }

  try {
    const client = new MongoClient(PRIMARY_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    })

    await client.connect()
    const db = client.db(DB_NAME)

    cachedClient = client
    cachedDb = db

    return { client, db }
  } catch (err: any) {
    console.warn('Conexão primária falhou, acionando rota direta de shards no Atlas:', err?.message)

    const fallbackClient = new MongoClient(DIRECT_REPLICA_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    })

    await fallbackClient.connect()
    const fallbackDb = fallbackClient.db(DB_NAME)

    cachedClient = fallbackClient
    cachedDb = fallbackDb

    return { client: fallbackClient, db: fallbackDb }
  }
}
