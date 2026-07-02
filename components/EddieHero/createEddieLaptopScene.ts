import type * as Three from "three";

type CreateEddieLaptopSceneOptions = {
  mount: HTMLElement;
  hero: HTMLElement;
  transitionRoot: HTMLElement;
  modelPath?: string;
  onUpdate?: (data: {
    scrollY: number;
    time: number;
    ambientStrength: number;
    mouseX: number;
    mouseY: number;
  }) => void;
};

type Cleanup = () => void;

const MODEL_PATH = "/hero-eddie/models/macbook-opt.glb";
const TARGET_WIDTH = 3.9;
const FACE_Y = 0;
const LID_CLOSE_DELTA = 1.42;

const TIMELINE = {
  enterStart: 0,
  layerRelease: 1050,
  pushStart: 1200,
  pushEnd: 1400,
  portalStart: 1200,
  portalFull: 1400,
  reducedPose: 1050,
};

const START_POS = { x: 0, y: 0.72, z: 7.8 };
const START_LOOK = { x: 0, y: 0.34, z: 0 };

const TWO_PI = Math.PI * 2;

const POSE_KEYS = [
  // Phase 1: Emerge from behind character (center-left), small, lid closed
  { scroll: 0,    x: 2.8,  y: 0.3,  s: 0.10, rx: -0.3,  ry: -0.6,  rz: 0.0,           lid: 0.0  },
  { scroll: 120,  x: 2.2,  y: -0.1, s: 0.18, rx: -0.25, ry: -0.45, rz: TWO_PI * 0.1,   lid: 0.0  },
  { scroll: 250,  x: 1.2,  y: -0.4, s: 0.28, rx: -0.15, ry: -0.2,  rz: TWO_PI * 0.25,  lid: 0.0  },

  // Phase 2: Sweep right across the scene, tumbling
  { scroll: 380,  x: -0.3, y: -0.2, s: 0.38, rx: 0.1,   ry: 0.3,   rz: TWO_PI * 0.45,  lid: 0.0  },
  { scroll: 480,  x: -1.4, y: 0.1,  s: 0.45, rx: 0.2,   ry: 0.6,   rz: TWO_PI * 0.65,  lid: 0.0  },

  // Phase 3: Arc upward-right, reaching far right
  { scroll: 580,  x: -2.2, y: 0.5,  s: 0.52, rx: 0.15,  ry: 0.85,  rz: TWO_PI * 0.82,  lid: 0.0  },
  { scroll: 680,  x: -1.8, y: 0.8,  s: 0.58, rx: 0.05,  ry: 0.65,  rz: TWO_PI * 0.92,  lid: 0.0  },

  // Phase 4: Curve back left, decelerating, lid opening
  { scroll: 780,  x: -1.0, y: 0.7,  s: 0.68, rx: 0.0,   ry: 0.35,  rz: TWO_PI * 0.97,  lid: 0.30 },
  { scroll: 880,  x: -0.3, y: 0.62, s: 0.78, rx: 0.0,   ry: 0.15,  rz: TWO_PI * 0.99,  lid: 0.65 },
  { scroll: 970,  x: 0.05, y: 0.58, s: 0.86, rx: 0.0,   ry: 0.06,  rz: TWO_PI * 0.998, lid: 0.90 },

  // Phase 5: Settle to center, front-facing, screen visible
  { scroll: 1050, x: 0.0,  y: 0.54, s: 0.94, rx: 0.0,   ry: 0.0,   rz: TWO_PI,         lid: 1.0  },
  { scroll: 1120, x: 0.0,  y: 0.53, s: 0.98, rx: 0.0,   ry: 0.0,   rz: TWO_PI,         lid: 1.0  },

  // Phase 6: Portal — slight push-in
  { scroll: 1200, x: 0.0,  y: 0.52, s: 1.02, rx: 0.0,   ry: 0.0,   rz: TWO_PI,         lid: 1.0  },
  { scroll: 1400, x: 0.0,  y: 0.52, s: 1.06, rx: 0.0,   ry: 0.0,   rz: TWO_PI,         lid: 1.0  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function samplePose(scrollY: number) {
  if (scrollY <= POSE_KEYS[0].scroll) return POSE_KEYS[0];

  for (let i = 0; i < POSE_KEYS.length - 1; i += 1) {
    const a = POSE_KEYS[i];
    const b = POSE_KEYS[i + 1];

    if (scrollY <= b.scroll) {
      const t = smooth((scrollY - a.scroll) / (b.scroll - a.scroll));

      return {
        scroll: scrollY,
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        s: lerp(a.s, b.s, t),
        rx: lerp(a.rx, b.rx, t),
        ry: lerp(a.ry, b.ry, t),
        rz: lerp(a.rz, b.rz, t),
        lid: lerp(a.lid, b.lid, t),
      };
    }
  }

  return POSE_KEYS[POSE_KEYS.length - 1];
}

function getSectionScroll(hero: HTMLElement) {
  const maxScroll = Math.max(0, hero.offsetHeight - window.innerHeight);
  return clamp(-hero.getBoundingClientRect().top, 0, maxScroll);
}

function resetScreenVars(root: HTMLElement) {
  root.style.setProperty("--screen-left", "50vw");
  root.style.setProperty("--screen-top", "50vh");
  root.style.setProperty("--screen-right", "50vw");
  root.style.setProperty("--screen-bottom", "50vh");
  root.style.setProperty("--screen-radius", "16px");
  root.style.setProperty("--screen-opacity", "0");
  root.style.setProperty("--screen-shadow", "0 0 0 rgba(0, 0, 0, 0)");
  root.style.setProperty("--screen-transform", "none");
  root.style.setProperty("--reveal-text-progress", "100%");
}

export function createEddieLaptopScene(
  options: CreateEddieLaptopSceneOptions,
): Cleanup {
  let disposed = false;
  let runtimeCleanup: Cleanup | null = null;

  void setupEddieLaptopScene(options, () => disposed)
    .then((cleanup) => {
      if (disposed) {
        cleanup();
        return;
      }

      runtimeCleanup = cleanup;
    })
    .catch((error) => {
      console.error("[eddie-hero] Failed to initialize laptop scene:", error);
    });

  return () => {
    disposed = true;
    runtimeCleanup?.();
  };
}

async function setupEddieLaptopScene(
  {
    mount,
    hero,
    transitionRoot,
    modelPath = MODEL_PATH,
    onUpdate,
  }: CreateEddieLaptopSceneOptions,
  isDisposed: () => boolean,
): Promise<Cleanup> {
  const [THREE, { RoomEnvironment }, { GLTFLoader }, { DRACOLoader }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    import("three/examples/jsm/loaders/DRACOLoader.js"),
  ]);

  if (isDisposed()) return () => undefined;

  let renderer: Three.WebGLRenderer;

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    mount.dataset.eddieLaptop = "webgl-unavailable";
    console.error("[eddie-hero] WebGL renderer unavailable:", error);
    return () => undefined;
  }

  const getPixelRatio = () =>
    Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.35 : 2);

  renderer.setPixelRatio(getPixelRatio());
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environmentTexture;

  const camera = new THREE.PerspectiveCamera(
    32,
    mount.clientWidth / mount.clientHeight,
    0.1,
    100,
  );
  const startPos = new THREE.Vector3(START_POS.x, START_POS.y, START_POS.z);
  const startLook = new THREE.Vector3(
    START_LOOK.x,
    START_LOOK.y,
    START_LOOK.z,
  );
  camera.position.copy(startPos);
  camera.lookAt(startLook);

  const key = new THREE.DirectionalLight(0xfff1dd, 2.2);
  key.position.set(3, 5, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9bd4d7, 0.6);
  fill.position.set(-4, 1.5, 3);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));

  const laptop = new THREE.Group();
  laptop.position.set(2.8, 0.3, -1);
  laptop.visible = false;
  scene.add(laptop);

  const screenTarget = new THREE.Vector3();
  const screenCenterLocal = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  const desiredPos = new THREE.Vector3();
  const panPos = new THREE.Vector3();
  const panLook = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const screenCorner = new THREE.Vector3();
  const projectedCorner = new THREE.Vector3();

  let lidNode: Three.Object3D | null = null;
  let lidClosedEulerX = 0;
  let screenMesh: Three.Mesh | null = null;
  let modelReady = false;
  let target = getSectionScroll(hero);
  let current = target;
  let frameId = 0;
  let mouseX = 0;
  let mouseY = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let ambientStrength = 1;
  let time = 0;
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = reducedMotionQuery.matches;
  let isInView = false;
  let isLoopRunning = false;

  const makeScreenTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 800;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return new THREE.CanvasTexture(canvas);
    }

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#090909");
    gradient.addColorStop(1, "#0e0e0e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    return texture;
  };

  const disposeMaterial = (material: Three.Material) => {
    const materialWithTextures = material as Three.Material & {
      map?: Three.Texture | null;
      emissiveMap?: Three.Texture | null;
    };
    const map = materialWithTextures.map;
    const emissiveMap = materialWithTextures.emissiveMap;

    map?.dispose();

    if (emissiveMap && emissiveMap !== map) {
      emissiveMap.dispose();
    }

    material.dispose();
  };

  const disposeObject = (object: Three.Object3D) => {
    object.traverse((child) => {
      const mesh = child as Three.Mesh;

      if (!mesh.isMesh) return;

      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      for (const material of materials) {
        disposeMaterial(material);
      }
    });
  };

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    modelPath,
    (gltf) => {
      if (isDisposed()) {
        disposeObject(gltf.scene);
        return;
      }

      const model = gltf.scene;
      let box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const scale = TARGET_WIDTH / size.x;

      model.scale.setScalar(scale);
      box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.rotation.y += FACE_Y;

      lidNode = model.getObjectByName("Lid") ?? null;

      if (lidNode) {
        lidClosedEulerX = lidNode.rotation.x;
      }

      model.traverse((child) => {
        const mesh = child as Three.Mesh;

        if (!mesh.isMesh) return;

        mesh.castShadow = false;
        mesh.receiveShadow = false;

        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        for (const material of materials) {
          if (!/^lcd$/i.test((material.name || "").trim())) continue;

          const screenMaterial = material as Three.MeshStandardMaterial;
          const screenTexture = makeScreenTexture();

          screenMesh = mesh;
          screenMesh.geometry.computeBoundingBox();
          screenMaterial.map = screenTexture;
          screenMaterial.emissive = new THREE.Color(0xffffff);
          screenMaterial.emissiveMap = screenTexture;
          screenMaterial.emissiveIntensity = 1;
          screenMaterial.needsUpdate = true;
        }
      });

      laptop.add(model);
      modelReady = true;
      mount.dataset.eddieLaptop = "ready";
      if (isInView && !isLoopRunning) {
        isLoopRunning = true;
        animate();
      }
    },
    undefined,
    (error) => {
      mount.dataset.eddieLaptop = "error";
      console.error("[eddie-hero] Failed to load laptop model:", error);
    },
  );

  const onScroll = () => {
    target = getSectionScroll(hero);
    if (!isInView) {
      current = target;
    }
  };

  const onResize = () => {
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(getPixelRatio());
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    onScroll();
  };

  const onMouseMove = (event: MouseEvent) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
  };

  const onReducedMotionChange = (event: MediaQueryListEvent) => {
    reducedMotion = event.matches;
    onScroll();
  };

  const getScreenWorldCenter = (out: Three.Vector3) => {
    if (screenMesh?.geometry?.boundingBox) {
      screenMesh.geometry.boundingBox.getCenter(screenCenterLocal);
      out.copy(screenCenterLocal);
      screenMesh.localToWorld(out);
      return out;
    }

    laptop.getWorldPosition(out);
    return out;
  };

  const getProjectedScreenBounds = () => {
    if (!screenMesh?.geometry?.boundingBox) return null;

    const { min, max } = screenMesh.geometry.boundingBox;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const rect = mount.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;

    for (const x of [min.x, max.x]) {
      for (const y of [min.y, max.y]) {
        for (const z of [min.z, max.z]) {
          screenCorner.set(x, y, z);
          screenMesh.localToWorld(screenCorner);
          projectedCorner.copy(screenCorner).project(camera);

          const sx = rect.left + (projectedCorner.x * 0.5 + 0.5) * cw;
          const sy = rect.top + (-projectedCorner.y * 0.5 + 0.5) * ch;

          minX = Math.min(minX, sx);
          minY = Math.min(minY, sy);
          maxX = Math.max(maxX, sx);
          maxY = Math.max(maxY, sy);
        }
      }
    }

    if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;

    return {
      left: clamp(minX - 8, 0, window.innerWidth),
      top: clamp(minY - 8, 0, window.innerHeight),
      right: clamp(maxX + 8, 0, window.innerWidth),
      bottom: clamp(maxY + 8, 0, window.innerHeight),
    };
  };

  const updateScreenTransition = (scrollY: number, zoomProgress: number) => {
    const textOpacity = 1 - clamp((scrollY - 1000) / 200, 0, 1);
    transitionRoot.style.setProperty("--text-opacity", textOpacity.toFixed(3));

    if (reducedMotion) {
      transitionRoot.style.setProperty("--screen-opacity", "0");
      transitionRoot.style.setProperty(
        "--screen-shadow",
        "0 0 0 rgba(0, 0, 0, 0)",
      );
      transitionRoot.style.setProperty("--screen-transform", "none");
      transitionRoot.style.setProperty("--reveal-text-progress", "100%");
      return;
    }

    const opacity = clamp(
      (scrollY - TIMELINE.portalStart) /
        (TIMELINE.portalFull - TIMELINE.portalStart),
      0,
      1,
    );
    const revealStart = TIMELINE.portalStart + 40;
    const reveal = smooth(
      clamp((scrollY - revealStart) / (TIMELINE.portalFull - revealStart), 0, 1),
    );
    const bounds = getProjectedScreenBounds();

    if (!bounds || opacity <= 0) {
      transitionRoot.style.setProperty("--screen-opacity", "0");
      transitionRoot.style.setProperty(
        "--screen-shadow",
        "0 0 0 rgba(0, 0, 0, 0)",
      );
      transitionRoot.style.setProperty("--screen-transform", "none");
      transitionRoot.style.setProperty("--reveal-text-progress", "100%");
      return;
    }

    const left = lerp(bounds.left, 0, reveal);
    const top = lerp(bounds.top, 0, reveal);
    const right = lerp(window.innerWidth - bounds.right, 0, reveal);
    const bottom = lerp(window.innerHeight - bounds.bottom, 0, reveal);
    const radius = lerp(16, 0, reveal);
    const shadowAlpha = Math.min(0.36, opacity * (1 - reveal) * 0.36);

    const w = bounds.right - bounds.left;
    const scaleX = w / window.innerWidth;
    const cX = (bounds.left + bounds.right) / 2;
    const cY = (bounds.top + bounds.bottom) / 2;
    const vX = window.innerWidth / 2;
    const vY = window.innerHeight / 2;

    const tScale = lerp(scaleX, 1, reveal);
    const tX = lerp(cX - vX, 0, reveal);
    const tY = lerp(cY - vY, 0, reveal);

    transitionRoot.style.setProperty(
      "--screen-left",
      `${Math.max(0, left).toFixed(2)}px`,
    );
    transitionRoot.style.setProperty(
      "--screen-top",
      `${Math.max(0, top).toFixed(2)}px`,
    );
    transitionRoot.style.setProperty(
      "--screen-right",
      `${Math.max(0, right).toFixed(2)}px`,
    );
    transitionRoot.style.setProperty(
      "--screen-bottom",
      `${Math.max(0, bottom).toFixed(2)}px`,
    );
    transitionRoot.style.setProperty(
      "--screen-radius",
      `${radius.toFixed(2)}px`,
    );
    transitionRoot.style.setProperty("--screen-opacity", opacity.toFixed(3));
    transitionRoot.style.setProperty(
      "--screen-shadow",
      `0 20px 80px rgba(0, 0, 0, ${shadowAlpha.toFixed(3)})`,
    );
    transitionRoot.style.setProperty(
      "--screen-transform",
      `translate3d(${tX.toFixed(2)}px, ${tY.toFixed(2)}px, 0) scale(${tScale.toFixed(4)})`,
    );
    transitionRoot.style.setProperty(
      "--reveal-text-progress",
      `${((1 - opacity) * 100).toFixed(1)}%`,
    );

    if (scrollY >= TIMELINE.portalFull || zoomProgress > 0.995) {
      transitionRoot.style.setProperty("--screen-left", "0px");
      transitionRoot.style.setProperty("--screen-top", "0px");
      transitionRoot.style.setProperty("--screen-right", "0px");
      transitionRoot.style.setProperty("--screen-bottom", "0px");
      transitionRoot.style.setProperty("--screen-transform", "none");
    }
  };

  const animate = () => {
    if (!isInView) {
      isLoopRunning = false;
      return;
    }
    frameId = window.requestAnimationFrame(animate);
    isLoopRunning = true;
    current += (target - current) * (reducedMotion ? 1 : 0.1);

    const scrollY = reducedMotion ? TIMELINE.reducedPose : current;
    const pose = samplePose(scrollY);
    const zoomProgress = reducedMotion
      ? 0
      : smooth(
          clamp(
            (scrollY - TIMELINE.pushStart) /
              (TIMELINE.pushEnd - TIMELINE.pushStart),
            0,
            1,
          ),
        );

    const narrowProgress = clamp((1200 - window.innerWidth) / 432, 0, 1);
    const mobileSettleProgress = smooth(
      clamp((scrollY - 850) / (TIMELINE.pushStart - 850), 0, 1),
    );
    const mobilePrep = narrowProgress * (1 - mobileSettleProgress);
    const wovenX = pose.x;
    const wovenY = pose.y;
    const mobileX = wovenX - mobilePrep * (wovenX * 0.8 + 0.08);
    const mobileY = wovenY - mobilePrep * 0.18;
    const narrowScalePenalty = window.innerWidth < 768 ? 0.42 : 0.18;
    const mobileScale = pose.s * (1 - mobilePrep * narrowScalePenalty);

    laptop.visible = modelReady && scrollY >= TIMELINE.enterStart;
    const laptopInFront = reducedMotion || scrollY >= 550;
    mount.classList.toggle("is-above-foreground", laptopInFront);
    mount.classList.toggle("is-behind-character", !laptopInFront);

    laptop.position.set(mobileX, mobileY, 0);
    laptop.scale.setScalar(mobileScale);
    laptop.rotation.set(pose.rx, FACE_Y + pose.ry, pose.rz);

    if (lidNode) {
      lidNode.rotation.x = lidClosedEulerX + LID_CLOSE_DELTA * (1 - pose.lid);
    }

    const alignProgress = smooth(
      clamp((scrollY - 680) / (TIMELINE.pushStart - 680), 0, 1),
    );

    laptop.updateMatrixWorld(true);
    getScreenWorldCenter(screenTarget);

    camDir.copy(startPos).sub(screenTarget).normalize();
    desiredPos.copy(screenTarget).addScaledVector(camDir, 1.35);

    panPos.copy(startPos);
    panPos.x += pose.lid * 0.35 * (1 - alignProgress);
    panLook.copy(startLook);
    panLook.x += pose.lid * 0.45 * (1 - alignProgress);
    camera.position.copy(panPos).lerp(desiredPos, zoomProgress);

    // Apply coordinated ambient camera sway
    if (!reducedMotion) {
      time += 0.015;

      const mouseMoved =
        Math.abs(mouseX - lastMouseX) > 0.002 ||
        Math.abs(mouseY - lastMouseY) > 0.002;
      lastMouseX = mouseX;
      lastMouseY = mouseY;

      if (mouseMoved) {
        ambientStrength += (0 - ambientStrength) * 0.15;
      } else {
        ambientStrength += (1 - ambientStrength) * 0.02;
      }

      const cameraSwayX =
        Math.sin(time) * 0.12 * ambientStrength * (1 - zoomProgress);
      const cameraSwayY =
        Math.cos(time * 0.7) * 0.08 * ambientStrength * (1 - zoomProgress);

      camera.position.x += cameraSwayX;
      camera.position.y += cameraSwayY;
    }

    lookTarget.copy(panLook).lerp(screenTarget, zoomProgress);
    camera.lookAt(lookTarget);
    camera.updateMatrixWorld(true);

    updateScreenTransition(scrollY, zoomProgress);
    renderer.render(scene, camera);

    if (onUpdate) {
      const boomerangProgress = clamp(scrollY / 1050, 0, 1);
      const hoverFactor = 1 - boomerangProgress;
      onUpdate({
        scrollY,
        time,
        ambientStrength,
        mouseX: mouseX * hoverFactor,
        mouseY: mouseY * hoverFactor,
      });
    }
  };

  resetScreenVars(transitionRoot);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  onResize();
  setTimeout(onResize, 0);
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  reducedMotionQuery.addEventListener("change", onReducedMotionChange);

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      isInView = entry.isIntersecting;

      if (isInView && !isLoopRunning) {
        isLoopRunning = true;
        animate();
      } else if (!isInView && isLoopRunning) {
        window.cancelAnimationFrame(frameId);
        isLoopRunning = false;
      }
    },
    { threshold: 0 }
  );
  observer.observe(hero);

  return () => {
    observer.disconnect();
    window.cancelAnimationFrame(frameId);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("mousemove", onMouseMove);
    reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
    mount.classList.remove("is-above-foreground");
    mount.classList.remove("is-behind-character");
    resetScreenVars(transitionRoot);

    if (renderer.domElement.parentElement === mount) {
      mount.removeChild(renderer.domElement);
    }

    disposeObject(scene);
    environmentTexture.dispose();
    pmrem.dispose();
    dracoLoader.dispose();
    renderer.dispose();
  };
}
