import { Rect, Point } from '../types';

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
