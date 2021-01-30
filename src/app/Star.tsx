import 'canvas-toBlob';
import 'preact';
import { useMemo } from 'preact/hooks';
import { mapStars } from './config';
import { rndItm } from './utils';

export function Star({ star: [x, y], starIdx }: { star: [number, number]; starIdx: number }) {
	const s = useMemo(() => rndItm(mapStars), []);
	return (
		<label data-star={starIdx} htmlFor={`select-star-${starIdx}`} style={{ gridColumn: x, gridRow: y }}>
			{s}
		</label>
	);
}
