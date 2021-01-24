import { Rect, Point } from '../types';

export const CSS_UNITS = 96.0 / 72.0;
export const INITIAL_RENDER_WIDTH = 1300;
export const INITIAL_PAGE_SCALE = 1;
export const DEFAULT_HEIGHT = 1400;
export const DEFAULT_WIDTH = 800;
export const MAX_LOADED = 50;
export const PAGE_SPACE = 16;

export function convertRectCoordinates(
  original: Rect,
  sCoords: Point,
  sScale: number
): Rect {
  /** IMPORTANT DEFAULTS **/
  const navYadjust = 59;
  return {
    x: (original.x - sCoords.x) / sScale,
    y: (original.y - sCoords.y - navYadjust) / sScale,
    width: original.width / sScale,
    height: original.height / sScale
  };
}

export function roundToDivide(x: number, div: number) {
  const r = x % div;
  return r === 0 ? x : Math.round(x - r + div);
}

/**
 * Returns scale factor for the canvas. It makes sense for the HiDPI displays.
 * @returns {Object} The object with horizontal (sx) and vertical (sy)
 *                   scales. The scaled property is set to false if scaling is
 *                   not required, true otherwise.
 */
export function getOutputScale(ctx) {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const backingStoreRatio =
    ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.backingStorePixelRatio ||
    1;
  const pixelRatio = devicePixelRatio / backingStoreRatio;
  return {
    sx: pixelRatio,
    sy: pixelRatio,
    scaled: pixelRatio !== 1,
  };
}

/**
 *  Approximates float number as a fraction using Farey sequence (max order
 *  of 8).
 *  @param {number} x - Positive float number.
 *  @returns {Array} Estimated fraction: the first array item is a numerator,
 *                   the second one is a denominator.
 */
export function approximateFraction(x: number): [number, number] {
  // Fast paths for int numbers or their inversions.
  if (Math.floor(x) === x) {
    return [x, 1];
  }
  const xinv = 1 / x;
  const limit = 8;
  if (xinv > limit) {
    return [1, limit];
  } else if (Math.floor(xinv) === xinv) {
    return [1, xinv];
  }

  const x_ = x > 1 ? xinv : x;
  // a/b and c/d are neighbors in Farey sequence.
  let a = 0,
    b = 1,
    c = 1,
    d = 1;
  // Limiting search to order 8.
  for (;;) {
    // Generating next term in sequence (order of q).
    const p = a + c,
      q = b + d;
    if (q > limit) {
      break;
    }
    if (x_ <= p / q) {
      c = p;
      d = q;
    } else {
      a = p;
      b = q;
    }
  }
  let result;
  // Select closest of the neighbors to x.
  if (x_ - a / b < c / d - x_) {
    result = x_ === x ? [a, b] : [b, a];
  } else {
    result = x_ === x ? [c, d] : [d, c];
  }
  return result;
}