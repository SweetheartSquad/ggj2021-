import copyToClipboard from 'copy-to-clipboard';
import produce, { Draft } from 'immer';
import { checkIntersection } from 'line-intersect';
import { nanoid } from 'nanoid';
import 'preact';
import { useCallback, useMemo, useReducer } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import seedrandom from 'seedrandom';
import tracery from 'tracery-grammar';
import { Border } from './Border';
import { BorderedText } from './BorderedText';
import { mapHeight, mapMaxStars, mapMinStars, mapSpacing, mapWidth, numConstellations, traceryConstellations } from './config';
import { Constellation } from './Constellation';
import { Star } from './Star';
import { Text } from './Text';
import { findIndexOrUndefined, generateOutput, parseInput, rndInt, useGridStyle } from './utils';

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
	copied: boolean;
	guessed: boolean;
}
type TransferredState = Pick<State, 'constellations' | 'seed'>;
type A<Type extends string, Payload = undefined> = { type: Type; payload: Payload };
type Action =
	| A<'add-edge', [number, number]>
	| A<'remove-edge', { constellation: number; edge: number }>
	| A<'guess', number>
	| A<'set-current-constellation', number>
	| A<'set-current-star', number | undefined>
	| A<'set-seed', string>
	| A<'set-copied', boolean>
	| A<'submit-guesses'>;

function getLabel(action: 'remove-edge' | 'select-constellation' | 'select-star' | 'guess', constellation: number, edgeOrStar: number) {
	switch (action) {
		case 'remove-edge':
			return `${action}-${constellation}-${edgeOrStar}`;
		case 'select-constellation':
			return `${action}-${constellation}`;
		case 'select-star':
			return `${action}-${edgeOrStar}`;
		case 'guess':
			return `${action}-${constellation}`;
	}
}

const reducer: Reducer<State, Action> = (state, action) => {
	console.log(action);
	switch (action.type) {
		case 'add-edge':
			if (state.currentConstellation === undefined) return;
			state.constellations[state.currentConstellation].push(action.payload);
			break;
		case 'remove-edge':
			state.currentConstellation = action.payload.constellation;
			state.currentStar = undefined;
			state.constellations[action.payload.constellation].splice(action.payload.edge, 1);
			break;
		case 'guess':
			if (state.currentConstellation === undefined) return;
			state.guesses = state.guesses.map(i => (i === action.payload ? -1 : i));
			state.guesses[state.currentConstellation] = action.payload;
			break;
		case 'set-current-constellation':
			state.currentConstellation = action.payload;
			state.currentStar = undefined;
			break;
		case 'set-current-star':
			state.currentStar = action.payload;
			break;
		case 'set-copied':
			state.copied = action.payload;
			break;
		case 'set-seed':
			state.mode = 'creating';
			state.seed = action.payload;
			state.constellations = new Array(numConstellations).fill(0).map(() => []);
			state.guesses = [];
			state.currentConstellation = undefined;
			state.currentStar = undefined;
			break;
		case 'submit-guesses':
			state.guessed = true;
			state.currentConstellation = undefined;
			break;
	}
};

