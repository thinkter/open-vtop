/**
 * CAPTCHA Solver for VTOP
 * Uses canvas for image processing and bitmap matching / neural network for character recognition
 */

import { createCanvas, loadImage } from "canvas";
import { bitmaps } from "./bitmaps.js";

// ============ Bitmap-based solver (original method) ============

function captchaParse(imgarr: number[][]): string {
  let captcha = "";

  // Noise removal
  for (let x = 1; x < 44; x++) {
    for (let y = 1; y < 179; y++) {
      const condition1 =
        imgarr[x][y - 1] === 255 &&
        imgarr[x][y] === 0 &&
        imgarr[x][y + 1] === 255;
      const condition2 =
        imgarr[x - 1][y] === 255 &&
        imgarr[x][y] === 0 &&
        imgarr[x + 1][y] === 255;
      const condition3 = imgarr[x][y] !== 255 && imgarr[x][y] !== 0;
      if (condition1 || condition2 || condition3) {
        imgarr[x][y] = 255;
      }
    }
  }

  // Character matching
  const chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
  for (let j = 30; j < 181; j += 30) {
    const matches: [number, string][] = [];
    for (let i = 0; i < chars.length; i++) {
      let match = 0;
      let black = 0;
      const ch = chars.charAt(i);
      const mask = bitmaps[ch];
      if (!mask) continue;

      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 30; y++) {
          const y1 = y + j - 30;
          const x1 = x + 12;
          if (imgarr[x1]?.[y1] === mask[x]?.[y] && mask[x]?.[y] === 0) {
            match += 1;
          }
          if (mask[x]?.[y] === 0) {
            black += 1;
          }
        }
      }
      const perc = black > 0 ? match / black : 0;
      matches.push([perc, ch]);
    }
    captcha += matches.reduce((a, b) => (a[0] > b[0] ? a : b), [0, ""])[1];
  }
  return captcha;
}

// ============ Saturation-based solver (neural network method) ============

function preImg(img: number[][]): number[][] {
  let avg = 0;
  img.forEach((e) => e.forEach((f) => (avg += f)));
  avg /= img.length * img[0].length;

  const bits: number[][] = new Array(img.length);
  for (let i = 0; i < img.length; i++) {
    bits[i] = new Array(img[0].length);
    for (let j = 0; j < img[0].length; j++) {
      bits[i][j] = img[i][j] > avg ? 1 : 0;
    }
  }
  return bits;
}

function saturation(d: Uint8ClampedArray): number[][][] {
  const saturate: number[] = new Array(d.length / 4);
  for (let i = 0; i < d.length; i += 4) {
    const min = Math.min(d[i], d[i + 1], d[i + 2]);
    const max = Math.max(d[i], d[i + 1], d[i + 2]);
    saturate[i / 4] = max > 0 ? Math.round(((max - min) * 255) / max) : 0;
  }

  const img: number[][] = new Array(40);
  for (let i = 0; i < 40; i++) {
    img[i] = new Array(200);
    for (let j = 0; j < 200; j++) {
      img[i][j] = saturate[i * 200 + j];
    }
  }

  const bls: number[][][] = new Array(6);
  for (let i = 0; i < 6; i++) {
    const x1 = (i + 1) * 25 + 2;
    const y1 = 7 + 5 * (i % 2) + 1;
    const x2 = (i + 2) * 25 + 1;
    const y2 = 35 - 5 * ((i + 1) % 2);
    bls[i] = img.slice(y1, y2).map((row) => row.slice(x1, x2));
  }
  return bls;
}

function flatten(arr: number[][]): number[] {
  const bits: number[] = new Array(arr.length * arr[0].length);
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[0].length; j++) {
      bits[i * arr[0].length + j] = arr[i][j];
    }
  }
  return bits;
}

function matMul(a: number[][], b: number[][]): number[][] {
  const x = a.length;
  const z = a[0].length;
  const y = b[0].length;

  const product: number[][] = new Array(x);
  for (let p = 0; p < x; p++) {
    product[p] = new Array(y).fill(0);
  }

  for (let i = 0; i < x; i++) {
    for (let j = 0; j < y; j++) {
      for (let k = 0; k < z; k++) {
        product[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return product;
}

function matAdd(a: number[], b: number[]): number[] {
  const c: number[] = new Array(a.length);
  for (let i = 0; i < a.length; i++) {
    c[i] = a[i] + b[i];
  }
  return c;
}

function maxSoft(a: number[]): number[] {
  const n = [...a];
  let s = 0;
  n.forEach((f) => {
    s += Math.exp(f);
  });
  for (let i = 0; i < a.length; i++) {
    n[i] = Math.exp(a[i]) / s;
  }
  return n;
}

/**
 * Solve a CAPTCHA image using the saturation-based neural network method
 * @param imgDataUri - Base64 data URI of the captcha image
 * @returns Solved captcha string (6 characters)
 */
export async function solve(imgDataUri: string): Promise<string> {
  const weights = bitmaps.weights;
  const biases = bitmaps.biases;

  if (!weights?.length || !biases?.length) {
    console.warn(
      "⚠️ Neural network weights/biases not loaded, falling back to bitmap method",
    );
    return solveBitmap(imgDataUri);
  }

  const labelTxt = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const canvas = createCanvas(200, 40);
  const ctx = canvas.getContext("2d");

  const image = await loadImage(imgDataUri);
  ctx.drawImage(image, 0, 0, 200, 40);

  const pd = ctx.getImageData(0, 0, 200, 40);
  let bls = saturation(pd.data);

  let out = "";
  for (let i = 0; i < 6; i++) {
    let block: number[][] | number[] = preImg(bls[i]);
    const flatBlock = [flatten(block as number[][])];
    const mulResult = matMul(flatBlock, weights);
    const addResult = matAdd(mulResult[0], biases);
    const softResult = maxSoft(addResult);
    const maxIdx = softResult.indexOf(Math.max(...softResult));
    out += labelTxt[maxIdx];
  }

  return out;
}

/**
 * Solve a CAPTCHA using bitmap matching (fallback method)
 * @param imgDataUri - Base64 data URI of the captcha image
 * @returns Solved captcha string
 */
export async function solveBitmap(imgDataUri: string): Promise<string> {
  const canvas = createCanvas(180, 45);
  const ctx = canvas.getContext("2d");

  const image = await loadImage(imgDataUri);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to grayscale 2D array
  const arr: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const gval = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    arr.push(Math.round(gval));
  }

  const newArr: number[][] = [];
  const width = 180;
  while (arr.length) {
    newArr.push(arr.splice(0, width));
  }

  return captchaParse(newArr);
}

/**
 * Extract base64 data from a data URI
 * @param dataUri - Full data URI string
 * @returns Object with mimeType and base64 data, or null if invalid
 */
export function extractDataUriParts(
  dataUri: string,
): { mimeType: string; base64: string } | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

/**
 * Save captcha image to a file (for debugging)
 * @param base64 - Base64 encoded image data
 * @param filePath - Output file path
 */
export async function saveCaptchaImage(
  base64: string,
  filePath: string,
): Promise<void> {
  const fs = await import("fs/promises");
  const buffer = Buffer.from(base64, "base64");
  await fs.writeFile(filePath, buffer);
}
