import 'canvas-toBlob';
import 'preact';
import { useMemo } from 'preact/hooks';
import { mapStars } from './config';
import { rndItm, useGridStyle } from './utils';

export function Star({ star: [x, y], starIdx, constellationIdx }: { star: [number, number]; starIdx: number; constellationIdx: number; }) {
	const s = useMemo(() => rndItm(mapStars), []);
	return (
		<label data-star={starIdx} data-constellation={constellationIdx} htmlFor={`select-star-${starIdx}`} style={useGridStyle(x,y)}>
			{s}
		</label>
	);
}
