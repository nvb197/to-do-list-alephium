/**
 * useTaskContract.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central hook managing all application state and contract interactions.
 *
 * Future integration:
 *   - Add signer from @alephium/web3-react (useWallet().signer) to each call
 *   - Pass signer into each contractApi function
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react'
import {
    createTaskOnChain,
    validateTaskOnChain,
    failTaskOnChain,
    createSuperTaskOnChain,
} from '../services/contractApi'

// Local ID generator — replaced by on-chain taskId later
const generateId = () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export function useTaskContract() {
    // ─── Core state ──────────────────────────────────────────────────────────
    const [activeTasks, setActiveTasks] = useState([])
    const [history, setHistory] = useState([])
    // ⚠️ rewardPoolBalance is DERIVED from history — never tracked via useState
    // This avoids React StrictMode double-invoke doubling the balance.
    const [superTask, setSuperTask] = useState(null)

    // ─── Loading states ───────────────────────────────────────────────────────
    const [isCreatingTask, setIsCreatingTask] = useState(false)
    const [isCreatingSuperTask, setIsCreatingSuperTask] = useState(false)
    const [loadingTaskId, setLoadingTaskId] = useState(null) // taskId in progress
    const [loadingAction, setLoadingAction] = useState(null) // 'validate' | 'fail'
    const [loadingSuperTaskAction, setLoadingSuperTaskAction] = useState(null) // 'validate' | 'fail'

    // ─── Notifications ────────────────────────────────────────────────────────
    const [notification, setNotification] = useState(null)

    const showNotification = useCallback((type, message, txId = null) => {
        setNotification({ type, message, txId })
        setTimeout(() => setNotification(null), 5000)
    }, [])

    // ─── Reward pool starts at 0, will sync on-chain once contract is deployed ─
    // NOTE: fetchRewardPoolBalance() will be called here once the contract is live.

    // ─────────────────────────────────────────────────────────────────────────
    // createTask
    // ─────────────────────────────────────────────────────────────────────────
    const createTask = useCallback(async ({ title, deadline, alphAmount, failMode }) => {
        setIsCreatingTask(true)
        try {
            const txId = await createTaskOnChain({ title, deadline, alphAmount, failMode })

            const newTask = {
                id: generateId(),
                title,
                deadline,
                alphAmount: parseFloat(alphAmount),
                failMode,
                txId,
                createdAt: new Date().toISOString(),
                status: 'active',
            }

            setActiveTasks((prev) => [newTask, ...prev])
            // Reward pool is updated ONLY on task failure (see failTask below)

            showNotification('success', `Task "${title}" created successfully!`, txId)
            return newTask
        } catch (err) {
            showNotification('error', err.message || 'Error creating the task.')
            throw err
        } finally {
            setIsCreatingTask(false)
        }
    }, [showNotification])

    // ─────────────────────────────────────────────────────────────────────────
    // validateTask — Success
    //
    // FIX: Do NOT nest setHistory inside setActiveTasks updater.
    // React StrictMode invokes state updaters twice in dev, causing double entries.
    // Solution: read the task from the async closure, then call both setters independently.
    // ─────────────────────────────────────────────────────────────────────────
    const validateTask = useCallback(async (taskId) => {
        setLoadingTaskId(taskId)
        setLoadingAction('validate')
        try {
            const txId = await validateTaskOnChain({ taskId })

            // Read task from current state snapshot (safe in async context)
            setActiveTasks((prev) => {
                const task = prev.find((t) => t.id === taskId)
                if (task) {
                    // ✅ Single independent setHistory call — no double-invoke risk
                    const historyEntry = {
                        ...task,
                        status: 'success',
                        closedAt: new Date().toISOString(),
                        txId,
                    }
                    setHistory((h) => {
                        // Guard: prevent duplicates even under StrictMode double-invoke
                        if (h.some((e) => e.id === taskId && e.status === 'success')) return h
                        return [historyEntry, ...h]
                    })
                }
                return prev.filter((t) => t.id !== taskId)
            })

            showNotification('success', '🎉 Task validated! Your ALPH has been returned.', txId)
        } catch (err) {
            showNotification('error', err.message || 'Error validating the task.')
            throw err
        } finally {
            setLoadingTaskId(null)
            setLoadingAction(null)
        }
    }, [showNotification])

    // ─────────────────────────────────────────────────────────────────────────
    // failTask — Failure
    // ─────────────────────────────────────────────────────────────────────────
    const failTask = useCallback(async (taskId) => {
        setLoadingTaskId(taskId)
        setLoadingAction('fail')
        try {
            const txId = await failTaskOnChain({ taskId })

            setActiveTasks((prev) => {
                const task = prev.find((t) => t.id === taskId)
                if (task) {
                    const historyEntry = {
                        ...task,
                        status: 'failed',
                        closedAt: new Date().toISOString(),
                        txId,
                    }
                    setHistory((h) => {
                        // Guard: prevent duplicates under StrictMode double-invoke
                        if (h.some((e) => e.id === taskId && e.status === 'failed')) return h
                        return [historyEntry, ...h]
                    })
                    // ℹ️ Reward pool is re-derived from history — no manual update needed here.
                }
                return prev.filter((t) => t.id !== taskId)
            })

            showNotification('error', '💀 Task failed. Penalty has been applied.', txId)
        } catch (err) {
            showNotification('error', err.message || 'Error declaring task failure.')
            throw err
        } finally {
            setLoadingTaskId(null)
            setLoadingAction(null)
        }
    }, [showNotification])

    // ─────────────────────────────────────────────────────────────────────────
    // createSuperTask
    // ─────────────────────────────────────────────────────────────────────────
    const createSuperTask = useCallback(async ({ title, failMode }) => {
        setIsCreatingSuperTask(true)
        try {
            const txId = await createSuperTaskOnChain({ title })
            const newSuperTask = {
                id: generateId(),
                title,
                failMode,           // 'don-devs' | 'burn'
                txId,
                createdAt: new Date().toISOString(),
                status: 'active',
            }
            setSuperTask(newSuperTask)
            showNotification('success', `Super Task "${title}" created!`, txId)
            return newSuperTask
        } catch (err) {
            showNotification('error', err.message || 'Error creating the Super Task.')
            throw err
        } finally {
            setIsCreatingSuperTask(false)
        }
    }, [showNotification])

    // ─────────────────────────────────────────────────────────────────────────
    // validateSuperTask — Mark the Super Task as completed
    // ─────────────────────────────────────────────────────────────────────────
    const validateSuperTask = useCallback(async () => {
        if (!superTask) return
        setLoadingSuperTaskAction('validate')
        try {
            const txId = await validateTaskOnChain({ taskId: superTask.id })
            // ✅ Claim the pool: mark every unclaimed pool entry so the derived balance resets to 0
            setHistory((h) => [
                {
                    ...superTask,
                    type: 'super-task',
                    status: 'success',
                    closedAt: new Date().toISOString(),
                    txId,
                },
                ...h.map((entry) =>
                    entry.status === 'failed' && entry.failMode === 'reward-pool' && !entry.poolClaimed
                        ? { ...entry, poolClaimed: true }
                        : entry
                ),
            ])
            setSuperTask(null)
            showNotification('success', '🏆 Super Task completed! Reward Pool claimed!', txId)
        } catch (err) {
            showNotification('error', err.message || 'Error completing the Super Task.')
            throw err
        } finally {
            setLoadingSuperTaskAction(null)
        }
    }, [superTask, showNotification])

    // ─────────────────────────────────────────────────────────────────────────
    // failSuperTask — Mark the Super Task as failed, reset state
    // ─────────────────────────────────────────────────────────────────────────
    const failSuperTask = useCallback(async () => {
        if (!superTask) return
        setLoadingSuperTaskAction('fail')
        try {
            const txId = await failTaskOnChain({ taskId: superTask.id })
            // 💀 Pool is lost: mark all unclaimed pool entries so the derived balance resets to 0
            setHistory((h) => [
                {
                    ...superTask,
                    type: 'super-task',
                    status: 'failed',
                    closedAt: new Date().toISOString(),
                    txId,
                },
                ...h.map((entry) =>
                    entry.status === 'failed' && entry.failMode === 'reward-pool' && !entry.poolClaimed
                        ? { ...entry, poolClaimed: true }
                        : entry
                ),
            ])
            setSuperTask(null)
            showNotification('error', '💀 Super Task failed. The pool has been lost.', txId)
        } catch (err) {
            showNotification('error', err.message || 'Error failing the Super Task.')
            throw err
        } finally {
            setLoadingSuperTaskAction(null)
        }
    }, [superTask, showNotification])

    // ─── Derive reward pool balance from history (avoids StrictMode double-fire) ───
    // poolClaimed:true entries are excluded — they were claimed/lost by a Super Task lifecycle event
    const rewardPoolBalance = parseFloat(
        history
            .filter((t) => t.status === 'failed' && t.failMode === 'reward-pool' && !t.poolClaimed)
            .reduce((sum, t) => sum + Number(t.alphAmount), 0)
            .toFixed(4)
    )

    return {
        // State
        activeTasks,
        history,
        rewardPoolBalance,
        superTask,
        // Loading states
        isCreatingTask,
        isCreatingSuperTask,
        loadingTaskId,
        loadingAction,
        loadingSuperTaskAction,
        // Notification
        notification,
        // Actions
        createTask,
        validateTask,
        failTask,
        createSuperTask,
        validateSuperTask,
        failSuperTask,
    }
}
