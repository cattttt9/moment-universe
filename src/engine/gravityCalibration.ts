import type { GravityBodyState, UniverseParameters } from '../types/universe';

const BODY_IDS: GravityBodyState['id'][] = ['memory', 'moment', 'future'];
const BODY_ANGLES = [-Math.PI * (5 / 6), -Math.PI / 6, Math.PI / 2];
const MIN_PARAMETER_RADIUS = 1.25;
const MAX_PARAMETER_RADIUS = 4.1;

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.max(minimum, Math.min(maximum, value));
}

function distance(first: GravityBodyState, second: GravityBodyState) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function createGravityBodies(parameters: UniverseParameters): GravityBodyState[] {
  const values = [parameters.energy, parameters.order, parameters.fluctuation];
  return BODY_IDS.map((id, index) => {
    const radius =
      MIN_PARAMETER_RADIUS +
      (clamp(values[index] ?? 50) / 100) * (MAX_PARAMETER_RADIUS - MIN_PARAMETER_RADIUS);
    const angle = BODY_ANGLES[index]!;
    return {
      id,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      velocity: 0,
    };
  });
}

export function getGravityScore(bodies: GravityBodyState[]) {
  if (bodies.length !== 3) return 0;
  const sides = [
    distance(bodies[0]!, bodies[1]!),
    distance(bodies[1]!, bodies[2]!),
    distance(bodies[2]!, bodies[0]!),
  ];
  const average = sides.reduce((sum, side) => sum + side, 0) / sides.length;
  const variance = sides.reduce((sum, side) => sum + Math.pow(side - average, 2), 0) / sides.length;
  const area =
    Math.abs(
      bodies[0]!.x * (bodies[1]!.y - bodies[2]!.y) +
        bodies[1]!.x * (bodies[2]!.y - bodies[0]!.y) +
        bodies[2]!.x * (bodies[0]!.y - bodies[1]!.y),
    ) / 2;
  const separation = clamp(1 - Math.abs(average - 3.5) / 2.9, 0, 1);
  const balance = clamp(1 - Math.sqrt(variance) / Math.max(average, 0.001), 0, 1);
  const shape = clamp(area / 5.4, 0, 1);
  return Math.round((separation * 0.36 + balance * 0.34 + shape * 0.3) * 100);
}

export function bodiesToParameters(bodies: GravityBodyState[]): UniverseParameters {
  if (bodies.length !== 3) return { energy: 50, order: 50, fluctuation: 50 };
  const valueFromRadius = (body: GravityBodyState) =>
    Math.round(
      clamp(
        ((Math.hypot(body.x, body.y) - MIN_PARAMETER_RADIUS) /
          (MAX_PARAMETER_RADIUS - MIN_PARAMETER_RADIUS)) *
          100,
      ),
    );
  return {
    energy: valueFromRadius(bodies[0]!),
    order: valueFromRadius(bodies[1]!),
    fluctuation: valueFromRadius(bodies[2]!),
  };
}

export function isGravityStable(bodies: GravityBodyState[]) {
  return getGravityScore(bodies) >= 72;
}
