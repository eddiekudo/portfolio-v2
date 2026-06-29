'use client'

import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { projects, spiralConfig, type Project } from '../data/projects'
import {
  createLoopItems,
  getAmbientOffsetDelta,
  getCanvasViewportSize,
  getNormalizedCanvasPointer,
  getPlaneTransform,
  supportsWebGL
} from '../utils/spiral'

interface SpiralShowcaseProps {
  scrollProgress: number // Value from 0 to 1 driven by ScrollTrigger
  onProjectClick: (slug: string) => void
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
  uImageSizes: { value: THREE.Vector2 }
  uPlaneSizes: { value: THREE.Vector2 }
  uRevealProgress: { value: number }
  uScrollSpeed: { value: number }
  uTexture: { value: THREE.Texture | null }
  uZoom: { value: number }
}

type ShowcaseMaterial = THREE.ShaderMaterial & {
  uniforms: ShowcaseUniforms
}

type ShowcaseMesh = THREE.Mesh<THREE.PlaneGeometry, ShowcaseMaterial> & {
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
    float alpha = 1.0 - smoothstep(0.0, 0.002, shape);
    alpha *= smoothstep(0.1, 1.0, reveal);

    gl_FragColor = vec4(color.rgb, alpha);
  }
`

const EDGE_FADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uFillColor: { value: new THREE.Color('#090909') } // Matches page background
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vUv = uv;
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 uFillColor;

    varying vec2 vUv;

    float remap(float value, float min1, float max1, float min2, float max2) {
      return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
    }

    void main() {
      float bottomFade = clamp(remap(vUv.y, 0.0, 0.2, 1.0, 0.0), 0.0, 1.0);
      float topFade = clamp(remap(vUv.y, 0.8, 1.0, 0.0, 1.0), 0.0, 1.0);
      float strength = clamp(topFade + bottomFade, 0.0, 1.0);
      vec4 textureColor = texture2D(tDiffuse, vUv);
      vec3 finalColor = mix(textureColor.rgb, uFillColor, strength);

      gl_FragColor = vec4(finalColor, textureColor.a);
    }
  `
}

const setHidden = (mesh: ShowcaseMesh, hidden: boolean) => {
  mesh.userData.isHidden = hidden
  mesh.userData.hiddenTarget = hidden ? 1 : 0
}

