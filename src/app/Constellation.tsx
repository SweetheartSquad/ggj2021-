import bresenham from 'bresenham';
import 'canvas-toBlob';
import { nanoid } from 'nanoid';
import 'preact';
import { useMemo } from 'preact/hooks';
import { angleBetween } from './utils';

export function Constellation({
	starmap,
	constellation,
	constellationIdx,
	getEdgeLabel,
}: {
	starmap: [number, number][];
	constellation: [number, number][];
	constellationIdx: number;
	getEdgeLabel: (constellation: number, edge: number) => string;
}) {
	const pieces = useMemo(
		() =>
			constellation.reduce((result, edge, idx) => {
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
				let px = -1,
					py = -1;
				const line: typeof result = [];
				bresenham(sx, sy, ex, ey, (x, y) => {
					// prevent patterns like //, ||
					if (py === y && (a === 45 || a === -45 || a === 90 || a === -90)) return;
					if (px === x && (a === 45 || a === -45 || a === 0)) return;
					line.push({ x, y, s, id: nanoid(), edge: idx });
					px = x;
					py = y;
				});
				// remove start/end since they overlap stars
				line.pop();
				line.shift();
				return result.concat(line);
			}, [] as { x: number; y: number; s: string; id: string; edge: number }[]),
		[constellation]
	);
	return (
		<>
			{pieces.map(i => (
				<label data-constellation={constellationIdx} key={i.id} htmlFor={getEdgeLabel(constellationIdx, i.edge)} style={{ gridColumn: i.x, gridRow: i.y }}>
					{i.s}
				</label>
			))}
		</>
	);
}
