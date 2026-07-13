import { registerSW } from 'virtual:pwa-register'

type PwaUpdateStatus = 'idle' | 'checking' | 'available' | 'updating' | 'offline-ready' | 'error'

interface PwaUpdateState {
  status: PwaUpdateStatus
  message: string
  lastCheckedAt: number | null
}

const listeners = new Set<() => void>()

let state: PwaUpdateState = {
  status: 'idle',
  message: 'App is up to date.',
  lastCheckedAt: null,
}

let registration: ServiceWorkerRegistration | undefined
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null
let checkTimeout: ReturnType<typeof setTimeout> | null = null
let registrationWaiters: Array<(registration: ServiceWorkerRegistration | undefined) => void> = []

function emit() {
  listeners.forEach((listener) => listener())
}

function setState(next: Partial<PwaUpdateState>) {
  state = { ...state, ...next }
  emit()
}

function clearCheckTimeout() {
  if (checkTimeout) {
    clearTimeout(checkTimeout)
    checkTimeout = null
  }
}

function resolveRegistrationWaiters(swRegistration: ServiceWorkerRegistration | undefined) {
  registrationWaiters.forEach((resolve) => resolve(swRegistration))
  registrationWaiters = []
}

function waitForRegistration(timeoutMs = 2500) {
  if (registration) return Promise.resolve(registration)

  return new Promise<ServiceWorkerRegistration | undefined>((resolve) => {
    const timeout = setTimeout(() => {
      registrationWaiters = registrationWaiters.filter((waiter) => waiter !== wrappedResolve)
      resolve(undefined)
    }, timeoutMs)

    const wrappedResolve = (swRegistration: ServiceWorkerRegistration | undefined) => {
      clearTimeout(timeout)
      resolve(swRegistration)
    }

    registrationWaiters.push(wrappedResolve)
  })
}

export function initPwaUpdater() {
  if (updateServiceWorker) return

  updateServiceWorker = registerSW({
    onNeedRefresh() {
      clearCheckTimeout()
      setState({
        status: 'available',
        message: 'A new version is ready to install.',
        lastCheckedAt: Date.now(),
      })
    },
    onOfflineReady() {
      setState({
        status: 'offline-ready',
        message: 'Offline support is ready.',
      })
    },
    onRegistered(swRegistration) {
      registration = swRegistration
      resolveRegistrationWaiters(swRegistration)
    },
    onRegisterError(error) {
      clearCheckTimeout()
      resolveRegistrationWaiters(undefined)
      setState({
        status: 'error',
        message: error.message || 'Could not register offline updates.',
        lastCheckedAt: Date.now(),
      })
    },
  })
}

export function subscribePwaUpdates(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getPwaUpdateState() {
  return state
}

export async function checkForPwaUpdates() {
  clearCheckTimeout()
  setState({
    status: 'checking',
    message: 'Checking for updates…',
    lastCheckedAt: Date.now(),
  })

  const activeRegistration = registration ?? await waitForRegistration()

  if (!activeRegistration) {
    setState({
      status: 'idle',
      message: 'Update service is still initializing. Try again in a moment.',
      lastCheckedAt: Date.now(),
    })
    return
  }

  try {
    await activeRegistration.update()
    checkTimeout = setTimeout(() => {
      if (state.status === 'checking') {
        setState({
          status: 'idle',
          message: 'You already have the latest version.',
          lastCheckedAt: Date.now(),
        })
      }
    }, 1800)
  } catch (error) {
    setState({
      status: 'error',
      message: error instanceof Error ? error.message : 'Could not check for updates.',
      lastCheckedAt: Date.now(),
    })
  }
}

export async function applyPwaUpdate() {
  if (!updateServiceWorker) {
    setState({
      status: 'idle',
      message: 'Update service is still initializing. Try again in a moment.',
      lastCheckedAt: Date.now(),
    })
    return
  }

  clearCheckTimeout()
  setState({
    status: 'updating',
    message: 'Installing update…',
    lastCheckedAt: Date.now(),
  })

  try {
    await updateServiceWorker(true)
  } catch (error) {
    setState({
      status: 'error',
      message: error instanceof Error ? error.message : 'The update could not be installed. Your draft remains saved.',
      lastCheckedAt: Date.now(),
    })
  }
}
