import 'canvas-toBlob';
import 'preact';
import { JSXInternal } from 'preact/src/jsx';
import { useGridStyle } from './utils';

export function ConstellationEdgePiece({
	x,
	y,
	...props
}: JSXInternal.HTMLAttributes<HTMLLabelElement> & {
	x: number;
	y: number;
}) {
	return (<label {...props} style={useGridStyle(x, y)} />);
}
