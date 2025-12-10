import * as THREE from 'three';

// Visual Identity
export const COLORS = {
  EMERALD_DEEP: new THREE.Color('#002b18'), // Brighter deep green
  EMERALD_LIGHT: new THREE.Color('#1a7f52'), // More visible bright green
  GOLD_METALLIC: new THREE.Color('#FFD700'),
  GOLD_PALE: new THREE.Color('#F3E5AB'),
  RED_VELVET: new THREE.Color('#D42426'), // Brighter Holiday Red
  SILVER: new THREE.Color('#E5E4E2'),
};

// Tree Dimensions
export const TREE_CONFIG = {
  HEIGHT: 9,
  RADIUS_BASE: 3.5,
  PARTICLE_COUNT: 15000, // Increased for density
  ORNAMENT_COUNT: 450, // Increased for fullness
  SCATTER_RADIUS: 15,
};

// Animation
export const ANIMATION_CONFIG = {
  TRANSITION_SPEED: 2.0, // Lerp speed factor
};