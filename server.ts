import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import mongoose from 'mongoose'
import { web3, NodeProvider } from '@alephium/web3'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// --- 1. CONNECT TO MONGODB ATLAS ---
const mongoUri = process.env.MONGO_URI || ''
mongoose.connect(mongoUri)
  .then(() => console.log('🟢 MongoDB Atlas Connected!'))
  .catch(err => console.error('🔴 MongoDB Connection Error:', err))

// --- 2. CONFIGURE ALEPHIUM TESTNET ---
const nodeUrl = 'https://node.testnet.alephium.org'
web3.setCurrentNodeProvider(new NodeProvider(nodeUrl))

// --- 3. HEALTH CHECK API ---
app.get('/', (req, res) => {
  res.json({ message: '🚀 To-Do List Blockchain Backend is running smoothly!' })
})

// --- 4. START THE SERVER ---
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
  console.log(`🟢 Connected to Alephium Testnet: ${nodeUrl}`)
})