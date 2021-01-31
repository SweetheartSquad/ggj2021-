import 'preact';
import { useMemo } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { mapStars } from './config';
import { rndItm, useGridPosStyle } from './utils';

export function Star({
	star: [x, y],
	starIdx,
	constellationIdx,
	getStarLabel,
	...props
}: JSXInternal.HTMLAttributes<HTMLLabelElement> & {
	star: [number, number];
	starIdx: number;
	constellationIdx: number;
	getStarLabel: (constellationIdx: number, starIdx: number) => string;
}) {
	const s = useMemo(() => rndItm(mapStars), []);
	return (
		<label {...props} data-star={starIdx} htmlFor={getStarLabel(constellationIdx, starIdx)} style={useGridPosStyle(x, y)}>
			{s}
		</label>
	);
}
