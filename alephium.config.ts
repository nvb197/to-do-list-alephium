import { Configuration } from '@alephium/cli'
import * as dotenv from 'dotenv'

dotenv.config()

const configuration: Configuration<any> = {
  networks: {
    testnet: {
      nodeUrl: 'https://node.testnet.alephium.org',
      networkId: 1,
      privateKeys: process.env.ADMIN_PRIVATE_KEY ? [process.env.ADMIN_PRIVATE_KEY] : [],
      settings: {}
    },
    devnet: { nodeUrl: 'http://localhost:22973', networkId: 4, privateKeys: [], settings: {} },
    mainnet: { nodeUrl: 'https://node.mainnet.alephium.org', networkId: 0, privateKeys: [], settings: {} }
  }
}

export default configuration