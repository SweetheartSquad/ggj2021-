import { ComponentProps } from 'preact';
import { Border } from './Border';
import { Text } from './Text';
import { useGridPosStyle, useGridStyle, useTextDimensions } from './utils';

export function BorderedText({
	x,
	y,
	htmlFor,
	align = 'left',
	minW,
	minH,
	fill,
	children,
	...props
}: Omit<ComponentProps<typeof Border>, 'w' | 'h'> &
	Pick<ComponentProps<typeof Text>, 'children' | 'htmlFor'> & {
		minW?: number;
		minH?: number;
		fill?: boolean;
	}) {
	const [tw, th] = useTextDimensions(children);
	const w = Math.max(minW || 0, tw);
	const h = Math.max(minH || 0, th);
	const gridStyle = useGridPosStyle(align === 'left' ? x : x - (w + 2), y, w + 2, h + 2);
	const subgridStyle = useGridStyle(w + 2, h + 2, gridStyle);
	const Tag = htmlFor ? 'label' : 'span';
	return (
		<Tag className={`subgrid${fill ? ' fill' : ''}`} htmlFor={htmlFor} style={subgridStyle}>
			<Border x={0} y={0} w={w + 2} h={h + 2} {...props} />
			<Text x={1} y={1}>
				{children}
			</Text>
		</Tag>
	);
}
