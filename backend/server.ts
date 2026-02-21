import express, { Request, Response } from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import path from 'path'
import mongoose from 'mongoose'
import { web3, NodeProvider } from '@alephium/web3'
import { PrivateKeyWallet } from '@alephium/web3-wallet'

// .env is at project root (one level up from backend/)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
app.use(cors())
app.use(express.json())

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI || '')
  .then(() => console.log('🟢 MongoDB Connected!'))
  .catch(err => console.error('🔴 DB Connection Error:', err))

// 2. Database Schemas
const TaskSchema = new mongoose.Schema({
  title: String,
  userAddress: String,
  deadline: Number,      // Kept for UI display only
  amount: Number,        // Amount in ALPH
  penaltyMode: Number,   // 0: Cagnotte, 1: Dev
  contractAddress: String,
  status: { type: String, default: 'active' }
})
const Task = mongoose.model('Task', TaskSchema)

const User = mongoose.model('User', new mongoose.Schema({
  address: { type: String, unique: true },
  points: { type: Number, default: 0 }
}))

// 3. API: Save Task after User locks funds
app.post('/api/tasks', async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, userAddress, amount, deadline, penaltyMode, contractAddress } = req.body

    if (!contractAddress) {
      return res.status(400).json({ error: 'No contract address provided' })
    }

    const newTask = new Task({
      title,
      userAddress,
      deadline,
      amount,
      penaltyMode,
      contractAddress,
      status: 'active'
    })

    await newTask.save()
    res.json({ success: true, taskId: newTask._id, message: 'Task tracked on backend' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to save task' })
  }
})

// 4. API: Reward Points (Success)
app.post('/api/complete-task', async (req: Request, res: Response) => {
  try {
    const { taskId, userAddress } = req.body
    await User.findOneAndUpdate(
      { address: userAddress },
      { $inc: { points: 1 } },
      { upsert: true }
    )
    await Task.findByIdAndUpdate(taskId, { status: 'completed' })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Reward failed' })
  }
})

// 5. API: Penalize Status (Fail)
app.post('/api/penalize-task', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.body
    await Task.findByIdAndUpdate(taskId, { status: 'penalized' })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Update failed' })
  }
})

// 6. API: Release pool funds to Super Task winner (direct transfer from admin wallet)
app.post('/api/release-reward', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userAddress } = req.body
    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' })
    }

    // Setup admin signer (the admin wallet accumulates the pool funds)
    web3.setCurrentNodeProvider(new NodeProvider('https://node.testnet.alephium.org'))
    const adminWallet = new PrivateKeyWallet({
      privateKey: process.env.ADMIN_PRIVATE_KEY?.trim() || ''
    })

    // Calculate total pool from DB (all penalized reward-pool tasks)
    const poolTasks = await Task.find({ penaltyMode: 0, status: 'penalized' })
    const totalAlph = poolTasks.reduce((sum, t) => sum + (t.amount || 0), 0)

    if (totalAlph <= 0) {
      return res.status(400).json({ error: 'No funds in the reward pool' })
    }

    const ONE_ALPH_NANO = 1_000_000_000_000_000_000n
    const attoAlphAmount = BigInt(Math.floor(totalAlph * 1e18))

    console.log(`🏆 Releasing ${totalAlph} ALPH from pool → winner: ${userAddress}`)

    const result = await adminWallet.signAndSubmitTransferTx({
      signerAddress: adminWallet.address,
      destinations: [{ address: userAddress, attoAlphAmount }]
    })

    // Mark pool tasks as claimed
    await Task.updateMany({ penaltyMode: 0, status: 'penalized' }, { status: 'pool-claimed' })

    console.log(`✅ Pool released! txId: ${result.txId}`)
    res.json({ success: true, txId: result.txId })
  } catch (error: any) {
    console.error('❌ release-reward error:', error.message)
    res.status(500).json({ error: error.message || 'Failed to release pool' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Registrar Server running on port ${PORT}`)
})