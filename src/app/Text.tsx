import { JSXInternal } from 'preact/src/jsx';
import { TextPiece } from './TextPiece';
import { useGridPosStyle, useGridStyle, useTextDimensions } from './utils';

export function Text({ x, y, align = 'left', children, ...props }: JSXInternal.HTMLAttributes<HTMLLabelElement> & { x: number; y: number; align?: 'left' | 'right'; children: string }) {
	const [w, h] = useTextDimensions(children);
	const gridStyle = useGridPosStyle(align === 'left' ? x : x - w, y);
	const subgridStyle = useGridStyle(w, h, gridStyle);
	const Tag = props.htmlFor ? 'label' : 'span';
	return (
		<Tag className="subgrid" style={subgridStyle} {...props}>
			{children.split('\n').map((row, y) =>
				row.split('').map((character, x) => (
					<TextPiece key={`${y}-${x}`} x={x} y={y}>
						{character}
					</TextPiece>
				))
			)}
		</Tag>
	);
}
