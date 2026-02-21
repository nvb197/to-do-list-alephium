import { CheckCircle2, XCircle, Clock, Coins, Flame, Skull, Loader2, CalendarDays, Zap } from 'lucide-react'

const FAIL_MODE_LABELS = {
    'reward-pool': { label: 'Reward Pool', Icon: Coins, color: '#00EDB3' },
    'don-devs': { label: 'Support Devs', Icon: Flame, color: '#f59e0b' },
    'burn': { label: 'Burn', Icon: Skull, color: '#ef4444' },
    // Legacy fallback
    'cagnotte': { label: 'Reward Pool', Icon: Coins, color: '#00EDB3' },
}

function getDaysLeft(deadline) {
    const diff = new Date(deadline) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDeadline(deadline) {
    return new Date(deadline).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export default function TaskList({ tasks, loadingTaskId, loadingAction, onValidate, onFail }) {
    if (tasks.length === 0) {
        return (
            <div
                className="glass-card px-6 py-12 text-center animate-slide-in"
                style={{ animationDelay: '0.15s' }}
            >
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                    }}
                >
                    <Clock size={24} className="text-white/20" />
                </div>
                <p className="text-white/30 text-sm font-medium">No active tasks</p>
                <p className="text-white/20 text-xs mt-1">Create your first task above</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {tasks.map((task, idx) => {
                const daysLeft = getDaysLeft(task.deadline)
                const isOverdue = daysLeft < 0
                const isUrgent = daysLeft >= 0 && daysLeft <= 2
                const failModeInfo = FAIL_MODE_LABELS[task.failMode] || FAIL_MODE_LABELS['reward-pool']
                const FailIcon = failModeInfo.Icon

                const isThisLoading = loadingTaskId === task.id
                const isValidating = isThisLoading && loadingAction === 'validate'
                const isFailing = isThisLoading && loadingAction === 'fail'
                const isAnyLoading = isThisLoading

                return (
                    <div
                        key={task.id}
                        className="glass-card task-card p-5 animate-slide-in"
                        style={{
                            animationDelay: `${0.15 + idx * 0.05}s`,
                            opacity: isAnyLoading ? 0.8 : 1,
                        }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            {/* Left info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="badge-pending animate-badge">In Progress</span>
                                    {task.alphAmount > 0 && (
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                            style={{
                                                background: `${failModeInfo.color}18`,
                                                border: `1px solid ${failModeInfo.color}40`,
                                                color: failModeInfo.color,
                                            }}
                                        >
                                            <FailIcon size={10} className="inline mr-1" />
                                            {failModeInfo.label}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-white font-semibold text-base truncate mb-3">
                                    {task.title}
                                </h3>

                                <div className="flex items-center gap-4 flex-wrap">
                                    {/* Deadline */}
                                    <div className="flex items-center gap-1.5">
                                        <CalendarDays size={13} className="text-white/30" />
                                        <span className="text-white/40 text-xs">{formatDeadline(task.deadline)}</span>
                                        <span
                                            className="text-xs font-semibold ml-0.5"
                                            style={{
                                                color: isOverdue ? '#f87171' : isUrgent ? '#fbbf24' : '#00EDB3',
                                            }}
                                        >
                                            {isOverdue
                                                ? `⚠️ ${Math.abs(daysLeft)}d overdue`
                                                : daysLeft === 0
                                                    ? '⚡ Today!'
                                                    : `${daysLeft}d left`}
                                        </span>
                                    </div>

                                    {/* ALPH locked */}
                                    {task.alphAmount > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <Zap size={13} className="text-white/30" />
                                            <span className="text-white/70 text-xs font-semibold">
                                                {task.alphAmount} ALPH locked
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right actions */}
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                <button
                                    id={`validate-task-${task.id}`}
                                    onClick={() => onValidate(task.id)}
                                    disabled={isAnyLoading}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200"
                                    style={{
                                        background: isValidating
                                            ? 'rgba(16,185,129,0.15)'
                                            : 'rgba(16,185,129,0.1)',
                                        border: '1px solid rgba(16,185,129,0.25)',
                                        color: '#34d399',
                                        opacity: isFailing ? 0.4 : 1,
                                        cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isAnyLoading) {
                                            e.currentTarget.style.background = 'rgba(16,185,129,0.2)'
                                            e.currentTarget.style.boxShadow = '0 0 12px rgba(16,185,129,0.25)'
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
                                    {isValidating ? 'Confirming...' : '✅ Success'}
                                </button>

                                <button
                                    id={`fail-task-${task.id}`}
                                    onClick={() => onFail(task.id)}
                                    disabled={isAnyLoading}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200"
                                    style={{
                                        background: isFailing
                                            ? 'rgba(239,68,68,0.12)'
                                            : 'rgba(239,68,68,0.07)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        color: '#f87171',
                                        opacity: isValidating ? 0.4 : 1,
                                        cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isAnyLoading) {
                                            e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
                                            e.currentTarget.style.boxShadow = '0 0 12px rgba(239,68,68,0.2)'
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
                                    {isFailing ? 'Processing...' : '❌ Declare Fail'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
