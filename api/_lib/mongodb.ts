import { MongoClient, Db } from 'mongodb'
import dns from 'dns'

// Garante que a resolução DNS de SRV (mongodb+srv) funcione perfeitamente em qualquer ambiente
try {
  if (dns && typeof dns.setServers === 'function') {
    dns.setServers(['8.8.8.8', '1.1.1.1'])
  }
} catch {
  // Ignora se não puder alterar servidores DNS
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://rny:eWEcZsZhZXDeM0Yf@cluster0.mohf51x.mongodb.net/?retryWrites=true&w=majority'

const DB_NAME = process.env.MONGODB_DB || 'abracadabra'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  })

  await client.connect()
  const db = client.db(DB_NAME)

  cachedClient = client
  cachedDb = db

  return { client, db }
}
