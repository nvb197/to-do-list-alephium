import { useState, useEffect, useCallback, useRef } from 'react'
import { ListTodo, History, Clock, Plus, X, Wallet } from 'lucide-react'
import { useWallet, AlephiumConnectButton } from '@alephium/web3-react'

import Navbar from './components/Navbar'
import SuperTaskSection from './components/SuperTaskSection'
import CreateTaskForm from './components/CreateTaskForm'
import TaskList from './components/TaskList'
import HistorySection from './components/HistorySection'
import Notification from './components/Notification'
import { useTaskContract } from './hooks/useTaskContract'

const TABS = [
  { id: 'tasks', label: 'Tasks', Icon: ListTodo },
  { id: 'history', label: 'History', Icon: History },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('tasks')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Wallet connection state
  const { connectionStatus } = useWallet()
  const isConnected = connectionStatus === 'connected'
  const connectBtnRef = useRef(null)

  const handleRequestConnect = useCallback(() => {
    // Programmatically click the hidden AlephiumConnectButton
    connectBtnRef.current?.querySelector('button')?.click()
  }, [])

  const {
    activeTasks,
    history,
    rewardPoolBalance,
    superTask,
    isCreatingTask,
    isCreatingSuperTask,
    loadingTaskId,
    loadingAction,
    loadingSuperTaskAction,
    notification,
    createTask,
    validateTask,
    failTask,
    createSuperTask,
    validateSuperTask,
    failSuperTask,
  } = useTaskContract()

  // Fermer la modale avec Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setIsModalOpen(false)
  }, [])

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isModalOpen, handleKeyDown])

  // Après création réussie, on ferme la modale
  const handleCreateTask = async (data) => {
    await createTask(data)
    setIsModalOpen(false)
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient background orbs */}
      <div
        className="bg-orb w-96 h-96 opacity-10"
        style={{
          background: 'radial-gradient(circle, #00EDB3, transparent 70%)',
          top: '-80px',
          right: '-80px',
          animationDelay: '0s',
        }}
      />
      <div
        className="bg-orb w-80 h-80 opacity-8"
        style={{
          background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
          bottom: '100px',
          left: '-60px',
          animationDelay: '4s',
        }}
      />
      <div
        className="bg-orb w-64 h-64 opacity-6"
        style={{
          background: 'radial-gradient(circle, #a855f7, transparent 70%)',
          top: '40%',
          left: '50%',
          transform: 'translateX(-50%)',
          animationDelay: '2s',
        }}
      />

      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-20">

        {/* ── Section Super Task & Cagnotte ── */}
        <section aria-label="Super Task and Reward Pool" className="mb-6">
          <SuperTaskSection
            superTask={superTask}
            rewardPoolBalance={rewardPoolBalance}
            isCreatingSuperTask={isCreatingSuperTask}
            loadingSuperTaskAction={loadingSuperTaskAction}
            onCreateSuperTask={createSuperTask}
            onValidateSuperTask={validateSuperTask}
            onFailSuperTask={failSuperTask}
            onRequestConnect={handleRequestConnect}
          />
        </section>

        {/* ── Create Task Button ── */}
        <section aria-label="Create a new task" className="mb-8">
          {/* Hidden AlephiumConnectButton — triggered programmatically */}
          <div ref={connectBtnRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
            <AlephiumConnectButton />
          </div>

          <button
            id="open-create-task-modal-btn"
            onClick={() => isConnected ? setIsModalOpen(true) : handleRequestConnect()}
            className="w-full group flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-base transition-all duration-300 relative overflow-hidden"
            style={{
              background: 'rgba(0, 237, 179, 0.06)',
              border: '1px dashed rgba(0, 237, 179, 0.35)',
              color: '#00EDB3',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 237, 179, 0.1)'
              e.currentTarget.style.borderStyle = 'solid'
              e.currentTarget.style.boxShadow = '0 0 24px rgba(0, 237, 179, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 237, 179, 0.06)'
              e.currentTarget.style.borderStyle = 'dashed'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-transform duration-200 group-hover:scale-110"
              style={{ background: 'rgba(0, 237, 179, 0.15)' }}
            >
              {isConnected ? <Plus size={16} strokeWidth={2.5} /> : <Wallet size={16} strokeWidth={2} />}
            </div>
            {isConnected ? '+ Create a New Task' : 'Connect Wallet to Create'}
          </button>
        </section>

        {/* ── Tabs: Tasks / History ── */}
        <div className="mb-4">
          <div
            className="flex gap-1 p-1 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            role="tablist"
            aria-label="Sections principales"
          >
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id
              const count = id === 'tasks' ? activeTasks.length : history.length
              return (
                <button
                  key={id}
                  id={`tab-${id}`}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: isActive ? 'rgba(0,237,179,0.1)' : 'transparent',
                    color: isActive ? '#00EDB3' : 'rgba(255,255,255,0.35)',
                    border: isActive ? '1px solid rgba(0,237,179,0.25)' : '1px solid transparent',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  <Icon size={15} />
                  {label}
                  {count > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-bold animate-badge"
                      style={{
                        background: isActive ? 'rgba(0,237,179,0.2)' : 'rgba(255,255,255,0.08)',
                        color: isActive ? '#00EDB3' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Contenu des tabs ── */}
        <section role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'tasks' && (
            <div>
              {activeTasks.length > 0 && (
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Clock size={13} className="text-white/30" />
                  <span className="text-white/30 text-xs">
                    {activeTasks.length} task{activeTasks.length > 1 ? 's' : ''} in progress
                  </span>
                </div>
              )}
              <TaskList
                tasks={activeTasks}
                loadingTaskId={loadingTaskId}
                loadingAction={loadingAction}
                onValidate={validateTask}
                onFail={failTask}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <HistorySection history={history} />
          )}
        </section>
      </main>

      {/* ── Toast Notification ── */}
      <Notification notification={notification} />

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-white/20 text-xs">
          AlphTask · Built on{' '}
          <a
            href="https://alephium.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon hover:underline"
          >
            Alephium
          </a>
          {' '}· Testnet
        </p>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALE — Créer une nouvelle tâche
      ══════════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div
          id="create-task-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Create a new task"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
          onClick={(e) => {
            // Fermer si clic sur l'overlay (pas sur le contenu)
            if (e.target === e.currentTarget) setIsModalOpen(false)
          }}
        >
          <div
            className="w-full max-w-lg animate-slide-in relative"
            style={{
              background: 'rgba(5, 8, 20, 0.97)',
              border: '1px solid rgba(0, 237, 179, 0.25)',
              borderRadius: '24px',
              boxShadow: '0 0 60px rgba(0, 237, 179, 0.12), 0 32px 64px rgba(0,0,0,0.8)',
            }}
          >
            {/* Ligne de glow en haut de la modale */}
            <div
              style={{
                position: 'absolute',
                top: 0, left: '10%', right: '10%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(0,237,179,0.6), transparent)',
                borderRadius: '50%',
              }}
            />

            {/* Header de la modale */}
            <div className="flex items-center justify-between px-6 pt-6 pb-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,237,179,0.2), rgba(0,201,149,0.08))',
                    border: '1px solid rgba(0,237,179,0.3)',
                  }}
                >
                  <Plus size={18} className="text-neon" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-none"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    New Task
                  </h2>
                  <p className="text-white/30 text-xs mt-0.5">Create a task with real stakes</p>
                </div>
              </div>

              <button
                id="close-create-task-modal-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fermer"
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Divider */}
            <div className="divider mx-6" />

            {/* Corps de la modale = formulaire sans son propre header */}
            <div className="px-6 pb-6 pt-5">
              <CreateTaskForm
                isCreatingTask={isCreatingTask}
                onCreateTask={handleCreateTask}
                onRequestConnect={handleRequestConnect}
                inModal
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
