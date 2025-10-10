'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Wireframe Grid Planes (inspired by logo)
const WireframePlanes = ({ scrollProgress = 0 }: { scrollProgress?: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftPlaneRef = useRef<THREE.Mesh>(null);
  const rightPlaneRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const time = clock.getElapsedTime();
      groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.2 * (1 - scrollProgress);
    }

    // Move planes apart as we zoom through
    if (leftPlaneRef.current) {
      const targetX = -3 - scrollProgress * 8;
      leftPlaneRef.current.position.x += (targetX - leftPlaneRef.current.position.x) * 0.1;
    }
    if (rightPlaneRef.current) {
      const targetX = 3 + scrollProgress * 8;
      rightPlaneRef.current.position.x += (targetX - rightPlaneRef.current.position.x) * 0.1;
    }
  });

  const createGridPlane = (width: number, height: number, divisions: number) => {
    const geometry = new THREE.PlaneGeometry(width, height, divisions, divisions);
    return geometry;
  };

  return (
    <group ref={groupRef}>
      {/* Left plane (blue side) */}
      <mesh ref={leftPlaneRef} position={[-3, 0, 0]} rotation={[0, Math.PI / 6, 0]}>
        <primitive object={createGridPlane(6, 8, 20)} />
        <meshBasicMaterial
          color="#0ea5e9"
          wireframe
          transparent
          opacity={0.6 * (1 - scrollProgress * 0.5)}
        />
      </mesh>

      {/* Right plane (green side) */}
      <mesh ref={rightPlaneRef} position={[3, 0, 0]} rotation={[0, -Math.PI / 6, 0]}>
        <primitive object={createGridPlane(6, 8, 20)} />
        <meshBasicMaterial
          color="#10b981"
          wireframe
          transparent
          opacity={0.6 * (1 - scrollProgress * 0.5)}
        />
      </mesh>

      {/* Top left wing */}
      <mesh position={[-4, 4, -1]} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <primitive object={createGridPlane(4, 3, 15)} />
        <meshBasicMaterial
          color="#0ea5e9"
          wireframe
          transparent
          opacity={0.4 * (1 - scrollProgress * 0.7)}
        />
      </mesh>

      {/* Top right wing */}
      <mesh position={[4, 4, -1]} rotation={[Math.PI / 3, -Math.PI / 4, 0]}>
        <primitive object={createGridPlane(4, 3, 15)} />
        <meshBasicMaterial
          color="#10b981"
          wireframe
          transparent
          opacity={0.4 * (1 - scrollProgress * 0.7)}
        />
      </mesh>
    </group>
  );
};

// Animated Grid Floor
const GridFloor = () => {
  const gridRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (gridRef.current) {
      const material = gridRef.current.material as THREE.ShaderMaterial;
      material.uniforms.time.value = clock.getElapsedTime();
    }
  });

  const geometry = useMemo(() => new THREE.PlaneGeometry(40, 40, 40, 40), []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color('#0ea5e9') },
        color2: { value: new THREE.Color('#10b981') },
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          float wave1 = sin(pos.x * 0.5 + time) * 0.3;
          float wave2 = sin(pos.y * 0.5 + time * 0.8) * 0.3;
          pos.z = wave1 + wave2;
          
          vElevation = pos.z;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          vec3 color = mix(color1, color2, vUv.x);
          float alpha = 0.15 + vElevation * 0.2;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      wireframe: true,
    });
  }, []);

  return (
    <mesh
      ref={gridRef}
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -4, 0]}
    />
  );
};

// Glowing Particles with gradient
const GradientParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 200;

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color1 = new THREE.Color('#0ea5e9');
    const color2 = new THREE.Color('#10b981');

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = Math.random() * 15 - 2;
      const z = (Math.random() - 0.5) * 30;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Gradient from blue to green based on x position
      const mixRatio = (x + 15) / 30;
      const color = color1.clone().lerp(color2, mixRatio);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.1 + 0.05;
    }

    return { positions, colors, sizes };
  }, []);

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += 0.01;

        if (positions[i * 3 + 1] > 13) {
          positions[i * 3 + 1] = -2;
        }
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Central "T" Logo Formation
const CentralLogo = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const time = clock.getElapsedTime();
      groupRef.current.rotation.y = time * 0.2;
      
      groupRef.current.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.5 + Math.sin(time * 2 + index) * 0.2;
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Left T shape (blue) */}
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry args={[0.1, 4, 2]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.5} />
      </mesh>
      
      <mesh position={[-2.5, 1.5, 0]}>
        <boxGeometry args={[2, 0.1, 2]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.5} />
      </mesh>

      {/* Right T shape (green) */}
      <mesh position={[1.5, 0, 0]}>
        <boxGeometry args={[0.1, 4, 2]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
      </mesh>
      
      <mesh position={[2.5, 1.5, 0]}>
        <boxGeometry args={[2, 0.1, 2]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
      </mesh>

      {/* Connecting lines */}
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[3, 0.05, 0.05]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

// Orbiting Rings
const OrbitingRings = () => {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y = clock.getElapsedTime() * 0.15;
      ringsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  return (
    <group ref={ringsRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.4} />
      </mesh>
      
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[6, 0.02, 16, 100]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
      </mesh>

      <mesh rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[7, 0.02, 16, 100]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

// Camera Controller with Zoom Animation
const CameraController = ({ scrollProgress }: { scrollProgress: number }) => {
  useFrame((state) => {
    const { camera } = state;

    // Smooth zoom in through the gap between planes
    const targetZ = 15 - scrollProgress * 20; // Move from 15 to -5 (zoom through)
    const targetY = 2 - scrollProgress * 2; // Lower camera slightly
    const targetFov = 50 + scrollProgress * 30; // Widen FOV for tunnel effect

    // Smooth interpolation
    camera.position.z += (targetZ - camera.position.z) * 0.1;
    camera.position.y += (targetY - camera.position.y) * 0.1;

    if ('fov' in camera) {
      (camera as THREE.PerspectiveCamera).fov += (targetFov - (camera as THREE.PerspectiveCamera).fov) * 0.1;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  });

  return null;
};

// Main Scene
interface TethraTradingSceneProps {
  scrollProgress?: number;
}

const TethraTradingScene = ({ scrollProgress = 0 }: TethraTradingSceneProps) => {
  return (
    <Canvas
      camera={{ position: [0, 2, 15], fov: 50 }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#0a0a0a']} />

      {/* Camera Animation Controller */}
      <CameraController scrollProgress={scrollProgress} />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[-10, 5, 5]} intensity={1} color="#0ea5e9" />
      <pointLight position={[10, 5, 5]} intensity={1} color="#10b981" />
      <pointLight position={[0, 10, -5]} intensity={0.5} color="#06b6d4" />

      {/* Scene Elements */}
      <GridFloor />
      <WireframePlanes scrollProgress={scrollProgress} />
      <CentralLogo />
      <OrbitingRings />
      <GradientParticles />

      {/* Fog */}
      <fog attach="fog" args={['#0a0a0a', 15, 35]} />
    </Canvas>
  );
};

export default TethraTradingScene;
