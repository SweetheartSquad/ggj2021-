import { useMemo } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { mapHeight, mapSpacing, mapWidth } from './config';
import { TextPiece } from './TextPiece';
import { useGridStyle } from './utils';

export function Text({ x, y, children, ...props }: JSXInternal.HTMLAttributes<HTMLSpanElement> & { x: number; y: number; children: string }) {
	const gridStyle = useGridStyle(x, y);
	const subgridStyle = useMemo(() => ({ ...gridStyle, gridTemplateColumns: `repeat(${mapWidth}, ${mapSpacing}rem)`, gridTemplateRows: `repeat(${mapHeight}, ${mapSpacing}rem)` }), [gridStyle]);
	return (
		<span className="subgrid" style={subgridStyle} {...props}>
			{children.split('\n').map((row, y) =>
				row.split('').map((character, x) => (
					<TextPiece key={`${y}-${x}`} x={x} y={y}>
						{character}
					</TextPiece>
				))
			)}
		</span>
	);
}
