import { AlephiumConnectButton } from '@alephium/web3-react'
import { Sparkles } from 'lucide-react'

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
            style={{
                background: 'rgba(3, 7, 18, 0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center w-9 h-9 rounded-xl"
                    style={{
                        background: 'linear-gradient(135deg, #00EDB3, #00c995)',
                        boxShadow: '0 0 16px rgba(0, 237, 179, 0.5)',
                    }}
                >
                    <Sparkles size={18} color="#030712" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-neon font-bold text-lg tracking-tight"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        AlphTask
                    </span>
                    <span className="text-xs text-white/30 tracking-widest uppercase">Web3 · Testnet</span>
                </div>
            </div>

            {/* Wallet connect button */}
            <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-white/30 px-3 py-1.5 rounded-full"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Testnet
                </span>
                <AlephiumConnectButton />
            </div>
        </nav>
    )
}
