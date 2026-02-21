import { useState, forwardRef, useRef } from 'react'
import DatePicker from 'react-datepicker'
import { fr } from 'date-fns/locale'
import { Loader2, Flame, Coins, Plus, CalendarDays, Wallet } from 'lucide-react'
import { useWallet } from '@alephium/web3-react'

import 'react-datepicker/dist/react-datepicker.css'
import '../styles/datepicker-dark.css'

const FAIL_MODES = [
    {
        id: 'reward-pool',
        label: 'Super Task Pool',
        description: 'Send ALPH to your ultimate goal.',
        icon: Coins,
        color: '#00EDB3',
    },
    {
        id: 'don-devs',
        label: 'Support the Devs',
        description: 'Send ALPH to the creators to help improve this platform.',
        icon: Flame,
        color: '#f59e0b',
    },
]

const INITIAL_FORM = {
    title: '',
    deadline: null,
    alphAmount: '',
    failMode: 'reward-pool',
}

/* Custom dark input for react-datepicker */
// eslint-disable-next-line react/display-name
const DateInput = forwardRef(({ value, onClick, placeholder }, ref) => (
    <button
        type="button"
        ref={ref}
        onClick={onClick}
        id="task-deadline"
        className="input-dark w-full px-4 py-3 text-sm flex items-center justify-between gap-2"
        style={{ cursor: 'pointer', textAlign: 'left' }}
    >
        <span style={{ color: value ? '#e2e8f0' : 'rgba(255,255,255,0.25)' }}>
            {value || placeholder}
        </span>
        <CalendarDays size={15} style={{ color: 'rgba(0,237,179,0.5)', flexShrink: 0 }} />
    </button>
))

/**
 * CreateTaskForm
 * @param {boolean} inModal  - If true, renders without the glass-card wrapper
 * @param {function} onRequestConnect - Called when user clicks "Connect Wallet" in disconnected state
 */
export default function CreateTaskForm({ isCreatingTask, onCreateTask, inModal = false, onRequestConnect }) {
    const { connectionStatus } = useWallet()
    const isConnected = connectionStatus === 'connected'

    const [form, setForm] = useState(INITIAL_FORM)

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const isValid = form.title.trim() !== '' && form.deadline !== null

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!isConnected) {
            onRequestConnect?.()
            return
        }
        if (!isValid || isCreatingTask) return

        await onCreateTask({
            title: form.title.trim(),
            deadline: form.deadline.toISOString(),
            alphAmount: parseFloat(form.alphAmount) || 0,
            failMode: form.failMode,
        })
        setForm(INITIAL_FORM)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const content = (
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
                <label
                    className="block text-white/50 text-xs mb-1.5 font-medium tracking-wide uppercase"
                    htmlFor="task-title"
                >
                    Title *
                </label>
                <input
                    id="task-title"
                    type="text"
                    required={isConnected}
                    autoComplete="off"
                    className="input-dark w-full px-4 py-3 text-sm"
                    placeholder="e.g. Finish the authentication module..."
                    value={form.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    autoFocus={inModal}
                />
            </div>

            {/* Deadline + ALPH Amount */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label
                        className="block text-white/50 text-xs mb-1.5 font-medium tracking-wide uppercase"
                        htmlFor="task-deadline"
                    >
                        Deadline *
                    </label>
                    <DatePicker
                        selected={form.deadline}
                        onChange={(date) => handleChange('deadline', date)}
                        minDate={today}
                        locale={fr}
                        dateFormat="dd MMM yyyy"
                        placeholderText="Pick a date"
                        customInput={<DateInput placeholder="Pick a date" />}
                        popperPlacement="bottom-start"
                    />
                </div>

                <div>
                    <label
                        className="block text-white/50 text-xs mb-1.5 font-medium tracking-wide uppercase"
                        htmlFor="task-alph-amount"
                    >
                        ALPH to lock
                    </label>
                    <div className="relative">
                        <input
                            id="task-alph-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            autoComplete="off"
                            className="input-dark w-full px-4 py-3 pr-14 text-sm"
                            placeholder="0.00"
                            value={form.alphAmount}
                            onChange={(e) => handleChange('alphAmount', e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 text-xs font-semibold pointer-events-none select-none">
                            ALPH
                        </span>
                    </div>
                </div>
            </div>

            {/* Failure Mode — always visible */}
            <div>
                <label className="block text-white/50 text-xs mb-2 font-medium tracking-wide uppercase">
                    Failure Mode
                </label>
                <div className="grid grid-cols-1 gap-2">
                    {FAIL_MODES.map((mode) => {
                        const Icon = mode.icon
                        const isActive = form.failMode === mode.id
                        return (
                            <button
                                type="button"
                                key={mode.id}
                                id={`fail-mode-${mode.id}`}
                                onClick={() => handleChange('failMode', mode.id)}
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

            {/* Submit — adapts to connection state */}
            <div className="pt-1">
                {isConnected ? (
                    <button
                        type="submit"
                        id="create-task-submit-btn"
                        className="btn-neon w-full py-3.5 text-sm flex items-center justify-center gap-2"
                        disabled={!isValid || isCreatingTask}
                    >
                        {isCreatingTask ? (
                            <>
                                <Loader2 size={16} className="spinner" />
                                <span>Transaction in progress...</span>
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                <span>Create Task</span>
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        type="button"
                        id="create-task-connect-btn"
                        onClick={() => onRequestConnect?.()}
                        className="btn-neon w-full py-3.5 text-sm flex items-center justify-center gap-2"
                        style={{
                            background: 'rgba(0,237,179,0.08)',
                            border: '1px solid rgba(0,237,179,0.3)',
                        }}
                    >
                        <Wallet size={16} />
                        <span>Connect Wallet to Create</span>
                    </button>
                )}
            </div>
        </form>
    )

    if (inModal) return content

    return (
        <div className="glass-card p-6 animate-slide-in" style={{ animationDelay: '0.1s' }}>
            {content}
        </div>
    )
}
