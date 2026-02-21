import express, { Request, Response } from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

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
    res.json({ success: true, message: 'Task tracked on backend' })
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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Registrar Server running on port ${PORT}`)
})