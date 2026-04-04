let simulationCanvasModulePromise: Promise<
  typeof import('./simulation-canvas')
> | null = null

export const loadSimulationCanvasModule = () => {
  if (!simulationCanvasModulePromise) {
    simulationCanvasModulePromise = import('./simulation-canvas')
  }

  return simulationCanvasModulePromise
}
