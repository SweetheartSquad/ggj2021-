import 'preact';
import { JSXInternal } from 'preact/src/jsx';
import { useGridPosStyle } from './utils';

export function TextPiece({
	x,
	y,
	...props
}: JSXInternal.HTMLAttributes<HTMLSpanElement> & {
	x: number;
	y: number;
}) {
	return (<span {...props} style={useGridPosStyle(x, y)} />);
}
