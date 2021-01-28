import 'canvas-toBlob';
import 'preact';
import { render } from 'preact';

function parseInput(input: string) {
	try {
		return JSON.parse(atob(input));
	} catch {
		return undefined;
	}
}
function generateOutput(output: unknown) {
	return btoa(JSON.stringify(output));
}

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
