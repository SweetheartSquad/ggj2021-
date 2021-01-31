import 'canvas-toBlob';
import produce, { Draft } from 'immer';
import { checkIntersection } from 'line-intersect';
import { nanoid } from 'nanoid';
import 'preact';
import { render } from 'preact';
import { useCallback, useMemo, useReducer } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import seedrandom from 'seedrandom';
import tracery from 'tracery-grammar';
import { mapHeight, mapMaxStars, mapMinStars, mapWidth, numConstellations, traceryConstellations } from './config';
import { Constellation } from './Constellation';
import { Star } from './Star';
import { generateOutput, parseInput, rndInt } from './utils';

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
	constellations: [number, number][][];
	guesses: number[];
	currentConstellation?: number;
	currentStar?: number;
}
type TransferredState = Pick<State, 'constellations' | 'seed'>;
type A<Type extends string, Payload> = { type: Type; payload: Payload };
type Action =
	| A<'add-edge', [number, number]>
	| A<'remove-edge', { constellation: number; edge: number }>
	| A<'guess', number>
	| A<'set-current-constellation', number>
	| A<'set-current-star', number | undefined>
	| A<'set-seed', string>;

function getLabel(action: 'remove-edge' | 'select-constellation' | 'select-star', constellation: number, edgeOrStar: number) {
	switch (action) {
		case 'remove-edge':
			return `${action}-${constellation}-${edgeOrStar}`;
		case 'select-constellation':
			return `${action}-${constellation}`;
		case 'select-star':
			return `${action}-${edgeOrStar}`;
	}
}

const reducer: Reducer<State, Action> = (state, action) => {
	switch (action.type) {
		case 'add-edge':
			if (!state.currentConstellation) return;
			state.constellations[state.currentConstellation].push(action.payload);
			break;
		case 'remove-edge':
			state.currentConstellation = action.payload.constellation;
			state.currentStar = undefined;
			state.constellations[action.payload.constellation].splice(action.payload.edge, 1);
			break;
		case 'guess':
			if (!state.currentConstellation) return;
			state.guesses[state.currentConstellation] = action.payload;
			break;
		case 'set-current-constellation':
			state.currentConstellation = action.payload;
			state.currentStar = undefined;
			break;
		case 'set-current-star':
			state.currentStar = action.payload;
			break;
		case 'set-seed':
			state.mode = 'creating';
			state.seed = action.payload;
			state.constellations = new Array(numConstellations).fill(0).map(() => []);
			state.guesses = [];
			state.currentConstellation = undefined;
			state.currentStar = undefined;
			break;
	}
};

