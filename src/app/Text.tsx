import { useMemo } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { mapSpacing } from './config';
import { TextPiece } from './TextPiece';
import { useGridStyle } from './utils';

export function Text({ x, y, children, ...props }: JSXInternal.HTMLAttributes<HTMLLabelElement> & { x: number; y: number; children: string }) {
	const gridStyle = useGridStyle(x, y);
	const w = useMemo(() => children.split('\n').reduce((max, i) => Math.max(max, i.length), 0), [children]);
	const h = useMemo(() => children.split('\n').length, [children]);
	const Tag = props.htmlFor ? 'label' : 'span';
	const subgridStyle = useMemo(() => ({ ...gridStyle, gridTemplateColumns: `repeat(${w}, ${mapSpacing}rem)`, gridTemplateRows: `repeat(${h}, ${mapSpacing}rem)` }), [gridStyle]);
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
