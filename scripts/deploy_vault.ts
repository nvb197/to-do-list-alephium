import { web3, NodeProvider } from '@alephium/web3'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { CagnotteVault } from '../artifacts/ts/CagnotteVault'
import * as dotenv from 'dotenv'

dotenv.config()

async function deploy() {
  const nodeProvider = new NodeProvider('https://node.testnet.alephium.org')
  web3.setCurrentNodeProvider(nodeProvider)
  
  // Using the key from your .env file
  const wallet = new PrivateKeyWallet({ 
    privateKey: process.env.ADMIN_PRIVATE_KEY?.trim() || ''
  })

  console.log('🚀 Deploying CagnotteVault to Testnet...')
  console.log('📍 Deployer Wallet:', wallet.address)

  const result = await CagnotteVault.deploy(wallet, {
    initialFields: {
      admin: wallet.address,
      isSuperTaskDone: false
    }
  })

  console.log('✅ Deployment SUCCESSFUL!')
  console.log('🎯 COPY THIS TO YOUR .env (CAGNOTTE_POOL_ADDRESS):', result.contractInstance.address)
}

deploy().catch((err) => {
  console.error('❌ Deployment failed:', err)
})