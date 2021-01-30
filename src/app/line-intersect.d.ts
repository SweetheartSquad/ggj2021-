declare module 'line-intersect' {
	export function checkIntersection(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		x3: number,
		y3: number,
		x4: number,
		y4: number
	):
		| {
				type: 'none' | 'parallel' | 'colinear' | 'intersecting';
				point: undefined;
		  }
		| {
				type: 'intersecting';
				point: { x: number; y: number };
		  };
}
