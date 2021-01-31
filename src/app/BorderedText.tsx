import { ComponentProps } from 'preact';
import { useMemo } from 'preact/hooks';
import { Border } from './Border';
import { Text } from './Text';

export function BorderedText({ x, y, htmlFor, children, ...props }: Omit<ComponentProps<typeof Border>, 'w' | 'h'> & Pick<ComponentProps<typeof Text>, 'children' | 'htmlFor'>) {
	const w = useMemo(() => children.split('\n').reduce((max, i) => Math.max(max, i.length), 0), [children]);
	const h = useMemo(() => children.split('\n').length, [children]);
	return (
		<>
			<Text x={x + 1} y={y + 1} htmlFor={htmlFor}>
				{children}
			</Text>
			<Border x={x} y={y} w={w + 2} h={h + 2} htmlFor={htmlFor} {...props} />
		</>
	);
}
