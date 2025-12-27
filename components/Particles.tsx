import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType } from '../types';
import {
  generateSphere,
  processImageToPoints,
  GeometryResult
} from '../utils/geometry';

const PSYOP_LOGO_URL = "https://i.imgur.com/6TQT9vD.png"; 

interface ParticlesProps {
  shape: ShapeType;
  colors: string[];
  count?: number;
  expansion: number; 
  customImageUrl?: string | null;
  rotationSpeed: number;
}

const Particles: React.FC<ParticlesProps> = ({ 
  shape, 
  colors, 
  count = 35000, 
  expansion,
  customImageUrl,
  rotationSpeed
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const colorAttrRef = useRef<THREE.BufferAttribute>(null);
  const positionAttrRef = useRef<THREE.BufferAttribute>(null);
  
  const [targetPositions, setTargetPositions] = useState<Float32Array>(new Float32Array(count * 3));
  const [brightnessData, setBrightnessData] = useState<Float32Array | null>(null);
  const [edgeData, setEdgeData] = useState<Float32Array | null>(null);
  const [bgData, setBgData] = useState<Float32Array | null>(null);
  
  // We keep current positions in a ref to modify them in useFrame without re-renders
  const currentPositions = useRef<Float32Array>(new Float32Array(count * 3));

  // Initialize geometries
  useEffect(() => {
    let active = true;
    const loadGeometry = async () => {
      let result: GeometryResult;
      const scale = 2.5;

      switch (shape) {
        case ShapeType.PSYOP_QUEEN_EXE:
        case ShapeType.LOGO:
          const url = customImageUrl || PSYOP_LOGO_URL;
          result = await processImageToPoints(url, count, scale);
          break;
        case ShapeType.SPHERE:
        default:
          result = generateSphere(count, scale);
          break;
      }
      
      if (active) {
        setTargetPositions(result.positions);
        setBrightnessData(result.brightness || null);
        setEdgeData(result.edgeStrength || null);
        setBgData(result.isBackground || null);
      }
    };

    loadGeometry();
    return () => { active = false; };
  }, [shape, count, customImageUrl]);

  // Initialize current positions to sphere on mount so we don't start empty
  useEffect(() => {
    const result = generateSphere(count, 2.5);
    currentPositions.current.set(result.positions);
    if (positionAttrRef.current) {
        positionAttrRef.current.array.set(result.positions);
        positionAttrRef.current.needsUpdate = true;
    }
  }, [count]); // Re-run only if count changes

  // Generate color attribute buffer
  const colorAttribute = useMemo(() => {
    const array = new Float32Array(count * 3);
    const threeColors = colors.map(c => new THREE.Color(c));
    const availableColorCount = threeColors.length;

    for (let i = 0; i < count; i++) {
      let colorIndex = 0;

      if ((shape === ShapeType.LOGO || shape === ShapeType.PSYOP_QUEEN_EXE) && brightnessData) {
        const b = brightnessData[i];
        const e = edgeData ? edgeData[i] : 0;
        const isBg = bgData ? bgData[i] > 0.5 : false;
        
        // --- IMPROVED ANIME CEL SHADING LOGIC ---
        // 0: Shadow
        // 1: Midtone
        // 2: Details

        if (isBg) {
           colorIndex = 0; 
        } 
        else if (e > 0.12) { // Slightly more sensitive edge detection for better details
           colorIndex = 2; 
        } 
        else {
           // Body fill thresholds
           // Expanded Midtone range (0.25 to 0.85) to reduce flickering/splotchiness in gradients
           if (b < 0.25) {
             colorIndex = 0; 
           } else if (b > 0.85) {
             colorIndex = 2; 
           } else {
             colorIndex = 1; 
           }
        }
      } else {
        // Random coloring for abstract shapes
        colorIndex = Math.floor(Math.random() * availableColorCount);
      }
      
      // Fallback in case of index out of bounds
      if (colorIndex >= threeColors.length) colorIndex = 0;

      const choice = threeColors[colorIndex];
      array[i * 3] = choice.r;
      array[i * 3 + 1] = choice.g;
      array[i * 3 + 2] = choice.b;
    }
    return array;
  }, [colors, count, brightnessData, edgeData, bgData, shape]);

  // Robustly update color attribute when it changes
  useEffect(() => {
    if (colorAttrRef.current) {
      // Direct array mutation and update flag
      // @ts-ignore
      colorAttrRef.current.array.set(colorAttribute);
      colorAttrRef.current.needsUpdate = true;
    }
  }, [colorAttribute]);

  useFrame((state, delta) => {
    if (!positionAttrRef.current) return;

    const positions = positionAttrRef.current.array as Float32Array;
    const target = targetPositions;

    const lerpSpeed = 3.0 * delta;
    
    // Stiffer movement for images to maintain legibility
    const visualScale = 0.5 + (expansion * 0.8);

    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      let tx = target[i3];
      let ty = target[i3 + 1];
      let tz = target[i3 + 2];

      tx *= visualScale;
      ty *= visualScale;
      tz *= visualScale;

      // Low noise for clear images
      const noiseAmt = 0.002;
      
      tx += Math.sin(time + ty) * noiseAmt * expansion;
      ty += Math.cos(time + tx) * noiseAmt * expansion;

      positions[i3] += (tx - positions[i3]) * lerpSpeed;
      positions[i3 + 1] += (ty - positions[i3 + 1]) * lerpSpeed;
      positions[i3 + 2] += (tz - positions[i3 + 2]) * lerpSpeed;
    }

    positionAttrRef.current.needsUpdate = true;
    
    if (pointsRef.current) {
      pointsRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          ref={positionAttrRef}
          attach="attributes-position"
          count={count}
          array={currentPositions.current}
          itemSize={3}
        />
        <bufferAttribute
          ref={colorAttrRef}
          attach="attributes-color"
          count={count}
          array={colorAttribute}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        size={0.018} // Smaller particles for higher density
        vertexColors={true}
        sizeAttenuation={true}
        transparent={true}
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default Particles;