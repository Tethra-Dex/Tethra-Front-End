'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Tube, Grid } from '@react-three/drei';
import * as THREE from 'three';
const DataLine = () => {
  const tubeRef = useRef<THREE.Mesh>(null);

  const initialPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i < 20; i++) {
      const x = i * 2 - 20;
      const y = Math.sin(i * 0.5) * Math.random() * 2; 
      const z = (Math.random() - 0.5) * 5; 
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, []);
  useFrame(({ clock }) => {
    if (tubeRef.current) {
      const t = clock.getElapsedTime();
      // @ts-ignore
      if(tubeRef.current.material.map) {
          // @ts-ignore
          tubeRef.current.material.map.offset.x = -t * 0.3;
      }
      const newPoints = initialPoints.map(p => {
        const point = p.clone();
        point.y += Math.sin(t * 1.5 + point.x * 0.4) * 0.8; 
        point.z += Math.cos(t * 1.0 + point.x * 0.3) * 0.5;
        return point;
      });
      const newCurve = new THREE.CatmullRomCurve3(newPoints);
      if (tubeRef.current.geometry) {
        tubeRef.current.geometry.dispose();
      }
      tubeRef.current.geometry = new THREE.TubeGeometry(newCurve, 64, 0.05, 8, false);
    }
  });
  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 256, 0);
      gradient.addColorStop(0, '#00BFFF'); 
      gradient.addColorStop(1, '#4dff4d'); 
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }, []);
  const initialCurve = useMemo(() => new THREE.CatmullRomCurve3(initialPoints), [initialPoints]);

  return (
    <Tube ref={tubeRef} args={[initialCurve, 64, 0.05, 8, false]}>
      <meshStandardMaterial
        map={gradientTexture}
        emissive={'#ffffff'}
        emissiveIntensity={2.5}
        toneMapped={false}
      />
    </Tube>
  );
};
const FinancialDataScene = () => {
  return (
    <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
      <color attach="background" args={['#050505']} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <Grid
        position={[0, -2, 0]}
        args={[100, 100]}
        cellSize={1}
        cellThickness={1}
        cellColor={'#6f6f6f'}
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor={'#00BFFF'}
        fadeDistance={50}
        fadeStrength={1}
        infiniteGrid
      />
      
      <DataLine />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
      />
    </Canvas>
  );
};

export default FinancialDataScene;

