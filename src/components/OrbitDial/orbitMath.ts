export const ORBIT_START_ANGLE = -135;
export const ORBIT_SWEEP_ANGLE = 270;

export function clampOrbitValue(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeAngle(angle: number) {
  let normalized = ((angle + 180) % 360 + 360) % 360 - 180;
  if (normalized === -180) normalized = 180;
  return normalized;
}

export function valueToAngle(value: number) {
  return ORBIT_START_ANGLE + (clampOrbitValue(value) / 100) * ORBIT_SWEEP_ANGLE;
}

export function angleToValue(angle: number, previousValue = 50) {
  const normalized = normalizeAngle(angle);
  if (normalized < ORBIT_START_ANGLE || normalized > -ORBIT_START_ANGLE) {
    return clampOrbitValue(previousValue) >= 50 ? 100 : 0;
  }
  return clampOrbitValue(
    ((normalized - ORBIT_START_ANGLE) / ORBIT_SWEEP_ANGLE) * 100,
  );
}

export function pointerAngle(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
) {
  const x = clientX - (rect.left + rect.width / 2);
  const y = clientY - (rect.top + rect.height / 2);
  return normalizeAngle((Math.atan2(y, x) * 180) / Math.PI + 90);
}