function App() {
	const initialState = useMemo(() => {
		const input = window.location.search.replace('?', '');
		const inputObj: TransferredState = parseInput(input);
		if (!inputObj) {
			return {
				mode: 'creating',
				seed: nanoid(),
				constellations: new Array(numConstellations).fill(0).map(() => []),
				guesses: [],
				currentConstellation: undefined,
				currentStar: undefined,
			} as State;
		}
		return {
			mode: 'guessing',
			seed: inputObj.seed,
			constellations: inputObj.constellations,
			guesses: new Array(inputObj.constellations.length),
			currentConstellation: undefined,
			currentStar: undefined,
		} as State;
	}, []);
	const [state, dispatch] = useImmerReducer(reducer, initialState);
	const { starmap, names } = useMemo(() => {
		4;
		seedrandom(state.seed, { global: true });
		const names = new Set<string>();
		while (names.size < numConstellations) {
			names.add(grammar.flatten('#constellation#'));
		}
		return {
			starmap: new Array(rndInt(mapMinStars, mapMaxStars)).fill(0).map(() => [rndInt(0, mapWidth), rndInt(0, mapHeight)]) as [number, number][],
			names: [...names],
		};
	}, [state.seed]);
	const starToConstellation = useMemo(() => starmap.map((_, idx) => state.constellations.findIndex(constellation => constellation.some(edge => edge.includes(idx)))), [starmap, state.constellations]);
	const output = useMemo(() => {
		const toTransfer: TransferredState = {
			seed: state.seed,
			constellations: state.constellations,
		};
		return generateOutput(toTransfer);
	}, [state]);

	const removeEdge = useCallback((constellation: number, edge: number) => dispatch({ type: 'remove-edge', payload: { constellation, edge } }), []);
	const selectConstellation = useCallback(
		(event: JSXInternal.TargetedMouseEvent<HTMLButtonElement>) => dispatch({ type: 'set-current-constellation', payload: parseInt(event.currentTarget.value, 10) }),
		[]
	);
	const selectStar = useCallback(
		(event: JSXInternal.TargetedMouseEvent<HTMLButtonElement>) => {
			if (!state.currentConstellation) return;
			const currentStar = state.currentStar;
			const star = parseInt(event.currentTarget.value, 10);
			// select start point
			if (currentStar === undefined) {
				dispatch({ type: 'set-current-star', payload: star });
				return;
			}
			// deselect start point
			if (currentStar === star) {
				dispatch({ type: 'set-current-star', payload: undefined });
				return;
			}
			const otherConstellations = state.constellations.filter((_, idx) => idx !== state.currentConstellation);
			// ignore end point part of another constellation
			if (otherConstellations.some(constellation => constellation.some(i => i.includes(star)))) {
				return;
			}
			// ignore end point resulting in edge intersecting another constellation's edge
			if (
				otherConstellations.some(constellation =>
					constellation.some(([start, end]) => checkIntersection(...([start, end, currentStar, star].flatMap(i => starmap[i]) as Parameters<typeof checkIntersection>)).type === 'intersecting')
				)
			) {
				return;
			}
			// avoid duplicate edge, and instead select new start point
			if (state.constellations[state.currentConstellation].some(i => i.join(',') === [currentStar, star].sort().join(','))) {
				dispatch({ type: 'set-current-star', payload: star });
				return;
			}
			// select end point
			dispatch({ type: 'add-edge', payload: [currentStar, star].sort() as [number, number] });
			dispatch({ type: 'set-current-star', payload: star });
		},
		[state.currentStar, state.constellations, state.currentConstellation]
	);
	const getEdgeLabel = useMemo(() => (constellation: number, edge: number) => getLabel(state.mode === 'creating' ? 'remove-edge' : 'select-constellation', constellation, edge), [state.mode]);
	const getStarLabel = useMemo(() => (constellation: number, star: number) => getLabel(state.mode === 'creating' ? 'select-star' : 'select-constellation', constellation, star), [state.mode]);
	return (
		<>
			<style>
				{`[data-constellation="${state.currentConstellation}"] {
					color: red;
				}
				[data-star="${state.currentStar}"] {
					color: green;
				}`}
			</style>
			<main>
				<h1>TODO: title</h1>
				<section>
					TODO: the whole game
					<br />
					names:
					<ul>
						{names.map((i, idx) => (
							<li key={i}>
								<label data-constellation={idx} htmlFor={getLabel('select-constellation', idx, 0)}>
									{i}
								</label>
							</li>
						))}
					</ul>
					<button onClick={() => dispatch({ type: 'add-edge', payload: [rndInt(0, starmap.length), rndInt(0, starmap.length)] })}>add edge</button>
					<section className="map" style={{ gridTemplateColumns: `repeat(${mapWidth}, 1rem)`, gridTemplateRows: `repeat(${mapHeight}, 1rem)` }}>
						{state.constellations.map((i, idx) => (
							<Constellation key={idx} starmap={starmap} constellation={i} constellationIdx={idx} getEdgeLabel={getEdgeLabel} />
						))}
						{starmap.map((i, idx) => (
							<Star key={idx} star={i} starIdx={idx} constellationIdx={starToConstellation[idx]} getStarLabel={getStarLabel} />
						))}
					</section>
					<button onClick={() => dispatch({ type: 'set-seed', payload: nanoid() })}>re-roll</button>
					<br />
					state:
					<pre>{JSON.stringify(state, undefined, '\t')}</pre>
					<br />
					output:
					<pre
						style={{
							wordBreak: 'break-all',
						}}
					>
						<a href={`${window.origin}?${output}`}>{output}</a>
					</pre>
				</section>
			</main>
			<nav>
				<ol>
					{state.constellations.map((edges, constellationIdx) =>
						edges.map((_, edgeIdx) => (
							<li key={`${constellationIdx}-${edgeIdx}`}>
								<button id={`remove-edge-${constellationIdx}-${edgeIdx}`} onClick={() => removeEdge(constellationIdx, edgeIdx)}>
									remove {names[constellationIdx]} edge {edgeIdx}
								</button>
							</li>
						))
					)}
				</ol>
				<ol>
					{state.constellations.map((_, constellationIdx) => (
						<li key={constellationIdx}>
							<button id={`select-constellation-${constellationIdx}`} value={constellationIdx} onClick={selectConstellation}>
								select {names[constellationIdx]}
							</button>
						</li>
					))}
				</ol>
				<ol>
					{starmap.map((_, starIdx) => (
						<li key={starIdx}>
							<button id={`select-star-${starIdx}`} value={starIdx} onClick={selectStar}>
								select star {starIdx}
							</button>
						</li>
					))}
				</ol>
			</nav>
		</>
	);
}

render(<App />, document.body);