export default function SpiralShowcase({ scrollProgress, onProjectClick }: SpiralShowcaseProps) {
  const canvasHost = useRef<HTMLDivElement>(null)
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null)
  const [webglUnavailable, setWebglUnavailable] = useState(false)

  // WebGL references
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const composerRef = useRef<EffectComposer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const raycasterRef = useRef<THREE.Raycaster | null>(null)
  const geometryRef = useRef<THREE.PlaneGeometry | null>(null)
  const animationFrameRef = useRef<number>(0)
  const previousFrameTimeRef = useRef<number>(0)
  const hoveredMeshRef = useRef<ShowcaseMesh | null>(null)
  const meshesRef = useRef<ShowcaseMesh[]>([])
  const visibilityTimersRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const lastHoveredSlugRef = useRef<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isLoopRunningRef = useRef<boolean>(false)
  const isInViewRef = useRef<boolean>(false)

  // State refs for animation loops
  const ambientOffsetRef = useRef<number>(0)
  const scrollOffsetRef = useRef<number>(0)
  const easedScrollOffsetRef = useRef<number>(0)
  const currentOffsetRef = useRef<number>(0)
  const shaderScrollSpeedRef = useRef<number>(0)
  const scrollSpeedRef = useRef<number>(0)
  const prefersReducedMotionRef = useRef<boolean>(false)

  // Touch pointer tracking
  const activePointerIdRef = useRef<number | null>(null)
  const pointerStartXRef = useRef<number>(0)
  const lastPointerXRef = useRef<number>(0)
  const pointerRef = useRef<THREE.Vector2>(new THREE.Vector2(2, 2))
  const didDragRef = useRef<boolean>(false)

  // Map scroll progress (0-1) to our spiral offset index span
  useEffect(() => {
    // Total offset range corresponds to spinning the spiral by projects.length
    scrollOffsetRef.current = scrollProgress * projects.length
  }, [scrollProgress])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => {
      prefersReducedMotionRef.current = query.matches
    }

    updateMotionPreference()
    query.addEventListener('change', updateMotionPreference)

    return () => query.removeEventListener('change', updateMotionPreference)
  }, [])

  // Helper visibility schedulers

  const clearVisibilityTimers = () => {
    visibilityTimersRef.current.forEach((timer) => clearTimeout(timer))
    visibilityTimersRef.current.clear()
  }

  const scheduleVisibility = (hidden: boolean) => {
    clearVisibilityTimers()
    meshesRef.current.forEach((mesh, index) => {
      const delay = (index % 4) * (hidden ? 30 : 50)
      const timer = setTimeout(() => {
        setHidden(mesh, hidden)
        visibilityTimersRef.current.delete(timer)
      }, delay)
      visibilityTimersRef.current.add(timer)
    })
  }

  // Raycaster hover check
  const updatePointer = (clientX: number, clientY: number) => {
    const rect = canvasHost.current?.getBoundingClientRect()
    if (!rect) return

    const pointer = getNormalizedCanvasPointer(clientX, clientY, rect)
    pointerRef.current.set(pointer.x, pointer.y)
  }

  const getFrontFacingIntersection = () => {
    const raycaster = raycasterRef.current
    const camera = cameraRef.current
    if (!raycaster || !camera) return null

    raycaster.setFromCamera(pointerRef.current, camera)
    const intersections = raycaster.intersectObjects(meshesRef.current, false)

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

  const setHoveredMesh = (nextMesh: ShowcaseMesh | null) => {
    const currentHovered = hoveredMeshRef.current
    if (nextMesh === currentHovered) return

    if (currentHovered) {
      currentHovered.userData.hoverTarget = 0
    }

    hoveredMeshRef.current = nextMesh

    const slug = nextMesh?.userData.slug ?? ''
    if (slug !== lastHoveredSlugRef.current) {
      lastHoveredSlugRef.current = slug
      const found = projects.find((p) => p.slug === slug) ?? null
      setHoveredProject(found)
    }

    if (nextMesh) {
      nextMesh.userData.hoverTarget = 1
    }

    const renderer = rendererRef.current
    if (renderer) {
      renderer.domElement.style.cursor = nextMesh ? 'pointer' : 'default'
    }
  }

  const updateHoveredProject = () => {
    if (window.matchMedia('(hover: none)').matches) {
      setHoveredMesh(null)
      return
    }
    setHoveredMesh(getFrontFacingIntersection())
  }

  const updatePlane = (mesh: ShowcaseMesh, index: number, deltaMs: number) => {
    const state = mesh.userData
    const hoverEase = 1 - Math.pow(1 - (state.hoverTarget ? 0.09 : 0.07), deltaMs * 0.2)
    const hiddenEase = 1 - Math.pow(1 - 0.05, deltaMs * 0.15)
    state.hoverProgress = THREE.MathUtils.lerp(state.hoverProgress, state.hoverTarget, hoverEase)
    state.hiddenProgress = THREE.MathUtils.lerp(state.hiddenProgress, state.hiddenTarget, hiddenEase)

    const transform = getPlaneTransform(
      index,
      currentOffsetRef.current,
      meshesRef.current.length,
      state.hiddenProgress,
      spiralConfig
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
    uniforms.uScrollSpeed.value = shaderScrollSpeedRef.current
  }

  const animate = (timestamp: number) => {
    if (!isInViewRef.current) {
      isLoopRunningRef.current = false
      return
    }
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current
    if (!renderer || !scene || !camera) return

    const deltaMs = Math.min(previousFrameTimeRef.current ? timestamp - previousFrameTimeRef.current : 16, 50)
    previousFrameTimeRef.current = timestamp

    // Smoothly interpolate the scroll contribution separately from ambient drift.
    const targetOffset = scrollOffsetRef.current
    const diff = targetOffset - easedScrollOffsetRef.current
    
    // Smooth scroll easing
    easedScrollOffsetRef.current += diff * SCROLL_OFFSET_EASE
    const targetScrollSpeed = THREE.MathUtils.clamp(
      diff * SCROLL_SPEED_MULTIPLIER,
      -MAX_SHADER_SCROLL_SPEED,
      MAX_SHADER_SCROLL_SPEED
    )
    scrollSpeedRef.current = THREE.MathUtils.lerp(
      scrollSpeedRef.current,
      targetScrollSpeed,
      SCROLL_SPEED_EASE
    )
    ambientOffsetRef.current += getAmbientOffsetDelta(
      deltaMs,
      renderer.domElement.clientWidth < 900,
      prefersReducedMotionRef.current,
      AMBIENT_MOTION
    )
    currentOffsetRef.current = easedScrollOffsetRef.current + ambientOffsetRef.current
    shaderScrollSpeedRef.current = THREE.MathUtils.clamp(
      scrollSpeedRef.current + (prefersReducedMotionRef.current ? 0 : AMBIENT_SHADER_SCROLL_SPEED),
      -MAX_SHADER_SCROLL_SPEED,
      MAX_SHADER_SCROLL_SPEED
    )

    meshesRef.current.forEach((mesh, index) => updatePlane(mesh, index, deltaMs))
    updateHoveredProject()
    
    composerRef.current?.render()
    animationFrameRef.current = requestAnimationFrame(animate)
    isLoopRunningRef.current = true
  }

  const resize = () => {
    const renderer = rendererRef.current
    const camera = cameraRef.current
    const host = canvasHost.current
    if (!renderer || !camera || !host) return

    const rect = host.getBoundingClientRect()
    const { height, width } = getCanvasViewportSize(rect, {
      height: window.innerHeight,
      width: window.innerWidth
    })
    camera.aspect = width / Math.max(height, 1)

    const isMobile = width < 900
    camera.fov = isMobile ? spiralConfig.mobileFov : spiralConfig.desktopFov
    const zPos = isMobile ? (spiralConfig.cameraZMobile ?? spiralConfig.cameraZ) : spiralConfig.cameraZ
    camera.position.set(0, 0, zPos)
    camera.updateProjectionMatrix()

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height, false)
    composerRef.current?.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    composerRef.current?.setSize(width, height)
  }

  const loadTexture = (loader: THREE.TextureLoader, url: string): Promise<THREE.Texture> => {
    return new Promise((resolve) => {
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          const maxAniso = rendererRef.current?.capabilities.getMaxAnisotropy() ?? 1
          texture.anisotropy = Math.min(maxAniso, 8)
          resolve(texture)
        },
        undefined,
        () => {
          // Fallback texture
          const data = new Uint8Array([24, 24, 24, 255])
          const texture = new THREE.DataTexture(data, 1, 1)
          texture.colorSpace = THREE.SRGBColorSpace
          texture.needsUpdate = true
          resolve(texture)
        }
      )
    })
  }

  const cleanupScene = () => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    isLoopRunningRef.current = false
    isInViewRef.current = false

    cancelAnimationFrame(animationFrameRef.current)
    clearVisibilityTimers()

    const scene = sceneRef.current
    const textures = new Set<THREE.Texture>()
    meshesRef.current.forEach((mesh) => {
      if (mesh.material.uniforms.uTexture.value) {
        textures.add(mesh.material.uniforms.uTexture.value)
      }
      mesh.material.dispose()
      scene?.remove(mesh)
    })
    textures.forEach((texture) => texture.dispose())
    meshesRef.current = []

    geometryRef.current?.dispose()
    geometryRef.current = null

    composerRef.current?.dispose()
    composerRef.current = null

    rendererRef.current?.dispose()
    rendererRef.current?.domElement.remove()
    rendererRef.current = null

    sceneRef.current = null
    cameraRef.current = null
    raycasterRef.current = null
    hoveredMeshRef.current = null
    lastHoveredSlugRef.current = ''
    previousFrameTimeRef.current = 0
  }

  const createScene = async () => {
    if (!canvasHost.current) return

    if (!supportsWebGL()) {
      setWebglUnavailable(true)
      return
    }

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const initialRect = canvasHost.current.getBoundingClientRect()
    const initialSize = getCanvasViewportSize(initialRect, {
      height: window.innerHeight,
      width: window.innerWidth
    })

    const camera = new THREE.PerspectiveCamera(
      spiralConfig.desktopFov,
      initialSize.width / Math.max(initialSize.height, 1),
      0.1,
      100
    )
    camera.position.set(0, 0, spiralConfig.cameraZ)
    cameraRef.current = camera

    const raycaster = new THREE.Raycaster()
    raycasterRef.current = raycaster

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        stencil: false
      })
    } catch {
      cleanupScene()
      setWebglUnavailable(true)
      return
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x090909, 0) // transparent clear, page bg shows
    renderer.domElement.className = 'w-full h-full block'
    canvasHost.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(new ShaderPass(EDGE_FADE_SHADER))
    composerRef.current = composer

    const planeGeometry = new THREE.PlaneGeometry(1, 1, 8, 8)
    geometryRef.current = planeGeometry

    resize()

    const loader = new THREE.TextureLoader()
    const loadedTextures = await Promise.all(
      projects.map((project) => loadTexture(loader, project.thumbnail))
    )

    const loopProjects = createLoopItems(projects)
    loopProjects.forEach((project, index) => {
      const projectIndex = index % projects.length
      const texture = loadedTextures[projectIndex]!
      const image = texture.image as { height?: number; width?: number } | undefined
      
      const material = new THREE.ShaderMaterial({
        fragmentShader: FRAGMENT_SHADER,
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: {
          uColorStrength: { value: 0 },
          uImageSizes: { value: new THREE.Vector2(image?.width ?? 16, image?.height ?? 9) },
          uPlaneSizes: { value: new THREE.Vector2(spiralConfig.cardWidth, spiralConfig.cardHeight) },
          uRevealProgress: { value: 0 },
          uScrollSpeed: { value: 0 },
          uTexture: { value: texture },
          uZoom: { value: 1 }
        },
        vertexShader: VERTEX_SHADER
      }) as ShowcaseMaterial

      const mesh = new THREE.Mesh(planeGeometry, material) as ShowcaseMesh
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
      meshesRef.current.push(mesh)
      scene.add(mesh)
    })

    scheduleVisibility(false)

    // Set up IntersectionObserver to control render loop
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        isInViewRef.current = entry.isIntersecting

        if (isInViewRef.current && !isLoopRunningRef.current) {
          isLoopRunningRef.current = true
          previousFrameTimeRef.current = performance.now()
          animationFrameRef.current = requestAnimationFrame(animate)
        } else if (!isInViewRef.current && isLoopRunningRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          isLoopRunningRef.current = false
        }
      },
      { threshold: 0 }
    )
    if (canvasHost.current) {
      observer.observe(canvasHost.current)
    }
    observerRef.current = observer
  }

  // Pointer event handlers
  const handlePointerDown = (event: React.PointerEvent) => {
    updatePointer(event.clientX, event.clientY)
    if (event.pointerType === 'mouse') return

    activePointerIdRef.current = event.pointerId
    pointerStartXRef.current = event.clientX
    lastPointerXRef.current = event.clientX
    didDragRef.current = false

    if (canvasHost.current) {
      canvasHost.current.setPointerCapture(event.pointerId)
    }
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    updatePointer(event.clientX, event.clientY)
    if (activePointerIdRef.current !== event.pointerId || event.pointerType === 'mouse') return

    const totalDistance = event.clientX - pointerStartXRef.current
    if (!didDragRef.current && Math.abs(totalDistance) > spiralConfig.dragThreshold) {
      didDragRef.current = true
    }

    if (!didDragRef.current) return

    const deltaX = event.clientX - lastPointerXRef.current
    // Swipe/Drag coordinates horizontal drag to scroll the page vertically!
    // Swiping left (deltaX < 0) scrolls page down (scrollbar moves down)
    const scrollDeltaY = -deltaX * 2.5
    window.scrollBy(0, scrollDeltaY)
    lastPointerXRef.current = event.clientX
  }

  const handlePointerUp = (event: React.PointerEvent) => {
    if (activePointerIdRef.current !== event.pointerId || event.pointerType === 'mouse') return

    if (!didDragRef.current) {
      // It's a tap! Open the project
      updatePointer(event.clientX, event.clientY)
      const mesh = getFrontFacingIntersection()
      if (mesh) {
        onProjectClick(mesh.userData.slug)
      }
    }

    activePointerIdRef.current = null
    didDragRef.current = false
  }

  const handlePointerCancel = () => {
    activePointerIdRef.current = null
    didDragRef.current = false
  }

  const handleCanvasClick = () => {
    if (window.matchMedia('(hover: none)').matches) return
    const mesh = hoveredMeshRef.current
    if (mesh) {
      onProjectClick(mesh.userData.slug)
    }
  }

  useEffect(() => {
    const setupFrame = requestAnimationFrame(() => {
      void createScene()
    })
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(setupFrame)
      window.removeEventListener('resize', resize)
      cleanupScene()
    }
    // The Three.js scene is intentionally mounted once and synced through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .spiral-stage {
          inset: 0;
          opacity: 1;
          position: absolute;
          touch-action: pan-y pinch-zoom;
          z-index: 10;
        }

        .project-hover-overlay {
          align-items: center;
          bottom: 60px;
          display: flex;
          justify-content: center;
          left: 0;
          pointer-events: none;
          position: absolute;
          right: 0;
          z-index: 20;
          transition:
            opacity 0.35s cubic-bezier(0.455, 0.03, 0.515, 0.955),
            transform 0.35s cubic-bezier(0.455, 0.03, 0.515, 0.955);
        }

        .project-hover-content {
          align-items: center;
          background: #fafafa;
          border-radius: 14px;
          color: #0a0a0a;
          display: flex;
          gap: 12px;
          max-width: 400px;
          overflow: hidden;
          padding: 6px 16px 6px 6px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .project-hover-content img {
          background: #0a0a0a;
          border-radius: 9px;
          height: 48px;
          object-fit: cover;
          width: 48px;
        }

        .project-hover-content h2 {
          font-size: 18px;
          font-weight: 500;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .project-hover-overlay {
            display: none;
          }
        }

        .spiral-fallback {
          align-items: center;
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(0deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            #090909;
          background-size: 64px 64px;
          display: grid;
          grid-template-columns: minmax(0, 0.72fr) minmax(280px, 1fr);
          gap: 24px;
          inset: 0;
          overflow: hidden;
          padding: 24px 0;
          position: absolute;
          z-index: 10;
        }

        .spiral-fallback__copy {
          align-self: end;
          color: #ffffff;
          max-width: 320px;
          padding: 0 0 56px 12px;
          text-transform: uppercase;
        }

        .spiral-fallback__copy p {
          color: #9f9f9f;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.35;
          margin: 10px 0 0;
        }

        .spiral-fallback__copy strong {
          display: block;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
        }

        .spiral-fallback__grid {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          transform: rotate(-7deg) translateX(6%);
        }

        .spiral-fallback__card {
          aspect-ratio: 16 / 10;
          background-color: #161616;
          background-position: center;
          background-size: cover;
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #ffffff;
          cursor: pointer;
          display: flex;
          min-height: 160px;
          overflow: hidden;
          padding: 0;
          position: relative;
          text-align: left;
          touch-action: manipulation;
          transition:
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .spiral-fallback__card::after {
          background: linear-gradient(180deg, transparent 35%, rgba(0, 0, 0, 0.78));
          content: "";
          inset: 0;
          position: absolute;
        }

        .spiral-fallback__card:hover,
        .spiral-fallback__card:focus-visible {
          border-color: #ffffff;
          transform: translateY(-4px);
        }

        .spiral-fallback__card:focus-visible {
          outline: 2px solid #ffffff;
          outline-offset: 3px;
        }

        .spiral-fallback__card span {
          align-self: flex-end;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          padding: 12px;
          position: relative;
          text-transform: uppercase;
          z-index: 1;
        }

        @media (max-width: 900px) {
          .spiral-fallback {
            align-content: center;
            grid-template-columns: 1fr;
            padding: 16px 12px 72px;
          }

          .spiral-fallback__copy {
            align-self: auto;
            padding: 0;
          }

          .spiral-fallback__grid {
            transform: none;
          }

          .spiral-fallback__card {
            min-height: 118px;
          }
        }
      ` }} />

      {webglUnavailable ? (
        <section className="spiral-fallback" aria-label="Project showcase">
          <div className="spiral-fallback__copy">
            <strong>WebGL unavailable</strong>
            <p>Enable browser graphics acceleration to view the real 3D spiral.</p>
          </div>
          <div className="spiral-fallback__grid">
            {projects.map((project) => (
              <button
                key={project.slug}
                type="button"
                className="spiral-fallback__card"
                style={{ backgroundImage: `url(${project.thumbnail})` }}
                onClick={() => onProjectClick(project.slug)}
              >
                <span>{project.title}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div
          ref={canvasHost}
          className="spiral-stage"
          role="application"
          aria-label="Interactive spiral project showcase"
          onClick={handleCanvasClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        />
      )}

      {!webglUnavailable && (
        <div
          className={`project-hover-overlay ${
            hoveredProject ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
          aria-live="polite"
        >
          {hoveredProject && (
            <div className="project-hover-content">
              <Image src={hoveredProject.thumbnail} alt="" width={48} height={48} sizes="48px" />
              <h2>{hoveredProject.title}</h2>
            </div>
          )}
        </div>
      )}
    </>
  )
}
