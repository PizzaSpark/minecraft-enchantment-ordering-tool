import { solve, type Objective, type SolverEnchant } from './solver'

export interface SolveRequest {
  key: string
  enchants: SolverEnchant[]
  onItem: boolean
  objective: Objective
}

self.onmessage = (e: MessageEvent<SolveRequest>) => {
  const { key, enchants, onItem, objective } = e.data
  self.postMessage({ key, solution: solve(enchants, onItem, objective) })
}
