import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./CyberWireframeHead.css";

export function CyberWireframeHead() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 220;
    const H = mount.clientHeight || 240;

    /* ── RENDERER ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    /* ── SCENE / CAMERA ── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.z = 3.4;

    /* ── BUILD HEAD GEOMETRY from a sphere with vertex shaping ── */
    const geo = new THREE.SphereGeometry(1, 20, 16);
    const pos = geo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Narrow the chin / jaw
      if (y < -0.35) {
        const t = (-y - 0.35) / 0.65; // 0→1 toward bottom
        const shrink = 1 - t * 0.48;
        pos.setX(i, x * shrink);
        z = z * shrink;
      }

      // Flatten crown
      if (y > 0.82) {
        y = 0.82 + (y - 0.82) * 0.55;
        pos.setY(i, y);
      }

      // Nose protrusion — front-centre, mid-y band
      const frontness = Math.max(0, z); // positive Z = front
      const yBand = Math.max(0, 1 - Math.abs(y + 0.15) * 2.8); // peak at y≈-0.15
      if (frontness > 0 && yBand > 0) {
        pos.setZ(i, z + frontness * yBand * 0.15);
      }

      // Brow ridge — slight forward push at forehead
      const browFrontness = Math.max(0, z);
      const browBand = Math.max(0, 1 - Math.abs(y - 0.38) * 5);
      if (browFrontness > 0 && browBand > 0) {
        pos.setZ(i, pos.getZ(i) + browFrontness * browBand * 0.06);
      }

      // Cheekbone width — widen slightly at cheek height
      const cheekBand = Math.max(0, 1 - Math.abs(y + 0.05) * 3);
      if (cheekBand > 0) {
        pos.setX(i, pos.getX(i) * (1 + cheekBand * 0.06));
      }
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();

    /* ── GROUPS ── */
    const headGroup = new THREE.Group();
    headGroup.scale.set(0.86, 1.14, 0.88); // head proportions
    scene.add(headGroup);

    /* Main wireframe */
    const wireGeo = new THREE.WireframeGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x00ff41,
      transparent: true,
      opacity: 0.88,
    });
    const wireHead = new THREE.LineSegments(wireGeo, wireMat);
    headGroup.add(wireHead);

    /* Inner glow copy — slightly smaller, higher opacity on vertices */
    const innerGeo = new THREE.WireframeGeometry(geo);
    const innerMat = new THREE.LineBasicMaterial({
      color: 0x00ff41,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const innerHead = new THREE.LineSegments(innerGeo, innerMat);
    innerHead.scale.setScalar(0.97);
    headGroup.add(innerHead);

    /* Outer glow aura */
    const outerGeo = new THREE.WireframeGeometry(geo);
    const outerMat = new THREE.LineBasicMaterial({
      color: 0x00ff41,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
    });
    const outerHead = new THREE.LineSegments(outerGeo, outerMat);
    outerHead.scale.setScalar(1.05);
    headGroup.add(outerHead);

    /* ── POINTER DRAG ── */
    let dragging = false;
    let prevX = 0;
    let prevY = 0;
    let velX = 0;
    let velY = 0;
    let autoRotate = true;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    const getXY = (e: MouseEvent | TouchEvent) => {
      const p = "touches" in e ? e.touches[0] : (e as MouseEvent);
      return { x: p.clientX, y: p.clientY };
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      dragging = true;
      autoRotate = false;
      if (resumeTimer) clearTimeout(resumeTimer);
      const { x, y } = getXY(e);
      prevX = x;
      prevY = y;
      velX = 0;
      velY = 0;
      renderer.domElement.style.cursor = "grabbing";
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const { x, y } = getXY(e);
      const dx = x - prevX;
      const dy = y - prevY;
      headGroup.rotation.y += dx * 0.013;
      headGroup.rotation.x += dy * 0.013;
      headGroup.rotation.x = Math.max(
        -Math.PI * 0.45,
        Math.min(Math.PI * 0.45, headGroup.rotation.x)
      );
      velX = dx;
      velY = dy;
      prevX = x;
      prevY = y;
    };

    const onUp = () => {
      dragging = false;
      renderer.domElement.style.cursor = "grab";
      resumeTimer = setTimeout(() => {
        autoRotate = true;
      }, 2500);
    };

    const el = renderer.domElement;
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    el.style.cursor = "grab";

    /* ── ANIMATION ── */
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (autoRotate) {
        headGroup.rotation.y += 0.005;
        headGroup.rotation.x = Math.sin(t * 0.4) * 0.06;
      } else if (!dragging) {
        // inertia
        velX *= 0.90;
        velY *= 0.90;
        headGroup.rotation.y += velX * 0.008;
        headGroup.rotation.x += velY * 0.008;
      }

      // Pulse glow opacity
      outerMat.opacity = 0.05 + Math.sin(t * 1.8) * 0.03;
      innerMat.opacity = 0.18 + Math.sin(t * 1.2) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    /* ── RESIZE ── */
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
      geo.dispose();
      wireGeo.dispose();
      innerGeo.dispose();
      outerGeo.dispose();
      wireMat.dispose();
      innerMat.dispose();
      outerMat.dispose();
      renderer.dispose();
      if (mount.contains(el)) mount.removeChild(el);
    };
  }, []);

  return <div ref={mountRef} className="cyber-wireframe-head" />;
}
