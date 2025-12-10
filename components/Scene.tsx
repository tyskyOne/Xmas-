import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { TreeState } from '../types';
import { COLORS, TREE_CONFIG, ANIMATION_CONFIG } from '../constants';

interface SceneProps {
  treeState: TreeState;
}

// Inner mesh to give the tree "body" and color volume
const InnerTreeCore: React.FC<{ treeState: TreeState }> = ({ treeState }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
       // Animate Scale based on state
       const targetScale = treeState === TreeState.TREE_SHAPE ? 1.0 : 0.0;
       const currentScale = meshRef.current.scale.y;
       
       const diff = targetScale - currentScale;
       const nextScale = currentScale + diff * delta * ANIMATION_CONFIG.TRANSITION_SPEED;
       
       meshRef.current.scale.setScalar(nextScale);
       // Keep y scale relative to height logic if needed, but scalar is fine for uniform growth
    }
  });

  return (
    <mesh ref={meshRef} position={[0, TREE_CONFIG.HEIGHT / 2, 0]}>
      <coneGeometry args={[TREE_CONFIG.RADIUS_BASE * 0.7, TREE_CONFIG.HEIGHT, 32]} />
      <meshStandardMaterial 
        color="#012b18" 
        roughness={0.8}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

export const Scene: React.FC<SceneProps> = ({ treeState }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle rotation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <>
      {/* --- LIGHTING --- */}
      <ambientLight intensity={0.4} color="#001a0f" />
      
      {/* Key Light (Warm Gold) - Increased brightness */}
      <spotLight
        position={[10, 20, 10]}
        angle={0.4}
        penumbra={0.5}
        intensity={300}
        color={COLORS.GOLD_PALE}
        castShadow
        shadow-bias={-0.0001}
      />

      {/* Rim Light (Cool/Emerald) */}
      <spotLight
        position={[-10, 8, -10]}
        angle={0.5}
        penumbra={1}
        intensity={150}
        color="#00ffaa"
      />
      
      {/* Front Fill for Colors */}
      <pointLight position={[0, 2, 10]} intensity={50} color="#fff5e6" distance={20} />

      <Environment preset="city" />
      
      {/* Background Ambience */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />

      {/* Main Composition */}
      <group ref={groupRef} position={[0, -3.5, 0]}>
        <InnerTreeCore treeState={treeState} />
        <Foliage treeState={treeState} />
        <Ornaments treeState={treeState} />
        
        {/* Magic Sparkles around the tree */}
        <Sparkles 
          count={200} 
          scale={[10, 10, 10]} 
          size={4} 
          speed={0.4} 
          opacity={0.8}
          color="#FFD700"
          position={[0, 4, 0]}
        />
        
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial 
            color="#000905" 
            roughness={0.1} 
            metalness={0.8} 
          />
        </mesh>
      </group>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.9}
        minDistance={6}
        maxDistance={22}
      />

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.9} // Glows more easily
          mipmapBlur 
          intensity={1.5} 
          radius={0.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.7} />
        <Noise opacity={0.015} />
      </EffectComposer>
    </>
  );
};