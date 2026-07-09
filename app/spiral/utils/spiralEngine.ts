import {
  DataTexture,
  DoubleSide,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three'
import type { Texture } from 'three'
import { spiralConfig, type Project } from '../data/projects'
import {
  createLoopItems,
  getAmbientOffsetDelta,
  getCanvasViewportSize,
  getNormalizedCanvasPointer,
  getPlaneTransform,
  supportsWebGL
} from './spiral'

export interface SpiralShowcaseEngineOptions {
  canvasHost: HTMLElement;
  projects: Project[];
  scrollProgressRef: { readonly current: number };
  onProjectClick: (slug: string) => void;
  onHoverChange: (project: Project | null) => void;
  onWebGLUnavailable: () => void;
}

type PlaneState = {
  hiddenProgress: number
  hiddenTarget: number
  hoverProgress: number
  hoverTarget: number
  isHidden: boolean
  projectIndex: number
  slug: string
}

type ShowcaseUniforms = {
  uColorStrength: { value: number }
  uImageSizes: { value: Vector2 }
  uPlaneSizes: { value: Vector2 }
  uRevealProgress: { value: number }
  uScrollSpeed: { value: number }
  uTexture: { value: Texture | null }
  uZoom: { value: number }
}

type ShowcaseMaterial = ShaderMaterial & {
  uniforms: ShowcaseUniforms
}

type ShowcaseMesh = Mesh<PlaneGeometry, ShowcaseMaterial> & {
  userData: PlaneState
}

const SCROLL_OFFSET_EASE = 0.12
const SCROLL_SPEED_EASE = 0.18
const SCROLL_SPEED_MULTIPLIER = 2.25
const MAX_SHADER_SCROLL_SPEED = 0.12
const AMBIENT_MOTION = {
  desktopSpeed: 0.08,
  mobileSpeed: 0.05
}
const AMBIENT_SHADER_SCROLL_SPEED = 0.018

const VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  uniform float uScrollSpeed;

  const float PI = 3.14159265359;

  void main() {
    vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vec3 curvedPosition = position;
    curvedPosition.z = sin(uv.x * PI) * 0.200;

    vec4 modelPosition = modelMatrix * vec4(curvedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    viewPosition.x += pow(worldPosition.y, 2.0) * 0.1;
    viewPosition.x += sin(uv.y * PI) * uScrollSpeed * 0.750;

    gl_Position = projectionMatrix * viewPosition;
    vUv = uv;
    vWorldPosition = worldPosition;
  }
`

const FRAGMENT_SHADER = `
  uniform sampler2D uTexture;
  uniform float uColorStrength;
  uniform float uZoom;
  uniform vec2 uPlaneSizes;
  uniform vec2 uImageSizes;
  uniform float uRevealProgress;

  varying vec2 vUv;

  float roundedRect(vec2 uv, vec2 size, float radius) {
    vec2 distance = abs(uv - 0.5) - size * 0.5 + radius;
    return length(max(distance, 0.0)) - radius;
  }

  vec4 blurredBack(vec2 uv) {
    float spread = 0.0390625;
    vec4 color = vec4(0.0);
    color += texture2D(uTexture, uv + vec2(-spread, -spread));
    color += texture2D(uTexture, uv + vec2(0.0, -spread)) * 2.0;
    color += texture2D(uTexture, uv + vec2(spread, -spread));
    color += texture2D(uTexture, uv + vec2(-spread, 0.0)) * 2.0;
    color += texture2D(uTexture, uv) * 4.0;
    color += texture2D(uTexture, uv + vec2(spread, 0.0)) * 2.0;
    color += texture2D(uTexture, uv + vec2(-spread, spread));
    color += texture2D(uTexture, uv + vec2(0.0, spread)) * 2.0;
    color += texture2D(uTexture, uv + vec2(spread, spread));
    return color / 16.0;
  }

  void main() {
    vec2 ratio = vec2(
      min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
      min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
    );
    vec2 coveredUv = vUv * ratio + (1.0 - ratio) * 0.5;
    vec2 zoomedUv = (coveredUv - 0.5) / uZoom + 0.5;
    vec4 color = gl_FrontFacing ? texture2D(uTexture, zoomedUv) : blurredBack(coveredUv);

    if (gl_FrontFacing) {
      color.rgb = mix(color.rgb, vec3(0.0), uColorStrength);
    }

    float reveal = clamp(uRevealProgress, 0.0, 1.0);
    float radius = 0.05 * reveal;
    float shape = roundedRect(vUv, vec2(reveal), radius);
    float opacity = 1.0 - smoothstep(0.0, 0.002, shape);
    opacity *= smoothstep(0.1, 1.0, reveal);

    gl_FragColor = vec4(color.rgb, opacity);
  }
`

const setHidden = (mesh: ShowcaseMesh, hidden: boolean) => {
  mesh.userData.isHidden = hidden
  mesh.userData.hiddenTarget = hidden ? 1 : 0
}

export class SpiralShowcaseEngine {
  private canvasHost: HTMLElement
  private projects: Project[]
  private scrollProgressRef: { readonly current: number }
  private onProjectClick: (slug: string) => void
  private onHoverChange: (project: Project | null) => void
  private onWebGLUnavailable: () => void

  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private raycaster: Raycaster | null = null
  private geometry: PlaneGeometry | null = null
  private animationFrameId: number = 0
  private previousFrameTime: number = 0
  private hoveredMesh: ShowcaseMesh | null = null
  private meshes: ShowcaseMesh[] = []
  private visibilityTimers: Set<NodeJS.Timeout> = new Set()
  private lastHoveredSlug: string = ''
  private observer: IntersectionObserver | null = null
  private resizeObserver: ResizeObserver | null = null
  private isLoopRunning: boolean = false
  private isInView: boolean = false
  private hasInitialized: boolean = false

  private hasHover: boolean = true
  private canvasWidth: number = 0
  private canvasRect: DOMRect | null = null

  private ambientOffset: number = 0
  private easedScrollOffset: number = 0
  private currentOffset: number = 0
  private shaderScrollSpeed: number = 0
  private scrollSpeed: number = 0
  private prefersReducedMotion: boolean = false
  private isMobile: boolean = false

  private activePointerId: number | null = null
  private pointerStartX: number = 0
  private lastPointerX: number = 0
  private pointer: Vector2 = new Vector2(2, 2)
  private didDrag: boolean = false

  private reducedMotionMediaQuery: MediaQueryList | null = null
  private prefersHoverMediaQuery: MediaQueryList | null = null

  constructor(options: SpiralShowcaseEngineOptions) {
    this.canvasHost = options.canvasHost
    this.projects = options.projects
    this.scrollProgressRef = options.scrollProgressRef
    this.onProjectClick = options.onProjectClick
    this.onHoverChange = options.onHoverChange
    this.onWebGLUnavailable = options.onWebGLUnavailable

    this.init()
  }

  private init() {
    this.prefersHoverMediaQuery = window.matchMedia('(hover: hover)')
    this.hasHover = this.prefersHoverMediaQuery.matches

    this.reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.prefersReducedMotion = this.reducedMotionMediaQuery.matches

    this.reducedMotionMediaQuery.addEventListener('change', this.handleMotionChange)

    this.setupObservers()
    this.setupDOMEvents()
  }

  private handleMotionChange = (e: MediaQueryListEvent) => {
    this.prefersReducedMotion = e.matches
  }

  private setupObservers() {
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const isNear = entry.isIntersecting
        this.isInView = isNear

        if (isNear) {
          if (!this.hasInitialized) {
            this.hasInitialized = true
            void this.createScene()
          } else if (!this.isLoopRunning) {
            this.isLoopRunning = true
            this.previousFrameTime = performance.now()
            this.animationFrameId = requestAnimationFrame(this.animate)
          }
        } else {
          if (this.isLoopRunning) {
            cancelAnimationFrame(this.animationFrameId)
            this.isLoopRunning = false
          }
        }
      },
      { rootMargin: '300px', threshold: 0 }
    )
    this.observer.observe(this.canvasHost)

    this.resizeObserver = new ResizeObserver(() => {
      this.resize()
    })
    this.resizeObserver.observe(this.canvasHost)
  }

  private setupDOMEvents() {
    this.canvasHost.addEventListener('click', this.handleCanvasClick)
    this.canvasHost.addEventListener('pointerdown', this.handlePointerDown)
    this.canvasHost.addEventListener('pointermove', this.handlePointerMove)
    this.canvasHost.addEventListener('pointerup', this.handlePointerUp)
    this.canvasHost.addEventListener('pointercancel', this.handlePointerCancel)
    this.canvasHost.addEventListener('keydown', this.handleKeyDown)
  }

  private removeDOMEvents() {
    this.canvasHost.removeEventListener('click', this.handleCanvasClick)
    this.canvasHost.removeEventListener('pointerdown', this.handlePointerDown)
    this.canvasHost.removeEventListener('pointermove', this.handlePointerMove)
    this.canvasHost.removeEventListener('pointerup', this.handlePointerUp)
    this.canvasHost.removeEventListener('pointercancel', this.handlePointerCancel)
    this.canvasHost.removeEventListener('keydown', this.handleKeyDown)
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      this.handleCanvasClick()
    }
  }

  private clearVisibilityTimers() {
    this.visibilityTimers.forEach((timer) => clearTimeout(timer))
    this.visibilityTimers.clear()
  }

  private scheduleVisibility(hidden: boolean) {
    this.clearVisibilityTimers()
    this.meshes.forEach((mesh, index) => {
      const delay = (index % 4) * (hidden ? 30 : 50)
      const timer = setTimeout(() => {
        setHidden(mesh, hidden)
        this.visibilityTimers.delete(timer)
      }, delay)
      this.visibilityTimers.add(timer)
    })
  }

  private updatePointer(clientX: number, clientY: number) {
    let rect = this.canvasRect
    if (!rect) {
      rect = this.canvasHost.getBoundingClientRect()
      this.canvasRect = rect
    }
    const pointer = getNormalizedCanvasPointer(clientX, clientY, rect)
    this.pointer.set(pointer.x, pointer.y)
  }

  private getFrontFacingIntersection(): ShowcaseMesh | null {
    const raycaster = this.raycaster
    const camera = this.camera
    if (!raycaster || !camera) return null

    raycaster.setFromCamera(this.pointer, camera)
    const intersections = raycaster.intersectObjects(this.meshes, false)

    for (const intersection of intersections) {
      const mesh = intersection.object as ShowcaseMesh
      if (!intersection.face || mesh.userData.hiddenProgress >= 0.01) {
        continue
      }

      const normal = intersection.face.normal.clone().transformDirection(mesh.matrixWorld)
      if (normal.dot(raycaster.ray.direction) < 0) {
        return mesh
      }
    }
    return null
  }

  private setHoveredMesh(nextMesh: ShowcaseMesh | null) {
    const currentHovered = this.hoveredMesh
    if (nextMesh === currentHovered) return

    if (currentHovered) {
      currentHovered.userData.hoverTarget = 0
    }

    this.hoveredMesh = nextMesh

    const slug = nextMesh?.userData.slug ?? ''
    if (slug !== this.lastHoveredSlug) {
      this.lastHoveredSlug = slug
      const found = this.projects.find((p) => p.slug === slug) ?? null
      this.onHoverChange(found)
    }

    if (nextMesh) {
      nextMesh.userData.hoverTarget = 1
    }

    this.canvasHost.style.cursor = nextMesh ? 'pointer' : 'default'
    if (nextMesh) {
      this.canvasHost.setAttribute('data-cursor', 'view')
    } else {
      this.canvasHost.removeAttribute('data-cursor')
    }
  }

  private updateHoveredProject() {
    if (!this.hasHover) {
      this.setHoveredMesh(null)
      return
    }
    this.setHoveredMesh(this.getFrontFacingIntersection())
  }

  private updatePlane(mesh: ShowcaseMesh, index: number, deltaMs: number) {
    const state = mesh.userData
    const hoverEase = 1 - Math.pow(1 - (state.hoverTarget ? 0.09 : 0.07), deltaMs * 0.2)
    const hiddenEase = 1 - Math.pow(1 - 0.05, deltaMs * 0.15)
    state.hoverProgress = MathUtils.lerp(state.hoverProgress, state.hoverTarget, hoverEase)
    state.hiddenProgress = MathUtils.lerp(state.hiddenProgress, state.hiddenTarget, hiddenEase)

    const isMobile = this.isMobile
    const adjustedConfig = {
      ...spiralConfig,
      centerOffsetY: isMobile ? -0.2 : spiralConfig.centerOffsetY
    }

    const transform = getPlaneTransform(
      index,
      this.currentOffset,
      this.meshes.length,
      state.hiddenProgress,
      adjustedConfig
    )
    const hiddenDirection = state.isHidden ? 1.5 : -1.5

    mesh.position.set(
      transform.x,
      transform.y - state.hiddenProgress * hiddenDirection,
      transform.z
    )
    mesh.rotation.set(0, transform.rotationY, 0)

    const uniforms = mesh.material.uniforms
    uniforms.uColorStrength.value = 0.55 * state.hoverProgress
    uniforms.uZoom.value = 1 + 0.05 * state.hoverProgress
    uniforms.uRevealProgress.value = (1 - state.hoverProgress * 0.05) * (1 - state.hiddenProgress)
    uniforms.uScrollSpeed.value = this.shaderScrollSpeed
  }

  private animate = (timestamp: number) => {
    if (!this.isInView) {
      this.isLoopRunning = false
      return
    }
    const renderer = this.renderer
    const scene = this.scene
    const camera = this.camera
    if (!renderer || !scene || !camera) return

    const deltaMs = Math.min(this.previousFrameTime ? timestamp - this.previousFrameTime : 16, 50)
    this.previousFrameTime = timestamp

    // Smoothly interpolate scroll contribution
    const targetOffset = (this.scrollProgressRef.current ?? 0) * this.projects.length
    const diff = targetOffset - this.easedScrollOffset
    
    this.easedScrollOffset += diff * SCROLL_OFFSET_EASE
    const targetScrollSpeed = MathUtils.clamp(
      diff * SCROLL_SPEED_MULTIPLIER,
      -MAX_SHADER_SCROLL_SPEED,
      MAX_SHADER_SCROLL_SPEED
    )
    this.scrollSpeed = MathUtils.lerp(
      this.scrollSpeed,
      targetScrollSpeed,
      SCROLL_SPEED_EASE
    )
    this.ambientOffset += getAmbientOffsetDelta(
      deltaMs,
      this.canvasWidth < 900,
      this.prefersReducedMotion,
      AMBIENT_MOTION
    )
    this.currentOffset = this.easedScrollOffset + this.ambientOffset
    this.shaderScrollSpeed = MathUtils.clamp(
      this.scrollSpeed + (this.prefersReducedMotion ? 0 : AMBIENT_SHADER_SCROLL_SPEED),
      -MAX_SHADER_SCROLL_SPEED,
      MAX_SHADER_SCROLL_SPEED
    )

    this.meshes.forEach((mesh, index) => this.updatePlane(mesh, index, deltaMs))
    this.updateHoveredProject()
    
    renderer.render(scene, camera)
    this.animationFrameId = requestAnimationFrame(this.animate)
    this.isLoopRunning = true
  }

  private resize() {
    const renderer = this.renderer
    const camera = this.camera
    if (!renderer || !camera) return

    const rect = this.canvasHost.getBoundingClientRect()
    this.canvasRect = rect
    const width = rect.width
    const height = rect.height
    this.canvasWidth = width
    camera.aspect = width / Math.max(height, 1)

    const isMobile = width < 768
    this.isMobile = isMobile
    this.hasHover = this.prefersHoverMediaQuery?.matches ?? true

    camera.fov = isMobile ? spiralConfig.mobileFov : spiralConfig.desktopFov
    const zPos = isMobile ? 9.5 : spiralConfig.cameraZ
    camera.position.set(0, 0, zPos)
    camera.updateProjectionMatrix()

    const maxDpr = width < 768 ? 1.0 : 1.5
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr))
    renderer.setSize(width, height, false)
  }

  private loadTexture(loader: TextureLoader, url: string): Promise<Texture> {
    return new Promise((resolve) => {
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = SRGBColorSpace
          const maxAniso = this.renderer?.capabilities.getMaxAnisotropy() ?? 1
          texture.anisotropy = Math.min(maxAniso, 8)
          resolve(texture)
        },
        undefined,
        () => {
          const data = new Uint8Array([24, 24, 24, 255])
          const texture = new DataTexture(data, 1, 1)
          texture.colorSpace = SRGBColorSpace
          texture.needsUpdate = true
          resolve(texture)
        }
      )
    })
  }

  private async createScene() {
    if (!supportsWebGL()) {
      this.onWebGLUnavailable()
      return
    }

    const scene = new Scene()
    this.scene = scene

    const initialRect = this.canvasHost.getBoundingClientRect()
    this.canvasRect = initialRect
    const initialSize = getCanvasViewportSize(initialRect, {
      height: window.innerHeight,
      width: window.innerWidth
    })
    this.canvasWidth = initialSize.width

    const camera = new PerspectiveCamera(
      spiralConfig.desktopFov,
      initialSize.width / Math.max(initialSize.height, 1),
      0.1,
      100
    )
    camera.position.set(0, 0, spiralConfig.cameraZ)
    this.camera = camera

    this.raycaster = new Raycaster()

    try {
      this.renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        stencil: false
      })
    } catch {
      this.destroy()
      this.onWebGLUnavailable()
      return
    }

    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.setClearColor(0x090909, 0)
    this.renderer.domElement.className = 'w-full h-full block'
    this.canvasHost.appendChild(this.renderer.domElement)

    this.geometry = new PlaneGeometry(1, 1, 8, 8)

    this.resize()

    const loader = new TextureLoader()
    const loadedTextures = await Promise.all(
      this.projects.map((project) => this.loadTexture(loader, project.thumbnail))
    )

    if (!this.scene) {
      // Disposed during loading
      loadedTextures.forEach((t) => t.dispose())
      return
    }

    const loopProjects = createLoopItems(this.projects)
    loopProjects.forEach((project, index) => {
      const projectIndex = index % this.projects.length
      const texture = loadedTextures[projectIndex]!
      const image = texture.image as { height?: number; width?: number } | undefined
      
      const material = new ShaderMaterial({
        fragmentShader: FRAGMENT_SHADER,
        side: DoubleSide,
        transparent: true,
        uniforms: {
          uColorStrength: { value: 0 },
          uImageSizes: { value: new Vector2(image?.width ?? 16, image?.height ?? 9) },
          uPlaneSizes: { value: new Vector2(spiralConfig.cardWidth, spiralConfig.cardHeight) },
          uRevealProgress: { value: 0 },
          uScrollSpeed: { value: 0 },
          uTexture: { value: texture },
          uZoom: { value: 1 }
        },
        vertexShader: VERTEX_SHADER
      }) as ShowcaseMaterial

      const mesh = new Mesh(this.geometry!, material) as ShowcaseMesh
      mesh.scale.set(spiralConfig.cardWidth, spiralConfig.cardHeight, 1)
      mesh.userData = {
        hiddenProgress: 1,
        hiddenTarget: 1,
        hoverProgress: 0,
        hoverTarget: 0,
        isHidden: true,
        projectIndex,
        slug: project.slug
      }
      this.meshes.push(mesh)
      scene.add(mesh)
    })

    this.scheduleVisibility(false)

    if (this.isInView && !this.isLoopRunning) {
      this.isLoopRunning = true
      this.previousFrameTime = performance.now()
      this.animationFrameId = requestAnimationFrame(this.animate)
    }
  }

  // Pointer event handlers
  private handlePointerDown = (event: PointerEvent) => {
    this.updatePointer(event.clientX, event.clientY)
    if (event.pointerType === 'mouse') return

    this.activePointerId = event.pointerId
    this.pointerStartX = event.clientX
    this.lastPointerX = event.clientX
    this.didDrag = false
  }

  private handlePointerMove = (event: PointerEvent) => {
    this.updatePointer(event.clientX, event.clientY)
    if (this.activePointerId !== event.pointerId || event.pointerType === 'mouse') return

    const totalDistance = event.clientX - this.pointerStartX
    if (!this.didDrag && Math.abs(totalDistance) > spiralConfig.dragThreshold) {
      this.didDrag = true
    }
  }

  private handlePointerUp = (event: PointerEvent) => {
    if (this.activePointerId !== event.pointerId || event.pointerType === 'mouse') return

    if (!this.didDrag) {
      this.updatePointer(event.clientX, event.clientY)
      const mesh = this.getFrontFacingIntersection()
      if (mesh) {
        this.onProjectClick(mesh.userData.slug)
      }
    }

    this.activePointerId = null
    this.didDrag = false
  }

  private handlePointerCancel = () => {
    this.activePointerId = null
    this.didDrag = false
  }

  private handleCanvasClick = () => {
    if (window.matchMedia('(hover: none)').matches) return
    const mesh = this.hoveredMesh
    if (mesh) {
      this.onProjectClick(mesh.userData.slug)
    }
  }

  public destroy() {
    this.reducedMotionMediaQuery?.removeEventListener('change', this.handleMotionChange)

    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    this.removeDOMEvents()

    this.isLoopRunning = false
    this.isInView = false
    this.hasInitialized = false

    cancelAnimationFrame(this.animationFrameId)
    this.clearVisibilityTimers()

    const textures = new Set<Texture>()
    this.meshes.forEach((mesh) => {
      if (mesh.material.uniforms.uTexture.value) {
        textures.add(mesh.material.uniforms.uTexture.value)
      }
      mesh.material.dispose()
      this.scene?.remove(mesh)
    })
    textures.forEach((texture) => texture.dispose())
    this.meshes = []

    this.geometry?.dispose()
    this.geometry = null

    this.renderer?.dispose()
    this.renderer?.domElement.remove()
    this.renderer = null

    this.scene = null
    this.camera = null
    this.raycaster = null
    this.hoveredMesh = null
    this.lastHoveredSlug = ''
    this.previousFrameTime = 0
    this.canvasRect = null
  }
}
