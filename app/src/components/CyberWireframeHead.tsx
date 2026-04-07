import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./CyberWireframeHead.css";

// --- Procedural head fallback ------------------------------------------------
// LatheGeometry profile: [radius, y] from crown to chin
const HEAD_PROFILE_PTS: [number, number][] = [
  [0.04, 1.24],
  [0.28, 1.17],
  [0.52, 1.04],
  [0.68, 0.82],
  [0.76, 0.56],
  [0.80, 0.28],  // cheekbone (max width)
  [0.78, 0.00],
  [0.70, -0.22],
  [0.60, -0.42],
  [0.48, -0.60],
  [0.34, -0.74],
  [0.18, -0.86],
  [0.06, -0.94],
  [0.01, -0.98],
];

function buildProceduralHead(): THREE.LineSegments {
  const profile = HEAD_PROFILE_PTS.map(
    ([r, y]) => new THREE.Vector2(r, y)
  );
  const lathe = new THREE.LatheGeometry(profile, 28, 0, Math.PI * 2);
  const edges = new THREE.EdgesGeometry(lathe, 10);
  lathe.dispose();
  return new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x00ff41, transparent: true, opacity: 0.88 })
  );
}

// --- Glow (single aura copy) ------------------------------------------------
function buildGlowCopy(geo: THREE.BufferGeometry): THREE.LineSegments {
  return new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({
      color: 0x00ff41,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
}

// --- Wire-ify a GLTF scene --------------------------------------------------
function wireifyGLTF(root: THREE.Object3D): THREE.Group {
  const group = new THREE.Group();
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const edges = new THREE.EdgesGeometry(child.geometry, 12);
    const wire = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x00ff41, transparent: true, opacity: 0.88 })
    );
    // Copy world position/rotation of this mesh into the group space
    child.updateWorldMatrix(true, false);
    wire.applyMatrix4(child.matrixWorld);
    group.add(wire);

    // Glow copy
    const glow = buildGlowCopy(edges);
    glow.applyMatrix4(child.matrixWorld);
    glow.scale.setScalar(1.02);
    group.add(glow);
  });
  return group;
}

// ----------------------------------------------------------------------------

export function CyberWireframeHead() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 220;
    const H = mount.clientHeight || 240;

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    /* Scene / camera */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.z = 3.6;

    /* Group that gets rotated */
    const headGroup = new THREE.Group();
    headGroup.scale.set(0.9, 1.12, 0.88);
    scene.add(headGroup);

    /* ── Load head.glb → fallback to procedural ── */
    const loader = new GLTFLoader();
    let glowMats: THREE.LineBasicMaterial[] = [];

    const applyHead = (obj: THREE.Object3D | null) => {
      if (obj) {
        headGroup.add(obj);
        // Collect glow materials for pulsing
        obj.traverse((c) => {
          if (c instanceof THREE.LineSegments) {
            const m = c.material as THREE.LineBasicMaterial;
            if (m.blending === THREE.AdditiveBlending) glowMats.push(m);
          }
        });
      } else {
        // Procedural fallback
        const head = buildProceduralHead();
        headGroup.add(head);

        const glowGeo = (head.geometry as THREE.BufferGeometry).clone();
        const glow = buildGlowCopy(glowGeo);
        glow.scale.setScalar(1.04);
        headGroup.add(glow);
        glowMats.push(glow.material as THREE.LineBasicMaterial);
      }
    };

    loader.load(
      "/head.glb",
      (gltf) => applyHead(wireifyGLTF(gltf.scene)),
      undefined,
      () => applyHead(null) // silently fallback
    );

    /* ── Drag to rotate — throttled via RAF ── */
    let dragging = false;
    let prevX = 0, prevY = 0;
    let velX = 0, velY = 0;
    let autoRotate = true;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    // RAF-throttle state
    let pendingMove = false;
    let pendingDX = 0, pendingDY = 0;

    const getXY = (e: MouseEvent | TouchEvent) => {
      const p = "touches" in e ? e.touches[0] : (e as MouseEvent);
      return { x: p.clientX, y: p.clientY };
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      dragging = true;
      autoRotate = false;
      if (resumeTimer) clearTimeout(resumeTimer);
      const { x, y } = getXY(e);
      prevX = x; prevY = y;
      velX = 0; velY = 0;
      renderer.domElement.style.cursor = "grabbing";
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const { x, y } = getXY(e);
      pendingDX += x - prevX;
      pendingDY += y - prevY;
      prevX = x; prevY = y;
      pendingMove = true;
    };

    const onUp = () => {
      dragging = false;
      renderer.domElement.style.cursor = "grab";
      resumeTimer = setTimeout(() => { autoRotate = true; }, 2500);
    };

    const el = renderer.domElement;
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    el.style.cursor = "grab";

    /* ── Animation loop ── */
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Apply batched mouse delta once per frame
      if (pendingMove) {
        headGroup.rotation.y += pendingDX * 0.013;
        headGroup.rotation.x = Math.max(
          -Math.PI * 0.45,
          Math.min(Math.PI * 0.45, headGroup.rotation.x + pendingDY * 0.013)
        );
        velX = pendingDX;
        velY = pendingDY;
        pendingDX = 0; pendingDY = 0;
        pendingMove = false;
      }

      if (autoRotate) {
        headGroup.rotation.y += 0.005;
        headGroup.rotation.x = Math.sin(t * 0.4) * 0.06;
      } else if (!dragging) {
        velX *= 0.88;
        velY *= 0.88;
        headGroup.rotation.y += velX * 0.008;
        headGroup.rotation.x = Math.max(
          -Math.PI * 0.45,
          Math.min(Math.PI * 0.45, headGroup.rotation.x + velY * 0.008)
        );
      }

      // Pulse glow opacity
      const glowOpacity = 0.05 + Math.sin(t * 1.8) * 0.03;
      for (const m of glowMats) m.opacity = glowOpacity;

      renderer.render(scene, camera);
    };
    animate();

    /* Resize */
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(animId);
      if (resumeTimer) clearTimeout(resumeTimer);
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("touchstart", onDown);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      ro.disconnect();
      renderer.dispose();
      if (mount.contains(el)) mount.removeChild(el);
    };
  }, []);

  return <div ref={mountRef} className="cyber-wireframe-head" />;
}
