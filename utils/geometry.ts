import * as THREE from 'three';
import { ShapeType } from '../types';

export interface GeometryResult {
  positions: Float32Array;
  brightness?: Float32Array; // 0-1 values for color mapping
  edgeStrength?: Float32Array; // 0-1 values indicating if particle is part of an edge
  isBackground?: Float32Array; // 1 if particle is background, 0 if foreground
}

export const generateSphere = (count: number, radius: number): GeometryResult => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
    positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  return { positions };
};

// --- SEGMENTATION LOGIC ---

const getQuantizedColorKey = (r: number, g: number, b: number) => {
  // Coarser 4-bit quantization (0-15) to group noisy background colors better
  return `${(r >> 4)},${(g >> 4)},${(b >> 4)}`;
};

const analyzeImageSegmentation = (width: number, height: number, pixels: Uint8ClampedArray) => {
  const colorStats: Record<string, { total: number; outer: number; r: number; g: number; b: number }> = {};
  
  // Radial "Outer Zone" detection
  const isOuterZone = (x: number, y: number) => {
    const nx = (x / width - 0.5) * 2;
    const ny = (y / height - 0.5) * 2;
    return (nx * nx + ny * ny) > 0.3; 
  };

  // 1. Build Histogram
  for (let y = 0; y < height; y += 4) { 
    for (let x = 0; x < width; x += 4) {
      const i = (y * width + x) * 4;
      if (pixels[i + 3] < 50) continue; // Skip transparent

      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const key = getQuantizedColorKey(r, g, b);

      if (!colorStats[key]) {
        colorStats[key] = { total: 0, outer: 0, r, g, b };
      }
      colorStats[key].total++;
      if (isOuterZone(x, y)) {
        colorStats[key].outer++;
      }
    }
  }

  // 2. Classify Colors
  const bgColors = new Set<string>();
  Object.entries(colorStats).forEach(([key, stats]) => {
    const ratio = stats.outer / stats.total;
    if (ratio > 0.4) { 
      bgColors.add(key);
    }
  });

  return { bgColors, colorStats };
};

// Enhanced Image Processor
export const processImageToPoints = async (imageUrl: string, count: number, scale: number): Promise<GeometryResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    // Standard image loading for geometry - cached is fine here
    img.src = imageUrl; 

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(generateSphere(count, scale));
        return;
      }
      
      const width = 600; 
      const height = (img.height / img.width) * width;
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const pixels = imgData.data;
      
      // Perform Segmentation Analysis
      const { bgColors } = analyzeImageSegmentation(width, height, pixels);

      interface Pixel {
        x: number;
        y: number;
        brightness: number;
        edgeStrength: number;
        intensity: number;
        isBg: boolean;
        r: number; g: number; b: number;
      }

      const getBrightness = (x: number, y: number) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return 0;
        const i = (y * width + x) * 4;
        return (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
      };

      let minB = 255;
      let maxB = 0;
      let candidates: Pixel[] = [];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const alpha = pixels[index + 3];
          
          if (alpha > 20) {
            const r = pixels[index];
            const g = pixels[index+1];
            const b = pixels[index+2];
            const bright = (r + g + b) / 3;
            
            if (bright < minB) minB = bright;
            if (bright > maxB) maxB = bright;

            // Sobel Edge
            const gx = getBrightness(x+1, y) - getBrightness(x-1, y);
            const gy = getBrightness(x, y+1) - getBrightness(x, y-1);
            const edgeVal = Math.sqrt(gx*gx + gy*gy);
            const edgeStrength = Math.min(1.0, edgeVal / 100);

            // Classification
            const key = getQuantizedColorKey(r, g, b);
            
            // Background if matches key and isn't a hard edge (focus)
            const matchesBgColor = bgColors.has(key);
            const isBg = matchesBgColor && edgeStrength < 0.5;

            // Candidates selection importance
            let importance = Math.random() * 100;
            if (edgeStrength > 0.2) importance += edgeStrength * 1000;
            if (!isBg) importance += 500; // Boost foreground priority

            candidates.push({
              x, 
              y, 
              brightness: bright, 
              edgeStrength,
              intensity: importance,
              isBg,
              r, g, b
            });
          }
        }
      }

      candidates.sort((a, b) => b.intensity - a.intensity);
      
      let selected = candidates.length > count ? candidates.slice(0, count) : candidates;
      
      // Fill
      if (selected.length < count && candidates.length > 0) {
          const originalLength = selected.length;
          let i = 0;
          while (selected.length < count) {
             const source = selected[i % originalLength];
             selected.push({ ...source, x: source.x + (Math.random()-0.5), y: source.y + (Math.random()-0.5) });
             i++;
          }
      }

      const positions = new Float32Array(count * 3);
      const brightnessArr = new Float32Array(count);
      const edgeStrengthArr = new Float32Array(count);
      const isBackgroundArr = new Float32Array(count);

      const aspectRatio = width / height;
      const bRange = maxB - minB || 1;

      for (let i = 0; i < count; i++) {
        const p = selected[i];
        
        let nx = (p.x / width - 0.5) * 2;
        let ny = -(p.y / height - 0.5) * 2;

        nx *= aspectRatio; 
        const scanlines = 240; 
        ny = Math.floor(ny * scanlines) / scanlines;

        positions[i * 3] = nx * scale * 2.0;
        positions[i * 3 + 1] = ny * scale * 2.0;
        
        // Z-Depth
        let normBright = (p.brightness - minB) / bRange;
        let z = normBright * 0.15 * scale;
        
        // Background Push
        if (p.isBg) {
            z = -0.5 * scale + (normBright * 0.1); 
        } else {
            z += 0.1 * scale; 
        }
        
        positions[i * 3 + 2] = z + (p.edgeStrength * 0.05 * scale);

        brightnessArr[i] = normBright;
        edgeStrengthArr[i] = p.edgeStrength;
        isBackgroundArr[i] = p.isBg ? 1.0 : 0.0;
      }
      
      resolve({ positions, brightness: brightnessArr, edgeStrength: edgeStrengthArr, isBackground: isBackgroundArr });
    };
    
    img.onerror = () => {
        resolve(generateSphere(count, scale));
    };
  });
}

