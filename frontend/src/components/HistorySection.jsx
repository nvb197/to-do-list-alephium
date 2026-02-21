import { History, CheckCircle2, XCircle, ExternalLink, CalendarDays, Zap, Trophy } from 'lucide-react'

const FAIL_MODE_LABELS = {
    'reward-pool': 'Reward Pool',
    'don-devs': 'Donated to Devs',
    'burn': 'Burned',
    // Legacy
    'cagnotte': 'Reward Pool',
}

const TESTNET_EXPLORER = 'https://testnet.alephium.org/transactions/'

function formatDate(isoStr) {
    return new Date(isoStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export default function HistorySection({ history }) {
    if (history.length === 0) {
        return (
            <div
                className="glass-card px-6 py-10 text-center animate-slide-in"
                style={{ animationDelay: '0.2s' }}
            >
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                    }}
                >
                    <History size={20} className="text-white/20" />
                </div>
                <p className="text-white/30 text-sm">No history yet</p>
                <p className="text-white/20 text-xs mt-1">Completed tasks will appear here</p>
            </div>
        )
    }

    const taskHistory = history.filter((t) => t.type !== 'super-task')
    const successCount = history.filter((t) => t.status === 'success').length
    const failCount = history.filter((t) => t.status === 'failed').length
    const totalAlphBack = taskHistory
        .filter((t) => t.status === 'success')
        .reduce((sum, t) => sum + (t.alphAmount || 0), 0)

    return (
        <div className="space-y-4 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Successes', value: successCount, color: '#34d399' },
                    { label: 'Failures', value: failCount, color: '#f87171' },
                    { label: 'ALPH Recovered', value: totalAlphBack.toFixed(2), color: '#00EDB3' },
                ].map(({ label, value, color }) => (
                    <div
                        key={label}
                        className="rounded-2xl px-4 py-3 text-center"
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                        }}
                    >
                        <p className="text-xs text-white/30 mb-1">{label}</p>
                        <p
                            className="font-bold text-lg"
                            style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Win rate */}
            {history.length > 0 && (
                <div
                    className="rounded-2xl px-4 py-3"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white/40 text-xs">Success rate</span>
                        <span className="text-neon font-bold text-sm">
                            {Math.round((successCount / history.length) * 100)}%
                        </span>
                    </div>
                    <div className="progress-bar-bg h-1.5">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${(successCount / history.length) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* List */}
            <div className="space-y-2">
                {history.map((task, idx) => {
                    const isSuccess = task.status === 'success'
                    const isSuperTask = task.type === 'super-task'

                    return (
                        <div
                            key={`${task.id}-${task.status}`}
                            className="glass-card px-5 py-4 flex items-center gap-4 animate-slide-in"
                            style={{ animationDelay: `${0.22 + idx * 0.04}s` }}
                        >
                            {/* Status icon */}
                            <div
                                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{
                                    background: isSuccess
                                        ? 'rgba(16,185,129,0.12)'
                                        : 'rgba(239,68,68,0.12)',
                                    border: isSuccess
                                        ? '1px solid rgba(16,185,129,0.25)'
                                        : '1px solid rgba(239,68,68,0.2)',
                                }}
                            >
                                {isSuperTask ? (
                                    <Trophy
                                        size={15}
                                        style={{ color: isSuccess ? '#34d399' : '#f87171' }}
                                    />
                                ) : isSuccess ? (
                                    <CheckCircle2 size={16} style={{ color: '#34d399' }} />
                                ) : (
                                    <XCircle size={16} style={{ color: '#f87171' }} />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    {isSuperTask && (
                                        <span
                                            className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                                            style={{
                                                background: 'rgba(0,237,179,0.1)',
                                                border: '1px solid rgba(0,237,179,0.2)',
                                                color: '#00EDB3',
                                            }}
                                        >
                                            Super Task
                                        </span>
                                    )}
                                </div>
                                <p className="text-white/80 font-medium text-sm truncate">{task.title}</p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <div className="flex items-center gap-1">
                                        <CalendarDays size={11} className="text-white/20" />
                                        <span className="text-white/25 text-xs">{formatDate(task.closedAt)}</span>
                                    </div>
                                    {task.alphAmount > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Zap size={11} className="text-white/20" />
                                            <span className="text-white/25 text-xs">{task.alphAmount} ALPH</span>
                                        </div>
                                    )}
                                    {task.failMode && !isSuccess && (
                                        <span className="text-white/25 text-xs">
                                            → {FAIL_MODE_LABELS[task.failMode] || task.failMode}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Badge + tx link */}
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                <span className={isSuccess ? 'badge-success' : 'badge-fail'}>
                                    {isSuccess ? '✅ Success' : '❌ Failed'}
                                </span>
                                {task.txId && (
                                    <a
                                        href={`${TESTNET_EXPLORER}${task.txId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-white/20 text-xs hover:text-neon transition-colors"
                                        title="View transaction"
                                    >
                                        <ExternalLink size={10} />
                                        <span className="font-mono">tx…{task.txId.slice(-6)}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
