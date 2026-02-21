import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AlephiumWalletProvider } from '@alephium/web3-react'
import './index.css'
import App from './App.jsx'

// Alephium Testnet Configuration
const walletConfig = {
  network: 'testnet',
  addressGroup: 0,
  onDisconnected: () => {
    console.log('Wallet disconnected')
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AlephiumWalletProvider
      network={walletConfig.network}
      addressGroup={walletConfig.addressGroup}
      onDisconnected={walletConfig.onDisconnected}
    >
      <App />
    </AlephiumWalletProvider>
  </StrictMode>,
)
