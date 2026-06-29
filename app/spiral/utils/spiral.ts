export type SpiralMotionConfig = {
  angleGap: number
  baseRadius: number
  centerOffsetY: number
  verticalGap: number
}

export type PlaneTransform = {
  rotationY: number
  x: number
  y: number
  z: number
}

export type CanvasRect = {
  height: number
  left: number
  top: number
  width: number
}

export type ViewportSize = {
  height: number
  width: number
}

export type AmbientMotionConfig = {
  desktopSpeed: number
  mobileSpeed: number
}

export function supportsWebGL() {
  if (typeof document === 'undefined') return false

  try {
    const canvas = document.createElement('canvas')
    const context = (
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl')
    ) as WebGLRenderingContext | WebGL2RenderingContext | null

    if (!context) return false

    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export function getAmbientOffsetDelta(
  deltaMs: number,
  isMobile: boolean,
  prefersReducedMotion: boolean,
  config: AmbientMotionConfig
) {
  if (prefersReducedMotion) return 0

  const seconds = Math.max(deltaMs, 0) / 1000
  const speed = isMobile ? config.mobileSpeed : config.desktopSpeed
  return seconds * speed
}

export function getCanvasViewportSize(
  rect: Pick<CanvasRect, 'height' | 'width'>,
  fallback: ViewportSize
): ViewportSize {
  return {
    height: rect.height > 0 ? rect.height : fallback.height,
    width: rect.width > 0 ? rect.width : fallback.width
  }
}

export function getNormalizedCanvasPointer(
  clientX: number,
  clientY: number,
  rect: CanvasRect
) {
  const width = Math.max(rect.width, 1)
  const height = Math.max(rect.height, 1)

  return {
    x: ((clientX - rect.left) / width) * 2 - 1,
    y: -((clientY - rect.top) / height) * 2 + 1
  }
}

export function createLoopItems<T>(items: readonly T[], minCount = 18) {
  if (items.length === 0) return []
  let result = [...items]
  while (result.length < minCount) {
    result = [...result, ...items]
  }
  return result
}

export function getPlaneTransform(
  index: number,
  scrollOffset: number,
  itemCount: number,
  hiddenProgress: number,
  config: SpiralMotionConfig
): PlaneTransform {
  const centerIndex = Math.floor(itemCount / 2)
  const wrappedIndex = ((index - scrollOffset) % itemCount + itemCount) % itemCount
  const relativeIndex = wrappedIndex - centerIndex
  const angle = relativeIndex * config.angleGap
  const radius = config.baseRadius * (1 - hiddenProgress / 2)

  return {
    rotationY: -angle + Math.PI / 2,
    x: Math.cos(angle) * radius,
    y: relativeIndex * config.verticalGap + config.centerOffsetY,
    z: Math.sin(angle) * radius
  }
}
