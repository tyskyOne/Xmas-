import React, { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, PositionData } from '../types';
import { TREE_CONFIG, ANIMATION_CONFIG, COLORS } from '../constants';

// --- Geometries ---
const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
// Simple Bell Shape: Cylinder with narrow top
const bellGeo = new THREE.CylinderGeometry(0.2, 0.8, 1, 16, 1);
bellGeo.translate(0, -0.2, 0); // Re-center visual center

// --- Materials ---
const goldMaterial = new THREE.MeshStandardMaterial({
  color: COLORS.GOLD_METALLIC,
  roughness: 0.1,
  metalness: 0.9,
  envMapIntensity: 2.5,
});

const redMaterial = new THREE.MeshStandardMaterial({
  color: COLORS.RED_VELVET, // Much brighter red now
  roughness: 0.15,
  metalness: 0.5,
  envMapIntensity: 1.5,
});

const silverMaterial = new THREE.MeshStandardMaterial({
  color: COLORS.SILVER,
  roughness: 0.1,
  metalness: 0.95,
  envMapIntensity: 2.0,
});

interface OrnamentsProps {
  treeState: TreeState;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ treeState }) => {
  const goldSpheresRef = useRef<THREE.InstancedMesh>(null);
  const redBoxesRef = useRef<THREE.InstancedMesh>(null);
  const bellsRef = useRef<THREE.InstancedMesh>(null);
  const starRef = useRef<THREE.Mesh>(null);

  const goldSphereData = useRef<PositionData[]>([]);
  const redBoxData = useRef<PositionData[]>([]);
  const bellData = useRef<PositionData[]>([]);

  // Initialize Data
  useLayoutEffect(() => {
    const { HEIGHT, RADIUS_BASE, ORNAMENT_COUNT, SCATTER_RADIUS } = TREE_CONFIG;
    
    // Helper to generate positions
    const generateData = (count: number): PositionData[] => {
      const data: PositionData[] = [];
      for (let i = 0; i < count; i++) {
        // Tree Position (Surface)
        const h = Math.random() * (HEIGHT - 1.5) + 0.5; // Avoid very bottom and very top
        const rAtH = RADIUS_BASE * (1 - (h / HEIGHT));
        
        // Push ornaments slightly out of the foliage
        const r = rAtH + 0.1 + Math.random() * 0.2; 
        const angle = Math.random() * Math.PI * 2;
        
        const tx = Math.cos(angle) * r;
        const ty = h;
        const tz = Math.sin(angle) * r;

        // Scatter Position
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const sr = SCATTER_RADIUS * 0.9;
        
        const sx = sr * Math.sin(phi) * Math.cos(theta);
        const sy = sr * Math.sin(phi) * Math.sin(theta) + HEIGHT / 2;
        const sz = sr * Math.cos(phi);

        data.push({
          treePosition: [tx, ty, tz],
          scatterPosition: [sx, sy, sz],
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
          scale: Math.random() * 0.3 + 0.2, // Base scale
          type: 'box' // placeholder
        });
      }
      return data;
    };

    // Distribute counts
    goldSphereData.current = generateData(Math.floor(ORNAMENT_COUNT * 0.4));
    redBoxData.current = generateData(Math.floor(ORNAMENT_COUNT * 0.4));
    bellData.current = generateData(Math.floor(ORNAMENT_COUNT * 0.2));

  }, []);

  // Generic Animation Handler
  const animateMesh = (
    ref: React.RefObject<THREE.InstancedMesh | null>, 
    data: PositionData[], 
    delta: number, 
    clockTime: number, 
    targetProgress: number,
    scaleMult: number = 1.0,
    wobble: boolean = false
  ) => {
    if (!ref.current) return;

    let progress = ref.current.userData.progress ?? 0;
    const diff = targetProgress - progress;
    progress += diff * delta * ANIMATION_CONFIG.TRANSITION_SPEED;
    ref.current.userData.progress = progress;

    const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const dummy = new THREE.Object3D();

    data.forEach((d, i) => {
      const { treePosition, scatterPosition, rotation, scale } = d;
      
      dummy.position.set(
        THREE.MathUtils.lerp(scatterPosition[0], treePosition[0], eased),
        THREE.MathUtils.lerp(scatterPosition[1], treePosition[1], eased),
        THREE.MathUtils.lerp(scatterPosition[2], treePosition[2], eased)
      );

      // Float rotation
      const floatFactor = 1.0 - eased;
      
      // If it's a bell (wobble), we want it to hang downwards when in tree mode
      // But spin when scattered
      if (wobble) {
        // Tree Mode: Hang down with slight sway
        const sway = Math.sin(clockTime * 2 + i) * 0.1;
        dummy.rotation.set(
            THREE.MathUtils.lerp(rotation[0] + clockTime, 0, eased) + sway, // 0 is upright? Cylinder defaults vertical
            THREE.MathUtils.lerp(rotation[1] + clockTime, rotation[1], eased),
            THREE.MathUtils.lerp(rotation[2] + clockTime, 0, eased) + sway
        );
      } else {
         dummy.rotation.set(
          rotation[0] + clockTime * 0.5 * floatFactor,
          rotation[1] + clockTime * 0.3 * floatFactor,
          rotation[2]
        );
      }

      dummy.scale.setScalar(scale * scaleMult);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  };

  useFrame((state, delta) => {
    const targetProgress = treeState === TreeState.TREE_SHAPE ? 1.0 : 0.0;
    const time = state.clock.elapsedTime;

    animateMesh(goldSpheresRef, goldSphereData.current, delta, time, targetProgress, 1.0);
    animateMesh(redBoxesRef, redBoxData.current, delta, time, targetProgress, 1.3); // Boxes larger
    animateMesh(bellsRef, bellData.current, delta, time, targetProgress, 1.0, true); // Bells wobble

    // Update Star
    if (starRef.current) {
        const p = goldSpheresRef.current?.userData.progress ?? (treeState === TreeState.TREE_SHAPE ? 1 : 0);
        const starHeight = TREE_CONFIG.HEIGHT;
        const scatterY = starHeight + 5;
        
        starRef.current.position.y = THREE.MathUtils.lerp(scatterY, starHeight, p);
        starRef.current.rotation.y += delta * 0.5;
        const s = 1 + Math.sin(time * 3) * 0.1;
        starRef.current.scale.setScalar(s * p);
    }
  });

  return (
    <>
      <instancedMesh
        ref={goldSpheresRef}
        args={[sphereGeo, goldMaterial, TREE_CONFIG.ORNAMENT_COUNT]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={redBoxesRef}
        args={[boxGeo, redMaterial, TREE_CONFIG.ORNAMENT_COUNT]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={bellsRef}
        args={[bellGeo, silverMaterial, TREE_CONFIG.ORNAMENT_COUNT]}
        castShadow
        receiveShadow
      />
      
      {/* The Top Star - Enhanced */}
      <group ref={starRef} position={[0, TREE_CONFIG.HEIGHT, 0]}>
        <mesh>
          <octahedronGeometry args={[0.6, 0]} />
          <meshBasicMaterial color="#FFF" />
        </mesh>
        <pointLight intensity={15} distance={8} color="#FFF" />
      </group>
    </>
  );
};