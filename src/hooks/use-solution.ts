import { useEffect, useRef, useState } from 'react'
import type { Objective, Solution, SolverEnchant } from '@/lib/solver'
import type { SolveRequest } from '@/lib/solver.worker'

export interface SolveState {
  solution: Solution | null
  pending: boolean
}

/** Runs the solver in a worker so large book merges never freeze the page. */
export function useSolution(enchants: SolverEnchant[], onItem: boolean, objective: Objective): SolveState {
  const worker = useRef<Worker | null>(null)
  const [result, setResult] = useState<{ key: string; solution: Solution | null }>({ key: '', solution: null })
  const key = JSON.stringify([enchants, onItem, objective])

  useEffect(() => {
    const w = new Worker(new URL('../lib/solver.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e: MessageEvent<{ key: string; solution: Solution | null }>) => setResult(e.data)
    worker.current = w
    return () => w.terminate()
  }, [])

  // The worker effect above runs first on mount, so it is always ready here.
  useEffect(() => {
    const [enchants, onItem, objective] = JSON.parse(key) as [SolverEnchant[], boolean, Objective]
    const request: SolveRequest = { key, enchants, onItem, objective }
    worker.current?.postMessage(request)
  }, [key])

  // Keep showing the previous answer (dimmed) until the reply for the current inputs arrives.
  return { solution: result.solution, pending: result.key !== key }
}
