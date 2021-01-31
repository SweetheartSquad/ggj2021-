import { ComponentProps } from 'preact';
import { Border } from './Border';
import { Text } from './Text';
import { useGridPosStyle, useGridStyle, useTextDimensions } from './utils';

export function BorderedText({ x, y, htmlFor, children, ...props }: Omit<ComponentProps<typeof Border>, 'w' | 'h'> & Pick<ComponentProps<typeof Text>, 'children' | 'htmlFor'>) {
	const [w, h] = useTextDimensions(children);
	const gridStyle = useGridPosStyle(x, y);
	const subgridStyle = useGridStyle(w + 2, h + 2, gridStyle);
	const Tag = htmlFor ? 'label' : 'span';
	return (
		<Tag className="subgrid" htmlFor={htmlFor} style={subgridStyle}>
			<Text x={1} y={1}>
				{children}
			</Text>
			<Border x={0} y={0} w={w + 2} h={h + 2} {...props} />
		</Tag>
	);
}
