/**
 * contractApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Couche d'abstraction pour les interactions avec le Smart Contract Alephium.
 *
 * ACTUELLEMENT : Les fonctions simulent des délais réseau (setTimeout) et
 * renvoient de fausses promesses pour permettre le développement du front-end
 * sans contrat déployé.
 *
 * PLUS TARD : Remplacez le corps de chaque fonction par les vrais appels
 * @alephium/web3 (ex: contractInstance.createTask(...), etc.).
 * L'interface des paramètres reste identique.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Constantes Testnet ────────────────────────────────────────────────────
export const DEAD_ADDRESS_TESTNET = '1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH' // Adresse morte pour burn
export const DEVS_ADDRESS_TESTNET = '14kMRpJyFrE6R23ZZN7d6XDdqLExDkGQpbhNY7tLzBu5' // Adresse des devs (placeholder)
export const SUPER_TASK_ADDRESS = '1GtbwTbzjBn5bDXsqSqKK5LJLTBRLUx8KCj6JKXPM3Ha' // Adresse du Super Task contract

// ─── Types utilitaires ─────────────────────────────────────────────────────

/**
 * @typedef {'cagnotte' | 'don-devs' | 'burn'} FailMode
 */

/**
 * @typedef {Object} TaskParams
 * @property {string} title       - Titre de la tâche
 * @property {string} deadline    - Deadline ISO string
 * @property {number} alphAmount  - Montant ALPH à bloquer (ex: 1.5)
 * @property {FailMode} failMode  - Mode d'échec choisi
 */

// ─── Simulateur de délai réseau ────────────────────────────────────────────
const simulateNetworkDelay = (ms = 2000) =>
    new Promise((resolve) => setTimeout(resolve, ms))

// ─── Simulateur d'erreur aléatoire (5% de chance) ─────────────────────────
const maybeThrow = (label) => {
    if (Math.random() < 0.05) {
        throw new Error(`[SIMULATED TX ERROR] ${label} failed. Try again.`)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// createTaskOnChain
// Crée une nouvelle tâche sur le smart contract.
//
// REMPLACEMENT FUTUR :
//   import { TaskContract } from '../artifacts/ts'
//   const contract = TaskContract.at(CONTRACT_ADDRESS)
//   const tx = await contract.transact.createTask({
//     signer,
//     args: { title, deadline: BigInt(new Date(deadline).getTime()), alphAmount: ... },
//     attoAlphAmount: convertAlphAmountWithDecimals(alphAmount),
//   })
//   return tx.txId
// ─────────────────────────────────────────────────────────────────────────────
export async function createTaskOnChain({ title, deadline, alphAmount, failMode }) {
    console.log('[contractApi] createTaskOnChain called with:', { title, deadline, alphAmount, failMode })
    await simulateNetworkDelay(2200)
    maybeThrow('createTask')

    // Retourne un faux txId
    const fakeTxId = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`
    console.log('[contractApi] createTaskOnChain success. txId:', fakeTxId)
    return fakeTxId
}

// ─────────────────────────────────────────────────────────────────────────────
// validateTaskOnChain
// Valide une tâche comme réussie → récupère le montant bloqué.
//
// REMPLACEMENT FUTUR :
//   const contract = TaskContract.at(CONTRACT_ADDRESS)
//   const tx = await contract.transact.validateTask({
//     signer,
//     args: { taskId },
//   })
//   return tx.txId
// ─────────────────────────────────────────────────────────────────────────────
export async function validateTaskOnChain({ taskId }) {
    console.log('[contractApi] validateTaskOnChain called with:', { taskId })
    await simulateNetworkDelay(1800)
    maybeThrow('validateTask')

    const fakeTxId = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`
    console.log('[contractApi] validateTaskOnChain success. txId:', fakeTxId)
    return fakeTxId
}

// ─────────────────────────────────────────────────────────────────────────────
// failTaskOnChain
// Déclare une tâche comme échouée → déclenche la pénalité selon le failMode.
//
// REMPLACEMENT FUTUR :
//   const contract = TaskContract.at(CONTRACT_ADDRESS)
//   const tx = await contract.transact.failTask({
//     signer,
//     args: { taskId },
//   })
//   return tx.txId
// ─────────────────────────────────────────────────────────────────────────────
export async function failTaskOnChain({ taskId }) {
    console.log('[contractApi] failTaskOnChain called with:', { taskId })
    await simulateNetworkDelay(2000)
    maybeThrow('failTask')

    const fakeTxId = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`
    console.log('[contractApi] failTaskOnChain success. txId:', fakeTxId)
    return fakeTxId
}

// ─────────────────────────────────────────────────────────────────────────────
// createSuperTaskOnChain
// Crée la Super Task unique (cagnotte globale).
//
// REMPLACEMENT FUTUR :
//   const contract = SuperTaskContract.at(SUPER_TASK_ADDRESS)
//   const tx = await contract.transact.createSuperTask({ signer })
//   return tx.txId
// ─────────────────────────────────────────────────────────────────────────────
export async function createSuperTaskOnChain({ title, deadline }) {
    console.log('[contractApi] createSuperTaskOnChain called with:', { title, deadline })
    await simulateNetworkDelay(2500)
    maybeThrow('createSuperTask')

    const fakeTxId = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`
    console.log('[contractApi] createSuperTaskOnChain success. txId:', fakeTxId)
    return fakeTxId
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchCagnotteBalance
// Récupère le solde actuel de la Cagnotte (Super Task pool).
//
// REMPLACEMENT FUTUR :
//   const contract = TaskContract.at(CONTRACT_ADDRESS)
//   const state = await contract.fetchState()
//   return Number(state.fields.cagnotteBalance) / 1e18
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchCagnotteBalance() {
    await simulateNetworkDelay(800)
    // Retourne un solde simulé qui augmente légèrement à chaque appel
    return parseFloat((Math.random() * 0.5).toFixed(4))
}
