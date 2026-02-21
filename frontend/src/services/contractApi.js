/**
 * contractApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Real contract interaction layer for the HackathonEscrow smart contract
 * deployed on Alephium Testnet.
 *
 * Contract architecture (one contract per task):
 *   - createTask  → deploys a new HackathonEscrow instance (locks ALPH)
 *   - validateTask → calls withdraw() on the deployed instance (returns ALPH to owner)
 *   - failTask    → UI-only action (contract has no fail fn; ALPH stays locked
 *                   until backend/admin handles it via completeOneTask + time-lock)
 *
 * All state-mutating calls require a `signer` (SignerProvider) from the user's
 * connected wallet via @alephium/web3-react's useWallet() hook.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { web3, NodeProvider, convertAlphAmountWithDecimals, ONE_ALPH } from '@alephium/web3'
import { HackathonEscrow } from '@artifacts/HackathonEscrow'

// ─── Network Configuration ────────────────────────────────────────────────────
const NODE_URL = 'https://node.testnet.alephium.org'

// Boot the Alephium node provider (idempotent — safe to call multiple times)
function ensureNodeProvider() {
    try {
        web3.getCurrentNodeProvider()
    } catch {
        web3.setCurrentNodeProvider(new NodeProvider(NODE_URL))
    }
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * The backend's systemAdmin address on Testnet.
 * This is the wallet whose private key is stored in .env (ADMIN_PRIVATE_KEY).
 * The contract's completeOneTask() can ONLY be called by this address.
 *
 * ⚠️  Replace this with your teammate's actual deployed admin address.
 *     You can get it by running: npx ts-node -e "import {PrivateKeyWallet} from '@alephium/web3-wallet'; import dotenv from 'dotenv'; dotenv.config(); const w = new PrivateKeyWallet({privateKey: process.env.ADMIN_PRIVATE_KEY}); console.log(w.address)"
 */
export const SYSTEM_ADMIN_ADDRESS = import.meta.env.VITE_SYSTEM_ADMIN_ADDRESS || ''

/**
 * Minimum ALPH (in attoALPH) the contract needs to store state on-chain.
 * Alephium requires at least 0.1 ALPH for contract storage rent.
 */
const CONTRACT_STORAGE_DEPOSIT = ONE_ALPH / 10n  // 0.1 ALPH

// ─── Helper: ALPH amount as BigInt attoALPH ──────────────────────────────────

function toAttoAlph(alphFloat) {
    return convertAlphAmountWithDecimals(alphFloat.toString()) ?? BigInt(Math.round(alphFloat * 1e18))
}

