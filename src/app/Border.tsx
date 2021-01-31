import { ComponentProps } from 'preact';
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
	...props
}: Omit<ComponentProps<typeof Text>, 'children'> & {
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
			<Text x={x} y={y} {...props}>
				{`${cornerTL}${sideT.repeat(w - 2)}${cornerTR}`}
			</Text>
			<Text x={x} y={y + h - 1} {...props}>
				{`${cornerBL}${sideB.repeat(w - 2)}${cornerBR}`}
			</Text>
			<Text x={x} y={y + 1} {...props}>
				{`${sideL}`.repeat(h - 2).split('').join('\n')}
			</Text>
			<Text x={x + w - 1} y={y + 1} {...props}>
				{`${sideR}`.repeat(h - 2).split('').join('\n')}
			</Text>
		</>
	);
}