// --- COLOR THEORY UTILS ---

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

const rgbToHex = (c: RGB): string => {
  return "#" + ((1 << 24) + (Math.round(c.r) << 16) + (Math.round(c.g) << 8) + Math.round(c.b)).toString(16).slice(1);
};

const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHsl = (c: RGB): HSL => {
    let r = c.r / 255, g = c.g / 255, b = c.b / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h, s, l };
};

const hslToRgb = (c: HSL): RGB => {
    let r, g, b;
    let h = c.h, s = c.s, l = c.l;
    if (s === 0) { r = g = b = l; } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
};

const wrapHue = (h: number) => (h % 1 + 1) % 1;

// --- RADICAL AUTO TONE ALGORITHM ---
export const extractColorsFromImage = async (imageUrl: string): Promise<string[]> => {
  return new Promise((resolve) => {
    // 1. PURE CHAOS GENERATOR
    // No color theory. Just random, high-energy colors.
    const generateRandomPalette = () => {
      
      const randomColor = (minL: number, maxL: number) => {
        return {
          h: Math.random(), // 0-1, accesses entire spectrum (Red, Green, Blue, Purple...)
          s: 0.85 + Math.random() * 0.15, // 85%-100% Saturation (Punchy)
          l: minL + Math.random() * (maxL - minL) // Controlled Brightness
        };
      };

      // SHADOW: Darker, but colorful (L: 0.2 - 0.4)
      const shadowHsl = randomColor(0.2, 0.4);
      
      // MIDTONE: Bright & Pop (L: 0.45 - 0.7)
      const midHsl = randomColor(0.45, 0.7);
      
      // Enforce difference between Shadow and Mid hue to prevent washing out
      if (Math.abs(midHsl.h - shadowHsl.h) < 0.15) {
          midHsl.h = wrapHue(midHsl.h + 0.5);
      }

      // DETAILS: Very Bright / Neon (L: 0.6 - 0.95)
      // Independent random hue allows for Red, Pink, Cyan etc.
      const detailHsl = randomColor(0.6, 0.95);

      // GLOW: Anything goes (L: 0.5 - 0.8)
      const glowHsl = randomColor(0.5, 0.8);

      const colors = [shadowHsl, midHsl, detailHsl, glowHsl].map(c => rgbToHex(hslToRgb(c)));
      
      return colors;
    };

    // We don't even need to load the image for this "Radical Chaos" mode
    // because the user requested NO color theory based on the image.
    // However, to simulate "processing" and support future features, we return the promise.
    // The previous implementation tried to extract hues; this one ignores them 
    // to strictly satisfy "radically different each time".
    
    resolve(generateRandomPalette());
  });
};