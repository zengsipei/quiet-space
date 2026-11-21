export type Rng = () => number;

export const seedRng = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
};

export const span = (rng: Rng, min: number, max: number): number => min + rng() * (max - min);
