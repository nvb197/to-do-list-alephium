import express, { Request, Response } from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import mongoose from 'mongoose'
import { deployTaskContract } from './scripts/deploy_task'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// 1. Connect MongoDB
mongoose.connect(process.env.MONGO_URI || '')
  .then(() => console.log('🟢 MongoDB Connected!'))
  .catch(err => console.error('🔴 DB Error:', err))

// 2. Database Schemas
const UserSchema = new mongoose.Schema({
  address: { type: String, unique: true, required: true },
  points: { type: Number, default: 0 }
})
const User = mongoose.model('User', UserSchema)

const TaskSchema = new mongoose.Schema({
  title: String,
  userAddress: String,
  deadline: Number, // Unix timestamp in milliseconds (saved for UI display only)
  amount: Number,
  penaltyMode: Number, // 0: Cagnotte Pool, 1: Dev Donate
  contractAddress: String,
  status: { type: String, default: 'active' }
})
const Task = mongoose.model('Task', TaskSchema)

// 3. API: Create Task & Lock Funds
app.post('/api/tasks', async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, userAddress, amount, deadline, penaltyMode } = req.body
    
    // Determine where the money goes if the user fails
    const beneficiary = penaltyMode === 0 
      ? process.env.CAGNOTTE_POOL_ADDRESS 
      : process.env.DEV_WALLET_ADDRESS

    if (!beneficiary) {
      return res.status(400).json({ error: 'Missing beneficiary address in .env' })
    }

    // Convert amount to ALPH decimals (1 ALPH = 10^18)
    const alphAmount = BigInt(Math.round(amount * 1e18))
    
    // Deploy Escrow Contract via Backend Wallet (Only 3 arguments)
    const contractAddress = await deployTaskContract(
      userAddress, 
      alphAmount, 
      beneficiary
    )

    // Save to DB (We still save the deadline here for the UI to display)
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

    res.json({ success: true, contractAddress })
  } catch (error) {
    console.error('Task Creation Error:', error)
    res.status(500).json({ error: 'Failed to deploy task to blockchain' })
  }
})

// 4. API: Reward Points (Called by Frontend AFTER successful Withdraw tx)
app.post('/api/complete-task', async (req: Request, res: Response): Promise<any> => {
  try {
    const { taskId, userAddress } = req.body
    
    // Give user 1 point
    await User.findOneAndUpdate(
      { address: userAddress },
      { $inc: { points: 1 } },
      { upsert: true }
    )
    
    // Update task status
    await Task.findByIdAndUpdate(taskId, { status: 'completed' })
    res.json({ success: true, message: 'Points rewarded!' })
  } catch (error) {
    res.status(500).json({ error: 'Process failed' })
  }
})

// 5. API: Update Penalty Status (Called by Frontend AFTER successful Forfeit tx)
app.post('/api/penalize-task', async (req: Request, res: Response): Promise<any> => {
  try {
    const { taskId } = req.body
    
    // Update task status to penalized
    await Task.findByIdAndUpdate(taskId, { status: 'penalized' })
    res.json({ success: true, message: 'Task marked as penalized.' })
  } catch (error) {
    res.status(500).json({ error: 'Process failed' })
  }
})

// 6. Start Server
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Hackathon Server running on port ${PORT} (Honor System / Web3 Mode)`)
})