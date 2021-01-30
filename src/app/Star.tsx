import 'canvas-toBlob';
import 'preact';
import { useMemo } from 'preact/hooks';
import { mapStars } from './config';
import { rndItm } from './utils';

export function Star({ star: [x, y] }: { star: [number, number] }) {
	const s = useMemo(() => rndItm(mapStars), []);
	return <span style={{ gridColumn: x, gridRow: y }}>{s}</span>;
}
