import { useState } from 'react'
import { Trophy, Plus, Loader2, Zap, CheckCircle2, XCircle, Flame, Wallet } from 'lucide-react'
import { useWallet } from '@alephium/web3-react'

/* ─── Failure modes available for a Super Task ──────────────────────────── */
const SUPER_FAIL_MODES = [
    {
        id: 'don-devs',
        label: 'Support the Devs',
        description: 'Send ALPH to the creators to help improve this platform.',
        icon: Flame,
        color: '#f59e0b',
    },
]

export default function SuperTaskSection({
    superTask,
    rewardPoolBalance,
    isCreatingSuperTask,
    loadingSuperTaskAction,
    onCreateSuperTask,
    onValidateSuperTask,
    onFailSuperTask,
    onRequestConnect,
}) {
    const { connectionStatus } = useWallet()
    const isConnected = connectionStatus === 'connected'

    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState('')
    const [failMode, setFailMode] = useState('don-devs')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!isConnected) {
            onRequestConnect?.()
            return
        }
        if (!title.trim()) return
        await onCreateSuperTask({ title: title.trim(), failMode })
        setShowForm(false)
        setTitle('')
        setFailMode('don-devs')
    }

    const isActionLoading = !!loadingSuperTaskAction
    const isValidating = loadingSuperTaskAction === 'validate'
    const isFailing = loadingSuperTaskAction === 'fail'

    return (
        <div className="glass-card-glow p-6 animate-slide-in" style={{ animationDelay: '0.05s' }}>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center justify-center w-10 h-10 rounded-xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,237,179,0.2), rgba(0,201,149,0.1))',
                            border: '1px solid rgba(0,237,179,0.3)',
                        }}
                    >
                        <Trophy size={20} className="text-neon" />
                    </div>
                    <div>
                        <h2
                            className="text-white font-bold text-lg"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                            Super Task
                        </h2>
                        <p className="text-white/40 text-xs">Ultimate goal · Reward Pool</p>
                    </div>
                </div>

                {/* Reward Pool balance */}
                <div className="text-right">
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">Reward Pool</p>
                    <div className="flex items-baseline gap-1.5">
                        <span
                            className="text-2xl font-bold text-neon-glow"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                            {rewardPoolBalance.toFixed(4)}
                        </span>
                        <span className="text-white/50 text-sm font-medium">ALPH</span>
                    </div>
                </div>
            </div>

            <div className="divider mb-5" />

            {/* ─── Main content ─── */}
            {superTask ? (
                /* Active Super Task */
                <div className="animate-slide-in">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-white/40 text-xs uppercase tracking-wider">Active Super Task</span>
                    </div>

                    <p className="text-white font-semibold text-base mb-1">{superTask.title}</p>

                    {/* Failure mode badge */}
                    {superTask.failMode && (() => {
                        const mode = SUPER_FAIL_MODES.find((m) => m.id === superTask.failMode)
                        if (!mode) return null
                        const Icon = mode.icon
                        return (
                            <div className="flex items-center gap-1.5 mb-4">
                                <Icon size={11} style={{ color: mode.color, opacity: 0.7 }} />
                                <span className="text-xs" style={{ color: `${mode.color}99` }}>
                                    If failed → {mode.label}
                                </span>
                            </div>
                        )
                    })()}

                    {/* Reward pool stat */}
                    <div
                        className="rounded-xl p-3 mb-4"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                        }}
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <Zap size={13} className="text-white/40" />
                            <span className="text-white/40 text-xs">Current Reward Pool</span>
                        </div>
                        <p className="text-neon font-bold text-base">{rewardPoolBalance.toFixed(4)} ALPH</p>
                        <p className="text-white/30 text-xs mt-0.5">Accumulated from failed tasks</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            id="validate-super-task-btn"
                            onClick={onValidateSuperTask}
                            disabled={isActionLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200"
                            style={{
                                background: isValidating ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
                                border: '1px solid rgba(16,185,129,0.25)',
                                color: '#34d399',
                                opacity: isFailing ? 0.45 : 1,
                                cursor: isActionLoading ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActionLoading) {
                                    e.currentTarget.style.background = 'rgba(16,185,129,0.2)'
                                    e.currentTarget.style.boxShadow = '0 0 14px rgba(16,185,129,0.25)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(16,185,129,0.1)'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            {isValidating ? (
                                <Loader2 size={13} className="spinner" />
                            ) : (
                                <CheckCircle2 size={13} />
                            )}
                            {isValidating ? 'Processing...' : '✅ Goal Achieved!'}
                        </button>

                        <button
                            id="fail-super-task-btn"
                            onClick={onFailSuperTask}
                            disabled={isActionLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200"
                            style={{
                                background: isFailing ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.07)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: '#f87171',
                                opacity: isValidating ? 0.45 : 1,
                                cursor: isActionLoading ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActionLoading) {
                                    e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
                                    e.currentTarget.style.boxShadow = '0 0 14px rgba(239,68,68,0.2)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.07)'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            {isFailing ? (
                                <Loader2 size={13} className="spinner" />
                            ) : (
                                <XCircle size={13} />
                            )}
                            {isFailing ? 'Processing...' : '❌ Mark as Failed'}
                        </button>
                    </div>
                </div>
            ) : showForm ? (
                /* Creation form */
                <form onSubmit={handleSubmit} className="space-y-4 animate-slide-in">
                    {/* Title */}
                    <div>
                        <label className="block text-white/60 text-xs mb-1.5 font-medium">
                            Super Task title *
                        </label>
                        <input
                            type="text"
                            required={isConnected}
                            autoComplete="off"
                            autoFocus
                            className="input-dark w-full px-4 py-3 text-sm"
                            placeholder="e.g. Ship my first Web3 project..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            id="super-task-title"
                        />
                        <p className="text-white/25 text-xs mt-1.5">
                            No deadline — a Super Task is a timeless ultimate goal.
                        </p>
                    </div>

                    {/* Failure Mode — same UI as CreateTaskForm */}
                    <div>
                        <label className="block text-white/50 text-xs mb-2 font-medium tracking-wide uppercase">
                            Failure Mode
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {SUPER_FAIL_MODES.map((mode) => {
                                const Icon = mode.icon
                                const isActive = failMode === mode.id
                                return (
                                    <button
                                        type="button"
                                        key={mode.id}
                                        id={`super-fail-mode-${mode.id}`}
                                        onClick={() => setFailMode(mode.id)}
                                        className="radio-option text-left"
                                        style={
                                            isActive
                                                ? {
                                                    borderColor: `${mode.color}50`,
                                                    color: mode.color,
                                                    background: `${mode.color}0A`,
                                                }
                                                : {}
                                        }
                                    >
                                        <Icon
                                            size={15}
                                            style={{ color: isActive ? mode.color : undefined, flexShrink: 0 }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="font-semibold text-sm">{mode.label}</span>
                                            <span className="block text-xs opacity-50 mt-0.5 leading-snug">
                                                {mode.description}
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setTitle(''); setFailMode('don-devs') }}
                            className="btn-ghost flex-1 py-3 text-sm"
                            id="super-task-cancel-btn"
                        >
                            Cancel
                        </button>

                        {isConnected ? (
                            <button
                                type="submit"
                                className="btn-neon flex-1 py-3 text-sm flex items-center justify-center gap-2"
                                disabled={isCreatingSuperTask || !title.trim()}
                                id="super-task-submit-btn"
                            >
                                {isCreatingSuperTask ? (
                                    <>
                                        <Loader2 size={15} className="spinner" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trophy size={15} />
                                        <span>Set Super Task</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                id="super-task-connect-btn"
                                onClick={() => onRequestConnect?.()}
                                className="btn-neon flex-1 py-3 text-sm flex items-center justify-center gap-2"
                                style={{
                                    background: 'rgba(0,237,179,0.08)',
                                    border: '1px solid rgba(0,237,179,0.3)',
                                }}
                            >
                                <Wallet size={15} />
                                <span>Connect Wallet to Create</span>
                            </button>
                        )}
                    </div>
                </form>
            ) : (
                /* Call-to-action */
                <div className="text-center py-2">
                    <p className="text-white/40 text-sm mb-4">
                        Set your ultimate goal. ALPH from failed tasks will fuel this reward pool.
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn-neon px-6 py-3 text-sm flex items-center gap-2 mx-auto"
                        id="create-super-task-btn"
                    >
                        <Plus size={16} />
                        Set Super Task
                    </button>
                </div>
            )}
        </div>
    )
}
