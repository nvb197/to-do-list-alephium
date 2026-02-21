/**
 * contractApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bridge entre le frontend React et le Smart Contract HackathonEscrow.
 *
 * ARCHITECTURE RÉELLE (honor system Web3) :
 *   1. CRÉER une tâche   → frontend déploie HackathonEscrow → envoie contractAddress au backend
 *   2. SUCCÈS (withdraw) → frontend exécute WithdrawScript → wallet signe → ALPH retournés owner
 *   3. ÉCHEC  (forfeit)  → frontend exécute ForfeitScript  → wallet signe → ALPH envoyés beneficiary
 *
 * Le backend (Express + MongoDB) est un registre :
 *   - POST /api/tasks          → enregistre la tâche avec le contractAddress
 *   - POST /api/complete-task  → passe status: 'completed', ajoute points
 *   - POST /api/penalize-task  → passe status: 'penalized'
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { web3, NodeProvider, convertAlphAmountWithDecimals, ONE_ALPH, contractIdFromAddress, binToHex } from '@alephium/web3'
import { HackathonEscrow } from '@artifacts/HackathonEscrow'
import { WithdrawScript, ForfeitScript } from '@artifacts/scripts'

// ─── Configuration ────────────────────────────────────────────────────────────
const NODE_URL = 'https://node.testnet.alephium.org'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

// Adresse de la Cagnotte (beneficiary quand penaltyMode = 0)
// C'est l'adresse du CagnotteVault ou une adresse fixe selon le backend
const CAGNOTTE_ADDRESS = import.meta.env.VITE_CAGNOTTE_ADDRESS || ''
// Adresse des devs (beneficiary quand penaltyMode = 1)
const DEVS_ADDRESS = import.meta.env.VITE_DEVS_ADDRESS || '14kMRpJyFrE6R23ZZN7d6XDdqLExDkGQpbhNY7tLzBu5'

// Dépôt de stockage minimum requis par Alephium pour un contrat (0.1 ALPH)
const STORAGE_DEPOSIT = ONE_ALPH / 10n

function ensureNodeProvider() {
    try { web3.getCurrentNodeProvider() }
    catch { web3.setCurrentNodeProvider(new NodeProvider(NODE_URL)) }
}

// Attend que la transaction soit confirmée sur la blockchain (polling toutes les 3s)
async function waitForTxConfirmation(txId, timeoutMs = 90000) {
    const provider = web3.getCurrentNodeProvider()
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        try {
            const status = await provider.transactions.getTransactionsStatus({ txId })
            if (status.type === 'Confirmed') {
                console.log('[contractApi] Transaction confirmée :', txId)
                return
            }
        } catch (_) { /* nœud pas encore au courant, on retente */ }
        await new Promise((r) => setTimeout(r, 3000))
    }
    throw new Error('Transaction non confirmée après 90 secondes. Vérifie le solde ALPH ou la connexion.')
}

// Convertit un float ALPH en attoALPH (BigInt)
function toAttoAlph(amount) {
    return convertAlphAmountWithDecimals(amount.toString())
        ?? BigInt(Math.round(Number(amount) * 1e18))
}

// Mapping failMode UI → adresse beneficiary on-chain
function toBeneficiaryAddress(failMode, fallbackAddress) {
    if (failMode === 'reward-pool') return CAGNOTTE_ADDRESS || fallbackAddress
    if (failMode === 'don-devs') return DEVS_ADDRESS
    if (failMode === 'burn') return DEVS_ADDRESS  // pas d'adresse burn officielle → devs
    return CAGNOTTE_ADDRESS || fallbackAddress
}

