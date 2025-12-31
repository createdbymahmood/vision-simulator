declare module 'rbush' {
  export interface RBushBBox {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }

  export default class RBush<T extends RBushBBox = RBushBBox> {
    clear(): void
    insert(item: T): void
    load(items: T[]): void
    search(bbox: RBushBBox): T[]
  }
}
