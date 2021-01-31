import bresenham from 'bresenham';
import { nanoid } from 'nanoid';
import { ComponentProps } from 'preact';
import { useMemo } from 'preact/hooks';
import { ConstellationEdgePiece } from './ConstellationEdgePiece';
import { angleBetween } from './utils';

export function Constellation({
	starmap,
	constellation,
	constellationIdx,
	getEdgeLabel,
	...props
}: Omit<ComponentProps<typeof ConstellationEdgePiece>, 'htmlFor' | 'x' | 'y'> & {
	starmap: [number, number][];
	constellation: [number, number][];
	constellationIdx: number;
	getEdgeLabel: (constellation: number, edge: number) => string;
}) {
	const pieces = useMemo(
		() => constellation.reduce((result, edge, idx) => {
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
			let px = -1;
			let py = -1;
			const line: typeof result = [];
			bresenham(sx, sy, ex, ey, (x, y) => {
				// remove start/end since they overlap stars
				if ((x === sx && y === sy) || (x === ex && y === ey)) return;
				// prevent patterns like //, ||
				if (py === y && (a === 45 || a === -45 || a === 90 || a === -90)) return;
				if (px === x && (a === 45 || a === -45 || a === 0)) return;
				line.push({
					x, y, s, id: nanoid(), edge: idx,
				});
				px = x;
				py = y;
			});
			return result.concat(line);
		}, [] as { x: number; y: number; s: string; id: string; edge: number }[]),
		[constellation, starmap],
	);
	return (
		<>
			{pieces.map((i) => (
				<ConstellationEdgePiece key={i.id} {...props} htmlFor={getEdgeLabel(constellationIdx, i.edge)} x={i.x} y={i.y}>
					{i.s}
				</ConstellationEdgePiece>
			))}
		</>
	);
}
