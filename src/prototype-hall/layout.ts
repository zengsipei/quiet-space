export type Span = readonly [number, number];
export type Point = { x: number; z: number };

export const ARC_CX = 76;
export const ARC_CZ = 0;
export const SPREAD = 0.43;
export const GLASS_R = 70;
export const FIRST_R = 76;
export const TREAD = 5;
export const RISE = 1.8;
export const TIER_COUNT = 5;
export const LAST_R = FIRST_R + TREAD * TIER_COUNT;
export const CEIL_GLASS = 10;
export const CEIL_BACK = 16;
export const ROW_HEIGHT = 0.35;

export type Tier = { index: number; y: number; baseY: number; rFront: number; rBack: number };
export const TIERS: Tier[] = Array.from({ length: TIER_COUNT }, (_, index) => ({
  index,
  y: index * RISE + 0.025,
  baseY: Math.max(0, index - 1) * RISE + 0.025,
  rFront: FIRST_R + index * TREAD,
  rBack: FIRST_R + (index + 1) * TREAD,
}));

export const STAIR_SPANS: readonly Span[] = [[-0.19, -0.155], [0.17, 0.205]];
export const WALL_SPANS: readonly Span[] = [[-SPREAD, -0.19], [-0.155, 0.17], [0.205, SPREAD]];
export const FULL_SPAN: Span = [-SPREAD, SPREAD];
export const radiusAt = (radius: number, angle: number): number =>
  radius + 1.3 * Math.sin(angle * 11 + 0.2) + 0.55 * Math.sin(angle * 23 - 0.35);
export const polar = (radius: number, angle: number): Point => ({
  x: ARC_CX - radius * Math.cos(angle), z: ARC_CZ + radius * Math.sin(angle),
});
export const terrainPoint = (radius: number, angle: number): Point => polar(radiusAt(radius, angle), angle);
export const tangentRotation = (radius: number, angle: number): number => {
  const before = terrainPoint(radius, angle - 0.001);
  const after = terrainPoint(radius, angle + 0.001);
  return Math.atan2(after.x - before.x, after.z - before.z);
};
export const ceilingY = (radius: number, angle = 0): number => {
  const t = Math.max(0, Math.min(1, (radius - GLASS_R) / (LAST_R - GLASS_R)));
  return CEIL_GLASS + (CEIL_BACK - CEIL_GLASS) * t * t * (3 - 2 * t)
    - 0.6 * Math.cos(angle * 5) + 0.25 * Math.sin(angle * 4);
};

export type BookWall = { radius: number; baseY: number; rows: number; capY: number; phase: number; spans: readonly Span[] };
export const BOOK_WALLS: BookWall[] = [
  ...TIERS.slice(1).map((tier) => ({
    radius: tier.rFront, baseY: tier.baseY, rows: 6, capY: tier.y + 1.05, phase: tier.index * 1.1, spans: WALL_SPANS,
  })),
  { radius: LAST_R - 0.3, baseY: (TIER_COUNT - 1) * RISE + 0.025, rows: 18, capY: 14.3, phase: 1.4, spans: [FULL_SPAN] },
];
export const crestY = (wall: BookWall, angle: number): number => Math.max(
  wall.baseY + wall.rows * ROW_HEIGHT + 0.18,
  wall.capY + 0.5 * Math.sin(angle * 15 + wall.phase) + 0.16 * Math.cos(angle * 28 - wall.phase),
);
export const COLUMNS = [78.5, 87.5, 98.4].flatMap((radius) =>
  [-0.3, -0.03, 0.28].map((angle) => ({ radius, angle, ...terrainPoint(radius, angle) })),
);
export const VIEWS = [
  { key: "1", label: "全景", pos: [-14, 8.5, 26], target: [-5, 4.7, -10] },
  { key: "2", label: "阶地", pos: [4.5, 2, 10], target: [-16, 4.8, -16] },
  { key: "3", label: "书山", pos: [3.6, 1.8, -14], target: [-18, 5.7, 5] },
  { key: "4", label: "书墙", pos: [-9, 5.6, 14], target: [-24, 9.4, 3] },
  { key: "5", label: "湖窗", pos: [-8, 5.4, 4], target: [30, 2.8, 8] },
] as const;
export type View = typeof VIEWS[number];
export const PALETTE = {
  plaster: 0xf0eee7, bookBack: 0x796144, trunk: 0x89765a,
  lampGlow: 0xfff2dc, daylight: 0xdde8ed, glass: 0xe6f0f4,
} as const;
