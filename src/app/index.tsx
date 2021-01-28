import 'canvas-toBlob';
import 'preact';
import { render } from 'preact';
import { generateOutput, parseInput } from './utils';

function App() {
	const input = window.location.search.replace('?', '');
	const inputObj = parseInput(input) || { test: { foo: 'bar' } };
	return (
		<main>
			<h1>TODO: title</h1>
			<section>
				TODO: the whole game
				<br />
				input:
				<pre style={{ textAlign: 'initial' }}>{JSON.stringify(inputObj, undefined, '\t')}</pre>
				output:
				<pre>{generateOutput(inputObj)}</pre>
			</section>
		</main>
	);
}

render(<App />, document.body);
