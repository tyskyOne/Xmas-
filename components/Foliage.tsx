import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { TREE_CONFIG, ANIMATION_CONFIG } from '../constants';

// --- Custom Shader Material for High Performance Particles ---
const foliageVertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0.0 (Scattered) -> 1.0 (Tree)
  
  attribute vec3 aTreePos;
  attribute vec3 aScatterPos;
  attribute float aRandom;
  
  varying float vAlpha;
  varying vec3 vColor;

  // Cubic Ease In Out for smoother transition
  float easeInOutCubic(float x) {
    return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
  }

  void main() {
    // Calculate transition with slight randomness per particle for organic feel
    float localProgress = clamp(uProgress * 1.2 - aRandom * 0.2, 0.0, 1.0);
    float easedProgress = easeInOutCubic(localProgress);

    // Mix positions
    vec3 pos = mix(aScatterPos, aTreePos, easedProgress);

    // Add breathing/wind effect primarily when in tree mode
    float wind = sin(uTime * 2.0 + pos.y * 2.0 + pos.x) * 0.08 * easedProgress;
    pos.x += wind;
    pos.z += wind;

    // View Position
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation - slightly larger particles for fuller tree
    gl_PointSize = (90.0 * aRandom + 50.0) * (1.0 / -mvPosition.z);
    
    // Varying setup
    vAlpha = 0.8 + 0.2 * sin(uTime * 3.0 + aRandom * 10.0); // Twinkle
    
    // Color Mix: Deep Emerald -> Vibrant Green -> Gold Tips
    float heightFactor = (pos.y + 1.0) / 10.0;
    
    // More vibrant green gradient
    vec3 colorDeep = vec3(0.0, 0.25, 0.1); 
    vec3 colorLight = vec3(0.1, 0.6, 0.3);
    
    vColor = mix(colorDeep, colorLight, heightFactor);
    
    // Add gold/white frost tint based on noise
    if (aRandom > 0.85) {
      vColor = mix(vColor, vec3(0.9, 0.9, 0.7), 0.7); // Frosted/Gold sparkles
    }
  }
`;

const foliageFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    // Soft Circular particle
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float ll = length(xy);
    if (ll > 0.5) discard;

    // Soft edge glow with hot center
    float glow = 1.0 - (ll * 2.0);
    glow = pow(glow, 2.0);

    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

interface FoliageProps {
  treeState: TreeState;
}

export const Foliage: React.FC<FoliageProps> = ({ treeState }) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate Geometry Data
  const { positions, treePositions, scatterPositions, randoms } = useMemo(() => {
    const count = TREE_CONFIG.PARTICLE_COUNT;
    const pos = new Float32Array(count * 3);
    const treePos = new Float32Array(count * 3);
    const scatterPos = new Float32Array(count * 3);
    const rands = new Float32Array(count);

    const { HEIGHT, RADIUS_BASE, SCATTER_RADIUS } = TREE_CONFIG;

    for (let i = 0; i < count; i++) {
      // 1. Tree Position (Cone/Spiral volume)
      const h = Math.random(); 
      const y = h * HEIGHT; 
      // Cone radius at height
      const rAtH = RADIUS_BASE * (1 - h); 
      const angle = i * 0.1 + Math.random() * Math.PI * 2;
      // Volume distribution (sqrt for uniform disk, but we want slightly more on surface)
      const r = (Math.random() * 0.3 + 0.7) * rAtH; // Bias towards surface

      const tx = Math.cos(angle) * r;
      const tz = Math.sin(angle) * r;
      
      treePos[i * 3] = tx;
      treePos[i * 3 + 1] = y;
      treePos[i * 3 + 2] = tz;

      // 2. Scatter Position
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const sr = Math.cbrt(Math.random()) * SCATTER_RADIUS;
      
      const sx = sr * Math.sin(phi) * Math.cos(theta);
      const sy = sr * Math.sin(phi) * Math.sin(theta) + HEIGHT / 2;
      const sz = sr * Math.cos(phi);

      scatterPos[i * 3] = sx;
      scatterPos[i * 3 + 1] = sy;
      scatterPos[i * 3 + 2] = sz;

      pos[i * 3] = sx;
      pos[i * 3 + 1] = sy;
      pos[i * 3 + 2] = sz;

      rands[i] = Math.random();
    }

    return {
      positions: pos,
      treePositions: treePos,
      scatterPositions: scatterPos,
      randoms: rands
    };
  }, []);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      const targetProgress = treeState === TreeState.TREE_SHAPE ? 1.0 : 0.0;
      const currentProgress = materialRef.current.uniforms.uProgress.value;
      const diff = targetProgress - currentProgress;
      materialRef.current.uniforms.uProgress.value += diff * delta * ANIMATION_CONFIG.TRANSITION_SPEED;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={scatterPositions.length / 3}
          array={scatterPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={foliageVertexShader}
        fragmentShader={foliageFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};