// ─────────────────────────────────────────────────────────────────────────────
// createTaskOnChain
//
// Deploys a fresh HackathonEscrow contract instance on Alephium Testnet.
// The user is the `owner`; their ALPH is locked inside the contract.
//
// Contract initialFields:
//   owner         — user's wallet address
//   systemAdmin   — backend admin address (calls completeOneTask)
//   targetTasks   — always 1 (one task = one contract)
//   completedTasks— starts at 0
//   lockedAmount  — the ALPH amount the user chose to lock
//
// Returns: { txId, contractAddress }
// ─────────────────────────────────────────────────────────────────────────────
export async function createTaskOnChain({ title, deadline, alphAmount, failMode, signer }) {
    if (!signer) throw new Error('Wallet not connected. Please connect before creating a task.')

    ensureNodeProvider()

    const signerAccount = await signer.getSelectedAccount()
    const ownerAddress = signerAccount.address

    // systemAdmin is required by the contract fields but never called in the honor-system flow
    // (targetTasks=0 means withdraw() is always available). Default to owner's own address.
    const adminAddress = SYSTEM_ADMIN_ADDRESS || ownerAddress

    console.log('[contractApi] Deploying HackathonEscrow for task:', title)
    console.log('[contractApi] Owner:', ownerAddress, '| Amount:', alphAmount, 'ALPH')

    const attoAlphToLock = toAttoAlph(alphAmount)

    // The contract must receive the locked amount + storage deposit on creation.
    // initialAttoAlphAmount = what the contract holds inside the escrow.
    // The transaction fee is additional and is NOT included here.
    const deployResult = await HackathonEscrow.deploy(signer, {
        initialFields: {
            owner: ownerAddress,
            systemAdmin: adminAddress,
            // targetTasks = 0 → condition (completedTasks >= targetTasks) is 0 >= 0 = TRUE immediately.
            // This means the user can call withdraw() on their own, without waiting for the backend.
            // The app works on the honor system: the user decides themselves if they succeeded or failed.
            targetTasks: 0n,
            completedTasks: 0n,
            lockedAmount: attoAlphToLock,
        },
        // Fund the contract with the user's stake + mandatory storage deposit
        initialAttoAlphAmount: attoAlphToLock + CONTRACT_STORAGE_DEPOSIT,
    })

    console.log('[contractApi] Contract deployed. txId:', deployResult.txId, '| contractAddress:', deployResult.contractInstance.address)
    return {
        txId: deployResult.txId,
        contractAddress: deployResult.contractInstance.address,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// validateTaskOnChain (Success)
//
// Calls withdraw() on the user's task contract.
// Requires:
//   1. The backend has called completeOneTask() on this contract (completedTasks >= targetTasks)
//   2. The caller is the owner (checked in the contract with checkCaller!)
//
// On success: ALPH is returned to owner and the contract self-destructs.
// Returns: txId (string)
// ─────────────────────────────────────────────────────────────────────────────
export async function validateTaskOnChain({ contractAddress, signer }) {
    if (!signer) throw new Error('Wallet not connected.')
    if (!contractAddress) throw new Error('No contract address for this task. Was it deployed on-chain?')

    ensureNodeProvider()

    console.log('[contractApi] Calling withdraw() on contract:', contractAddress)

    const contractInstance = HackathonEscrow.at(contractAddress)

    const result = await contractInstance.transact.withdraw({
        signer,
        // No args needed — the contract checks callerAddress!() and completedTasks internally
    })

    console.log('[contractApi] withdraw() success. txId:', result.txId)
    return result.txId
}

// ─────────────────────────────────────────────────────────────────────────────
// failTaskOnChain (Failure — UI-level only for regular tasks)
//
// ⚠️  The HackathonEscrow contract does NOT have a failTask() function.
//     There is no on-chain mechanism for the owner to voluntarily forfeit their ALPH.
//     The "fail" action in the UI is handled locally (moves task to history as "failed").
//
//     In the real product flow:
//     - The backend monitors deadlines.
//     - If a task expires, the backend does NOT call completeOneTask().
//     - The ALPH stays locked. The admin can drain it server-side or via a separate admin fn.
//
//     For now this function is a no-op that resolves immediately.
//     A fake txId is returned so the UI flow stays consistent.
// ─────────────────────────────────────────────────────────────────────────────
export async function failTaskOnChain({ taskId, contractAddress, signer }) {
    console.warn('[contractApi] failTaskOnChain: No on-chain fail function exists in HackathonEscrow.')
    console.warn('[contractApi] Marking task as failed LOCALLY. ALPH remains locked in contract:', contractAddress || 'N/A (was never deployed)')

    // Return a pseudo txId so callers don't need to special-case this
    const pseudoTxId = `local_fail_${taskId || Date.now()}`
    return pseudoTxId
}

// ─────────────────────────────────────────────────────────────────────────────
// createSuperTaskOnChain
//
// ⚠️ The Super Task is NOT backed by a separate smart contract in this repo.
//    The backend/teammate has only provided HackathonEscrow (single-task escrow).
//    Super Task creation is kept as a UI-only placeholder.
//
//    To connect this to a real contract, your teammate would need to deploy a
//    separate aggregation/pool contract and export its artifacts.
// ─────────────────────────────────────────────────────────────────────────────
export async function createSuperTaskOnChain({ title }) {
    console.warn('[contractApi] createSuperTaskOnChain: No on-chain Super Task contract found in artifacts. Keeping as UI placeholder.')
    const pseudoTxId = `local_super_${Date.now()}`
    return pseudoTxId
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchContractState
//
// Fetches the current on-chain state of a HackathonEscrow contract instance.
// Useful for displaying live completedTasks / lockedAmount in the UI.
// Returns null if the contract address is not yet available.
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchContractState(contractAddress) {
    if (!contractAddress) return null
    ensureNodeProvider()

    try {
        const instance = HackathonEscrow.at(contractAddress)
        const state = await instance.fetchState()
        return {
            owner: state.fields.owner,
            systemAdmin: state.fields.systemAdmin,
            targetTasks: Number(state.fields.targetTasks),
            completedTasks: Number(state.fields.completedTasks),
            lockedAmount: Number(state.fields.lockedAmount) / 1e18,
        }
    } catch (err) {
        // Contract may have been destroyed (after withdraw) — not an error state
        console.warn('[contractApi] fetchContractState failed (contract may be destroyed):', err.message)
        return null
    }
}

// ─── Re-export constants for use in components ────────────────────────────────
export const DEAD_ADDRESS_TESTNET = '1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH'
export const DEVS_ADDRESS_TESTNET = '14kMRpJyFrE6R23ZZN7d6XDdqLExDkGQpbhNY7tLzBu5'
export const SUPER_TASK_ADDRESS = '1GtbwTbzjBn5bDXsqSqKK5LJLTBRLUx8KCj6JKXPM3Ha'
