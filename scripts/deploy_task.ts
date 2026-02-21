import { NodeProvider } from '@alephium/web3'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { HackathonEscrow } from '../artifacts/ts/HackathonEscrow'
import * as dotenv from 'dotenv'

dotenv.config()

// Deploys a new honor-based task contract
export async function deployTaskContract(
  ownerAddress: string, 
  amount: bigint, 
  beneficiary: string
) {
  // 1. Setup Provider & Wallet
  const nodeProvider = new NodeProvider('https://node.testnet.alephium.org')
  const wallet = new PrivateKeyWallet({ 
    privateKey: process.env.ADMIN_PRIVATE_KEY || '', 
    nodeProvider 
  })

  console.log('🚀 Deploying new HackathonEscrow contract...')

  // 2. Deploying with the exact 3 parameters defined in the new contract
  const result = await HackathonEscrow.deploy(wallet, {
    initialFields: {
      owner: ownerAddress,
      lockedAmount: amount,
      beneficiary: beneficiary
    }
  })

  console.log('✅ Contract deployed at:', result.contractInstance.address)
  return result.contractInstance.address
}