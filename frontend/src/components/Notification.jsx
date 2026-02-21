import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, X } from 'lucide-react'

const ICON_MAP = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
}

const COLOR_MAP = {
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '#34d399', text: '#34d399' },
    error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '#f87171', text: '#f87171' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '#fbbf24', text: '#fbbf24' },
}

const TESTNET_EXPLORER = 'https://testnet.alephium.org/transactions/'

export default function Notification({ notification, onDismiss }) {
    if (!notification) return null

    const { type, message, txId } = notification
    const colors = COLOR_MAP[type] || COLOR_MAP.success
    const Icon = ICON_MAP[type] || CheckCircle2

    return (
        <div
            className="fixed bottom-6 right-6 z-50 animate-slide-in flex items-start gap-3 px-5 py-4 rounded-2xl max-w-sm shadow-2xl"
            style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${colors.border}`,
            }}
            role="alert"
            id="toast-notification"
        >
            <Icon size={18} style={{ color: colors.icon, flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1 min-w-0">
                <p className="text-white/90 text-sm font-medium leading-snug">{message}</p>
                {txId && (
                    <a
                        href={`${TESTNET_EXPLORER}${txId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 mt-1.5 text-xs transition-colors"
                        style={{ color: colors.text, opacity: 0.8 }}
                    >
                        <ExternalLink size={10} />
                        <span className="font-mono">Voir la tx : {txId.slice(0, 10)}…</span>
                    </a>
                )}
            </div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
                    id="toast-dismiss-btn"
                    aria-label="Fermer la notification"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    )
}