export function App() {
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
				copied: false,
				guessed: false,
			} as State;
		}
		return {
			mode: 'guessing',
			seed: inputObj.seed,
			constellations: inputObj.constellations,
			guesses: new Array(inputObj.constellations.length).fill(-1),
			currentConstellation: undefined,
			currentStar: undefined,
			copied: false,
			guessed: false,
		} as State;
	}, []);
	const [state, dispatch] = useImmerReducer(reducer, initialState);
	const { starmap, names, fakeOrder } = useMemo(() => {
		4;
		seedrandom(state.seed, { global: true });
		const names = new Set<string>();
		while (names.size < numConstellations) {
			names.add(grammar.flatten('#constellation#'));
		}
		return {
			starmap: new Array(rndInt(mapMinStars, mapMaxStars)).fill(0).map(() => [rndInt(1, mapWidth - 1), rndInt(3 + numConstellations, mapHeight - 1)]) as [number, number][],
			names: [...names],
			fakeOrder: new Array(names.size)
				.fill(0)
				.map((_, idx) => idx)
				.sort(() => Math.random() - 0.5)
				.map((i, idx) => ({ fake: i, original: idx }))
				.sort(({ fake: a }, { fake: b }) => a - b),
		};
	}, [state.seed]);
	const starToConstellation = useMemo(() => starmap.map((_, idx) => findIndexOrUndefined(state.constellations, constellation => constellation.some(edge => edge.includes(idx)))), [
		starmap,
		state.constellations,
	]);
	const output = useMemo(() => {
		if (state.mode !== 'creating') return;
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
			if (state.currentConstellation === undefined) return;
			const currentStar = state.currentStar;
			const star = parseInt(event.currentTarget.value, 10);
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
			// select start point
			if (currentStar === undefined) {
				dispatch({ type: 'set-current-star', payload: star });
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
	const reroll = useCallback(() => dispatch({ type: 'set-seed', payload: nanoid() }), []);
	const copy = useCallback(() => {
		copyToClipboard(`${window.location.href}?${output}`);
		dispatch({ type: 'set-copied', payload: true });
		setTimeout(() => {
			dispatch({ type: 'set-copied', payload: false });
		}, 500);
	}, [output, dispatch]);
	const guess = useCallback((event: JSXInternal.TargetedMouseEvent<HTMLButtonElement>) => dispatch({ type: 'guess', payload: parseInt(event.currentTarget.value, 10) }), []);
	const submitGuesses = useCallback(() => dispatch({ type: 'submit-guesses', payload: undefined }), [dispatch]);
	const getEdgeLabel = useMemo(() => (constellation: number, edge: number) => (state.guessed ? '' : getLabel(state.mode === 'creating' ? 'remove-edge' : 'guess', constellation, edge)), [
		state.mode,
		state.guessed,
	]);
	const getStarLabel = useMemo(() => (constellation: number, star: number) => (state.guessed ? '' : getLabel(state.mode === 'creating' ? 'select-star' : 'guess', constellation, star)), [
		state.mode,
		state.guessed,
	]);
	const isGuessCorrect = useCallback((guess: number, guessIdx: number) => state.mode === 'guessing' && state.guessed && guess === fakeOrder[guessIdx].fake, [state.mode, state.guessed, fakeOrder]);
	return (
		<>
			<style>
				{`
				body {
					min-width: ${mapWidth * mapSpacing}rem;
				}
				[data-constellation="${state.currentConstellation}"] {
					color: rgba(255,255,255,1.0)
				}
				[data-star="${state.currentStar}"] {
					color: rgba(255,0,0,1.0)
				}`}
			</style>
			<main data-guessed={state.guessed} className="map" style={useGridStyle(mapWidth, mapHeight)}>
				{state.constellations.map((i, idx) => {
					const correct = isGuessCorrect(state.guesses[idx], idx);
					return (
						<Constellation
							key={idx}
							data-correct={state.currentConstellation === idx ? correct.toString() : correct}
							data-constellation={state.mode === 'creating' ? idx : findIndexOrUndefined(state.guesses, i => i === idx)}
							starmap={starmap}
							constellation={i}
							constellationIdx={idx}
							getEdgeLabel={getEdgeLabel}
						/>
					);
				})}
				{starmap.map((i, idx) => {
					const constellationIdx = starToConstellation[idx];
					const correct = constellationIdx !== undefined && isGuessCorrect(state.guesses[constellationIdx], constellationIdx);
					return (
						<Star
							key={idx}
							data-correct={state.currentConstellation !== undefined && state.currentConstellation === constellationIdx ? correct.toString() : correct}
							data-constellation={state.mode === 'creating' ? constellationIdx : findIndexOrUndefined(state.guesses, i => i === constellationIdx)}
							star={i}
							starIdx={idx}
							constellationIdx={constellationIdx || -1}
							getStarLabel={getStarLabel}
						/>
					);
				})}
				{fakeOrder.map(({ fake, original }) => {
					function getCheck() {
						if (state.mode === 'creating') {
							if (state.constellations[original].length > 0) {
								return 'X';
							}
							return ' ';
						}
						if (state.mode === 'guessing' && state.guesses[original] >= 0) {
							if (state.guessed && isGuessCorrect(state.guesses[original], original)) {
								return 'O';
							}
							return 'X';
						}
						return ' ';
					}
					const name = names[original];
					const wrappedName = state.currentConstellation === original ? `[${name}]` : name;
					const checkedName = `[${getCheck()}] ${wrappedName}`;
					return (
						<Text
							data-correct={isGuessCorrect(state.guesses[original], original).toString()}
							data-constellation={original}
							key={names[original]}
							htmlFor={getLabel('select-constellation', original, 0)}
							x={1}
							y={fake + 3}
						>
							{checkedName}
						</Text>
					);
				})}
				<Border x={0} y={0} w={mapWidth} h={mapHeight} />
				{state.mode === 'creating' && (
					<>
						<BorderedText align="right" x={mapWidth} y={mapHeight - 5} htmlFor="copy">
							{state.copied ? 'copied!' : 'copy'}
						</BorderedText>
						<BorderedText align="right" x={mapWidth} y={mapHeight - 3} htmlFor="reroll">
							reroll
						</BorderedText>
					</>
				)}
				{state.mode === 'guessing' && !state.guessed && state.guesses.every(i => i >= 0) && (
					<BorderedText align="right" x={mapWidth} y={mapHeight - 3} htmlFor="submit-guesses">
						submit
					</BorderedText>
				)}
				{state.mode === 'guessing' && state.guessed && (
					<BorderedText align="right" x={mapWidth} y={mapHeight - 3}>
						{`${state.guesses.filter(isGuessCorrect).length}/${numConstellations}`}
					</BorderedText>
				)}
				<BorderedText x={0} y={0}>
					TODO: title
				</BorderedText>
			</main>
			<nav>
				<ol>
					{fakeOrder.map(({ fake, original }) => (
						<li key={original}>
							<button id={`select-constellation-${original}`} value={original} onClick={selectConstellation}>
								select constellation {state.mode === 'creating' ? names[original] : fake}
							</button>
						</li>
					))}
				</ol>
				{state.mode === 'creating' && (
					<>
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
							{starmap.map((_, starIdx) => (
								<li key={starIdx}>
									<button id={`select-star-${starIdx}`} value={starIdx} onClick={selectStar}>
										select star {starIdx}
									</button>
								</li>
							))}
						</ol>
						<button id="reroll" onClick={reroll}>
							reroll
						</button>
						<button id="copy" onClick={copy}>
							copy
						</button>
					</>
				)}
				{state.mode === 'guessing' && !state.guessed && (
					<>
						<ol>
							{state.constellations.map((edges, constellationIdx) => (
								<li key={constellationIdx}>
									<button value={constellationIdx} id={`guess-${constellationIdx}`} onClick={guess}>
										guess {constellationIdx}
									</button>
								</li>
							))}
						</ol>
						<button id="submit-guesses" onClick={submitGuesses}>
							submit guesses
						</button>
					</>
				)}
			</nav>
		</>
	);
}
