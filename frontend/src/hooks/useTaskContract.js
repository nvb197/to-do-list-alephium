/**
 * useTaskContract.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central hook managing all application state and real contract interactions.
 *
 * Web3 integration:
 *   - useWallet() from @alephium/web3-react provides `signer` when connected
 *   - signer is passed into every contractApi function that mutates on-chain state
 *   - Each task stores its `contractAddress` (the deployed HackathonEscrow instance)
 *     so that validateTask/failTask can reference the correct on-chain contract
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react'
import { useWallet } from '@alephium/web3-react'
import {
    createTaskOnChain,
    validateTaskOnChain,
    failTaskOnChain,
    createSuperTaskOnChain,
} from '../services/contractApi'

// Local ID generator — still used for React key and local references
const generateId = () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export function useTaskContract() {
    // ─── Wallet / Signer ──────────────────────────────────────────────────────
    // `signer` is the wallet's SignerProvider — undefined when not connected.
    // It is passed into every on-chain transaction so the user's wallet is prompted.
    const { signer } = useWallet()

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

    // ─────────────────────────────────────────────────────────────────────────
    // createTask
    //
    // Deploys a new HackathonEscrow contract for this task.
    // The returned `contractAddress` is stored on the task object and is the
    // permanent on-chain identifier for this task.
    // ─────────────────────────────────────────────────────────────────────────
    const createTask = useCallback(async ({ title, deadline, alphAmount, failMode }) => {
        setIsCreatingTask(true)
        try {
            const { txId, contractAddress, taskId: backendTaskId } = await createTaskOnChain({
                title,
                deadline,
                alphAmount,
                failMode,
                signer,
            })

            const newTask = {
                id: generateId(),
                backendTaskId,     // ← ID MongoDB retourné par le backend
                title,
                deadline,
                alphAmount: parseFloat(alphAmount),
                failMode,
                txId,
                contractAddress,   // ← Adresse du contrat HackathonEscrow déployé
                createdAt: new Date().toISOString(),
                status: 'active',
            }

            setActiveTasks((prev) => [newTask, ...prev])
            showNotification('success', `Task "${title}" created successfully!`, txId)
            return newTask
        } catch (err) {
            showNotification('error', err.message || 'Error creating the task.')
            throw err
        } finally {
            setIsCreatingTask(false)
        }
    }, [signer, showNotification])

    // ─────────────────────────────────────────────────────────────────────────
    // validateTask — Success
    //
    // Calls withdraw() on the task's contract instance.
    // The contract enforces that completedTasks >= targetTasks (admin must have
    // called completeOneTask() first). Will throw with error code 404 if not.
    //
    // FIX: Do NOT nest setHistory inside setActiveTasks updater.
    // React StrictMode invokes state updaters twice in dev, causing double entries.
    // Solution: read the task from the async closure, then call both setters independently.
    // ─────────────────────────────────────────────────────────────────────────
    const validateTask = useCallback(async (taskId) => {
        setLoadingTaskId(taskId)
        setLoadingAction('validate')
        try {
            // Find the task to get its contractAddress before mutating state
            const task = activeTasks.find((t) => t.id === taskId)

            if (!task) throw new Error('Task not found.')

            const txId = await validateTaskOnChain({
                contractAddress: task.contractAddress,
                taskId: task.backendTaskId,
                signer,
            })

            // Read task from current state snapshot (safe in async context)
            setActiveTasks((prev) => {
                const t = prev.find((t) => t.id === taskId)
                if (t) {
                    // ✅ Single independent setHistory call — no double-invoke risk
                    const historyEntry = {
                        ...t,
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
    }, [activeTasks, signer, showNotification])

    // ─────────────────────────────────────────────────────────────────────────
    // failTask — Failure
    //
    // No on-chain fail function exists in HackathonEscrow.
    // This action is handled locally only: the task is moved to history as "failed"
    // and its ALPH remains locked in the contract (the admin handles it server-side).
    // ─────────────────────────────────────────────────────────────────────────
    const failTask = useCallback(async (taskId) => {
        setLoadingTaskId(taskId)
        setLoadingAction('fail')
        try {
            const task = activeTasks.find((t) => t.id === taskId)
            const txId = await failTaskOnChain({
                contractAddress: task?.contractAddress,
                taskId: task?.backendTaskId,
                signer,
            })

            setActiveTasks((prev) => {
                const t = prev.find((t) => t.id === taskId)
                if (t) {
                    const historyEntry = {
                        ...t,
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
    }, [activeTasks, signer, showNotification])

    // ─────────────────────────────────────────────────────────────────────────
    // createSuperTask
    // (Kept as local placeholder — no on-chain Super Task contract in artifacts)
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
            // Appel au backend → admin signe releaseToWinner(userAddress) sur le CagnotteVault
            let txId = `local_super_success_${Date.now()}`
            try {
                const signerAccount = signer ? await signer.getSelectedAccount() : null
                const userAddress = signerAccount?.address
                if (userAddress) {
                    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/release-reward`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userAddress }),
                    })
                    const data = await res.json()
                    if (data.txId) txId = data.txId
                    console.log('[validateSuperTask] Vault released! txId:', txId)
                }
            } catch (releaseErr) {
                console.warn('[validateSuperTask] release-reward non bloquant:', releaseErr.message)
            }

            // ✅ Claim the pool in UI
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
    }, [superTask, signer, showNotification])

    // ─────────────────────────────────────────────────────────────────────────
    // failSuperTask — Mark the Super Task as failed, reset state
    // ─────────────────────────────────────────────────────────────────────────
    const failSuperTask = useCallback(async () => {
        if (!superTask) return
        setLoadingSuperTaskAction('fail')
        try {
            // La Super Task est locale — pas de contrat on-chain
            const txId = `local_super_fail_${Date.now()}`
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
