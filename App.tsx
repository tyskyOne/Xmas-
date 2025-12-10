import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { TreeState } from './types';
import { Loader } from '@react-three/drei';

export default function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);

  const toggleState = () => {
    setTreeState((prev) => 
      prev === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE
    );
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 2, 12], fov: 45 }}
          gl={{ antialias: false, stencil: false, depth: true }}
        >
          <Suspense fallback={null}>
            <Scene treeState={treeState} />
          </Suspense>
        </Canvas>
        <Loader 
          containerStyles={{ background: '#010b06' }} 
          barStyles={{ background: '#D4AF37', height: '2px' }} 
          dataStyles={{ color: '#D4AF37', fontFamily: 'Cinzel' }}
        />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8 md:p-12">
        {/* Header */}
        <header className="flex justify-between items-start animate-fade-in-down">
          <div>
            <h1 className="text-3xl md:text-5xl font-display text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F8F3D4] to-[#D4AF37] tracking-wider drop-shadow-lg">
              ARIX
            </h1>
            <p className="text-[#059669] font-body tracking-[0.3em] text-xs md:text-sm mt-2 uppercase">
              Signature Collection
            </p>
          </div>
        </header>

        {/* Footer / Controls */}
        <footer className="flex flex-col items-center pointer-events-auto gap-6">
          <button
            onClick={toggleState}
            className="group relative px-8 py-3 bg-opacity-20 bg-black backdrop-blur-md border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all duration-500 rounded-sm overflow-hidden"
          >
            <div className="absolute inset-0 w-0 bg-[#D4AF37] transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
            <span className="relative font-display text-[#D4AF37] tracking-widest text-sm md:text-base group-hover:text-white transition-colors duration-300">
              {treeState === TreeState.TREE_SHAPE ? 'DISASSEMBLE' : 'ASSEMBLE'}
            </span>
          </button>
          
          <div className="text-[#555] font-body text-[10px] tracking-widest opacity-60">
            INTERACTIVE EXPERIENCE • 2024
          </div>
        </footer>
      </div>
    </div>
  );
}