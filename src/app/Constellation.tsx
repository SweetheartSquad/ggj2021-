import bresenham from 'bresenham';
import 'canvas-toBlob';
import { nanoid } from 'nanoid';
import 'preact';
import { useMemo } from 'preact/hooks';
import { angleBetween } from './utils';

export function Constellation({ starmap, constellation }: { starmap: [number,number][], constellation: [number, number][] }) {
	const pieces = useMemo(
		() =>
			constellation.reduce((result, edge) => {
				const [start, end] = edge;
				const [sx, sy] = starmap[start];
				const [ex, ey] = starmap[end];
				const angleRaw = angleBetween(sx, sy, ex, ey);
				let a = angleRaw / 360;
				a *= 8;
				a = Math.round(a);
				a /= 8;
				a *= 360;
				let s: string;
				switch (a) {
					case 90:
					case -90:
						s = '|';
						break;
					case 0:
						s = '-';
						break;
					case -45:
						s = '/';
						break;
					case 45:
						s = '\\';
						break;
					default:
						s = '?';
						break;
				}
				let px = 0,
					py = 0;
				bresenham(sx, sy, ex, ey, (x, y) => {
					// prevent patterns like //, ||
					if (py === y && (a === 45 || a === -45 || a === 90 || a === -90)) return;
					if (px === x && (a === 45 || a === -45 || a === 0)) return;
					result.push({ x, y, s, id: nanoid() });
					px = x;
					py = y;
				});
				return result;
			}, [] as { x: number; y: number; s: string; id: string }[]),
		[constellation]
	);
	return <>{pieces.map(i => (
		<span key={i.id} style={{ gridColumn: i.x, gridRow: i.y }}>
			{i.s}
		</span>
	))}</>;
}
