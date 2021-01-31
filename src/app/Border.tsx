import { Text } from './Text';

export function Border({
	x,
	y,
	w,
	h,
	sideL = '|',
	sideR = '|',
	sideT = '-',
	sideB = '-',
	cornerTL = '/',
	cornerTR = '\\',
	cornerBL = '\\',
	cornerBR = '/',
}: {
	x: number;
	y: number;
	w: number;
	h: number;
	sideL?: string;
	sideR?: string;
	sideT?: string;
	sideB?: string;
	cornerTL?: string;
	cornerTR?: string;
	cornerBL?: string;
	cornerBR?: string;
}) {
	return (
		<>
			<Text x={x} y={y}>
				{`${cornerTL}${sideT.repeat(w - 2)}${cornerTR}`}
			</Text>
			<Text x={x} y={y + h - 1}>
				{`${cornerBL}${sideB.repeat(w - 2)}${cornerBR}`}
			</Text>
			<Text x={x} y={y + 1}>
				{`${sideL}\n`.repeat(h - 2)}
			</Text>
			<Text x={x + w - 1} y={y + 1}>
				{`${sideR}\n`.repeat(h - 2)}
			</Text>
		</>
	);
}
