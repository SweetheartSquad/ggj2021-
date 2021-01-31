import 'canvas-toBlob';
import 'preact';
import { JSXInternal } from 'preact/src/jsx';
import { useGridStyle } from './utils';

export function TextPiece({
	x,
	y,
	...props
}: JSXInternal.HTMLAttributes<HTMLSpanElement> & {
	x: number;
	y: number;
}) {
	return (<span {...props} style={useGridStyle(x, y)} />);
}
