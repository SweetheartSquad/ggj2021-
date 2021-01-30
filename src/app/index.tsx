import 'canvas-toBlob';
import produce, { Draft } from 'immer';
import { nanoid } from 'nanoid';
import 'preact';
import { render } from 'preact';
import { useMemo, useReducer } from 'preact/hooks';
import seedrandom from 'seedrandom';
import tracery from 'tracery-grammar';
import { numConstellations, traceryConstellations } from './config';
import { generateOutput, parseInput } from './utils';

type Reducer<S = any, A = any> = (draftState: Draft<S>, action: A) => void | S;
export function useImmerReducer<S, A>(reducer: Reducer<S, A>, initialState: S, initialAction?: (initial: any) => S): [S, (action: A) => void] {
	const cachedReducer = useMemo(() => produce(reducer), [reducer]);
	return useReducer(cachedReducer, initialState, initialAction);
}

const grammar = tracery.createGrammar(traceryConstellations);
grammar.addModifiers(tracery.baseEngModifiers);

interface State {
	mode: 'creating' | 'guessing';
	seed: string;
	constellations: {
		edges: [[number, number], [number, number]][];
	}[];
	guesses: number[];
	currentConstellation: number;
}
type TransferredState = Pick<State, 'constellations' | 'seed'>;
type A<Type extends string, Payload> = { type: Type; payload: Payload };
type Action = A<'add-edge', [[number, number], [number, number]]> | A<'guess', number> | A<'set-current', number> | A<'set-seed', string>;

const reducer: Reducer<State, Action> = (state, action) => {
	switch (action.type) {
		case 'add-edge':
			state.constellations[state.currentConstellation].edges.push(action.payload);
			break;
		case 'guess':
			state.guesses[state.currentConstellation] = action.payload;
			break;
		case 'set-current':
			state.currentConstellation = action.payload;
			break;
		case 'set-seed':
			state.seed = action.payload;
			break;
	}
};

function App() {
	const initialState = useMemo<State>(() => {
		const input = window.location.search.replace('?', '');
		const inputObj: TransferredState = parseInput(input);
		if (!inputObj) {
			return {
				mode: 'creating',
				seed: nanoid(),
				constellations: new Array(numConstellations),
				guesses: [],
				currentConstellation: 0,
			};
		}
		return {
			mode: 'guessing',
			seed: inputObj.seed,
			constellations: inputObj.constellations,
			guesses: new Array(inputObj.constellations),
			currentConstellation: 0,
		};
	}, []);
	const [state, dispatch] = useImmerReducer(reducer, initialState);
	const { starmap, names } = useMemo(() => {
		4;
		seedrandom(state.seed, { global: true });
		const names = new Set<string>();
		while(names.size < numConstellations) {
			names.add(grammar.flatten('#constellation#'));
		}
		return {
			starmap: undefined,
			names: [...names],
		};
	}, [state.seed]);
	const output = useMemo(() => {
		const toTransfer:TransferredState = {
			seed: state.seed,
			constellations: state.constellations,
		}
		return generateOutput(toTransfer);
	}, [state]);
	return (
		<main>
			<h1>TODO: title</h1>
			<section>
				TODO: the whole game
				<br />
				names:
				<ul>
					{names.map((i, idx) => (
						<li key={i}>
							<button onClick={() => dispatch({ type: 'set-current', payload: idx })}>{i}</button>
						</li>
					))}
				</ul>
				<button onClick={() => dispatch({ type: 'set-seed', payload: nanoid() })}>re-roll</button>
				<br />
				state:
				<pre>{JSON.stringify(state, undefined, '\t')}</pre>
				<br />
				output:
				<pre>
					<a href={`${window.origin}?${output}`}>{output}</a>
				</pre>
			</section>
		</main>
	);
}

render(<App />, document.body);