// ─────────────────────────────────────────────────────────────────────────────
// createTaskOnChain
//
// 1. Déploie un nouveau contrat HackathonEscrow (wallet de l'user signe le déploiement)
// 2. Enregistre la tâche dans la DB via POST /api/tasks
//
// Le nouveau contrat a uniquement : owner, lockedAmount, beneficiary
// → pas de systemAdmin, pas de completeOneTask — l'user contrôle tout seul.
//
// Retourne : { txId, contractAddress }
// ─────────────────────────────────────────────────────────────────────────────
export async function createTaskOnChain({ title, deadline, alphAmount, failMode, signer }) {
    if (!signer) throw new Error('Wallet non connecté. Connecte ton wallet avant de créer une tâche.')

    ensureNodeProvider()

    const signerAccount = await signer.getSelectedAccount()
    const ownerAddress = signerAccount.address
    const beneficiary = toBeneficiaryAddress(failMode, ownerAddress)
    const attoAlphToLock = toAttoAlph(alphAmount)

    console.log('[contractApi] Déploiement HackathonEscrow :', { title, alphAmount, failMode, beneficiary })

    // ── Étape 1 : Déploiement du contrat ──────────────────────────────────────
    // Le 3ème argument (0) = groupe de déploiement. Obligatoire quand le wallet
    // a une adresse "gl-secp256k1" (groupless). Correspond à addressGroup: 0 du wallet provider.
    const deployResult = await HackathonEscrow.deploy(signer, {
        initialFields: {
            owner: ownerAddress,
            lockedAmount: attoAlphToLock,
            beneficiary,
        },
        // Le contrat reçoit le stake de l'user + le dépôt de stockage obligatoire
        initialAttoAlphAmount: attoAlphToLock + STORAGE_DEPOSIT,
    }, 0)

    const { txId } = deployResult
    const contractAddress = deployResult.contractInstance.address

    console.log('[contractApi] Contrat déployé → txId:', txId, '| contractAddress:', contractAddress)

    // ── Attente de confirmation on-chain ──────────────────────────────────────
    // Le SDK retourne immédiatement après soumission, mais le contrat n'existe
    // sur la blockchain qu'une fois le bloc confirmé (~16-30s sur testnet).
    // Sans cette attente, forfeit/withdraw échouent avec "Contract does not exist".
    console.log('[contractApi] Attente de confirmation on-chain...')
    await waitForTxConfirmation(txId)


    // ── Étape 2 : Enregistrement en DB via le backend ─────────────────────────
    let backendTaskId = null
    try {
        const backendRes = await fetch(`${BACKEND_URL}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                userAddress: ownerAddress,
                amount: alphAmount,
                deadline,
                penaltyMode: failMode === 'reward-pool' ? 0 : 1,
                contractAddress,
            }),
        })
        const backendData = await backendRes.json()
        backendTaskId = backendData.taskId ?? null
        console.log('[contractApi] Backend enregistré → taskId:', backendTaskId)
    } catch (err) {
        // Non bloquant — le contrat est déjà déployé, la tâche existe on-chain
        console.warn('[contractApi] Enregistrement backend échoué (non bloquant):', err.message)
    }

    return { txId, contractAddress, taskId: backendTaskId }
}

// ─────────────────────────────────────────────────────────────────────────────
// validateTaskOnChain (Succès — withdraw)
//
// Exécute WithdrawScript : le wallet signe, le contrat transfère les ALPH → owner.
// Puis notifie le backend pour ajouter les points et passer status: 'completed'.
// ─────────────────────────────────────────────────────────────────────────────
export async function validateTaskOnChain({ contractAddress, taskId, signer }) {
    if (!signer) throw new Error('Wallet non connecté.')
    if (!contractAddress) throw new Error('Adresse du contrat manquante.')

    ensureNodeProvider()

    const escrowId = binToHex(contractIdFromAddress(contractAddress))
    console.log('[contractApi] WithdrawScript → contrat:', contractAddress)

    const signerAccount = await signer.getSelectedAccount()
    const result = await WithdrawScript.execute({
        signer,
        initialFields: { escrow: escrowId },
        signerAddress: signerAccount.address,
    })

    console.log('[contractApi] withdraw() signé. txId:', result.txId)

    // Notifie le backend (non bloquant)
    try {
        const signerAccount = await signer.getSelectedAccount()
        await fetch(`${BACKEND_URL}/api/complete-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, userAddress: signerAccount.address }),
        })
    } catch (err) {
        console.warn('[contractApi] /api/complete-task échoué (non bloquant):', err.message)
    }

    return result.txId
}

// ─────────────────────────────────────────────────────────────────────────────
// failTaskOnChain (Échec — forfeit)
//
// Exécute ForfeitScript : le wallet signe, le contrat transfère les ALPH → beneficiary.
// Puis notifie le backend pour passer status: 'penalized'.
// ─────────────────────────────────────────────────────────────────────────────
export async function failTaskOnChain({ contractAddress, taskId, signer }) {
    if (!signer) throw new Error('Wallet non connecté.')
    if (!contractAddress) throw new Error('Adresse du contrat manquante.')

    ensureNodeProvider()

    const escrowId = binToHex(contractIdFromAddress(contractAddress))
    console.log('[contractApi] ForfeitScript → contrat:', contractAddress)

    const signerAccount = await signer.getSelectedAccount()
    const result = await ForfeitScript.execute({
        signer,
        initialFields: { escrow: escrowId },
        signerAddress: signerAccount.address,
    })

    console.log('[contractApi] forfeit() signé. txId:', result.txId)

    // Notifie le backend (non bloquant)
    try {
        await fetch(`${BACKEND_URL}/api/penalize-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId }),
        })
    } catch (err) {
        console.warn('[contractApi] /api/penalize-task échoué (non bloquant):', err.message)
    }

    return result.txId
}

// ─────────────────────────────────────────────────────────────────────────────
// createSuperTaskOnChain — placeholder
// Le CagnotteVault est géré côté backend, pas encore d'API exposée.
// ─────────────────────────────────────────────────────────────────────────────
export async function createSuperTaskOnChain({ title }) {
    console.warn('[contractApi] createSuperTaskOnChain : pas d\'API backend pour la CagnotteVault.')
    return `local_super_${Date.now()}`
}
