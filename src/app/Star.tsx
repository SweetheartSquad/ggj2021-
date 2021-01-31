import 'canvas-toBlob';
import 'preact';
import { useMemo } from 'preact/hooks';
import { mapStars } from './config';
import { rndItm, useGridPosStyle } from './utils';

export function Star({
	star: [x, y],
	starIdx,
	constellationIdx,
	getStarLabel,
}: {
	star: [number, number];
	starIdx: number;
	constellationIdx: number;
	getStarLabel: (constellationIdx: number, starIdx: number) => string;
}) {
	const s = useMemo(() => rndItm(mapStars), []);
	return (
		<label data-star={starIdx} data-constellation={constellationIdx} htmlFor={getStarLabel(constellationIdx, starIdx)} style={useGridPosStyle(x, y)}>
			{s}
		</label>
	);
}
