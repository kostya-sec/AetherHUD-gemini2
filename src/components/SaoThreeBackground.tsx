import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SaoThreeBackgroundProps {
  isHudActive: boolean;
  opacity: number;
}

export const SaoThreeBackground: React.FC<SaoThreeBackgroundProps> = ({
  isHudActive,
  opacity
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 1. Particle Cloud: Glowing SAO data dust
    const particleCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const colorCyan = new THREE.Color('#22d3ee');
    const colorIndigo = new THREE.Color('#818cf8');
    const colorAmber = new THREE.Color('#38bdf8');

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 110;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;

      const pickColor = Math.random() > 0.6 ? colorCyan : (Math.random() > 0.3 ? colorIndigo : colorAmber);
      colors[i * 3] = pickColor.r;
      colors[i * 3 + 1] = pickColor.g;
      colors[i * 3 + 2] = pickColor.b;

      scales[i] = Math.random() * 2 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(34, 211, 238, 0.8)');
      grad.addColorStop(0.7, 'rgba(6, 182, 212, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 2.2,
      map: texture,
      transparent: true,
      opacity: 0.75,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 2. Wireframe Hexagonal Ring (SAO Geometric Motif)
    const ringGeo = new THREE.RingGeometry(28, 30, 6);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending
    });
    const hexRing = new THREE.Mesh(ringGeo, ringMat);
    hexRing.rotation.x = Math.PI / 4;
    scene.add(hexRing);

    // Secondary concentric ring
    const ringGeo2 = new THREE.RingGeometry(44, 45, 6);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending
    });
    const hexRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    hexRing2.rotation.x = -Math.PI / 5;
    scene.add(hexRing2);

    // Mouse movement parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow majestic rotation
      particles.rotation.y = elapsedTime * 0.03 + mouseX * 0.08;
      particles.rotation.x = elapsedTime * 0.015 - mouseY * 0.08;

      hexRing.rotation.z = elapsedTime * 0.08;
      hexRing2.rotation.z = -elapsedTime * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none transition-opacity duration-300 -z-0"
      style={{ opacity }}
    />
  );
};
