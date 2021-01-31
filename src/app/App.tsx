import copyToClipboard from 'copy-to-clipboard';
import produce, { Draft } from 'immer';
import { checkIntersection } from 'line-intersect';
import { nanoid } from 'nanoid';
import 'preact';
import {
	useCallback, useEffect, useMemo, useReducer, useRef,
} from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import seedrandom from 'seedrandom';
import tracery from 'tracery-grammar';
import { Border } from './Border';
import { BorderedText } from './BorderedText';
import {
	bgmTracks, mapHeight, mapMaxStars, mapMinStars, mapSpacing, mapWidth, numConstellations, traceryConstellations,
} from './config';
import { Constellation } from './Constellation';
import { Star } from './Star';
import { Text } from './Text';
import {
	findIndexOrUndefined, generateOutput, parseInput, rndInt, useGridStyle,
} from './utils';

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
	help: boolean;
	audioPlaying: boolean;
	audioTrack: number;
}
type TransferredState = Pick<State, 'constellations' | 'seed' | 'audioTrack'>;
type A<Type extends string, Payload = undefined> = { type: Type; payload: Payload };
type Action =
	| A<'add-edge', [number, number]>
	| A<'remove-edge', { constellation: number; edge: number }>
	| A<'guess', number>
	| A<'set-current-constellation', number>
	| A<'set-current-star', number | undefined>
	| A<'set-seed', string>
	| A<'set-copied', boolean>
	| A<'set-help', boolean>
	| A<'set-playing', boolean>
	| A<'next-track'>
	| A<'previous-track'>
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
	default:
		return '';
	}
}

// using immer here
/* eslint-disable no-param-reassign */
const reducer: Reducer<State, Action> = (state, action) => {
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
		state.guesses = state.guesses.map((i) => (i === action.payload ? -1 : i));
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
	case 'set-help':
		state.help = action.payload;
		break;
	case 'set-seed':
		state.mode = 'creating';
		state.seed = action.payload;
		state.constellations = new Array(numConstellations).fill(0).map(() => []);
		state.guesses = [];
		state.currentConstellation = undefined;
		state.currentStar = undefined;
		state.guessed = false;
		break;
	case 'set-playing':
		state.audioPlaying = action.payload;
		break;
	case 'next-track':
		state.audioTrack = (state.audioTrack + 1) % bgmTracks.length;
		state.audioPlaying = true;
		break;
	case 'previous-track':
		state.audioTrack -= 1;
		if (state.audioTrack < 0) {
			state.audioTrack = bgmTracks.length - 1;
		}
		state.audioPlaying = true;
		break;
	case 'submit-guesses':
		state.guessed = true;
		state.currentConstellation = undefined;
		break;
	default:
		throw new Error('unsupported action');
	}
};
/* eslint-enable no-param-reassign */

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
				help: !localStorage.getItem('creating'),
				audioPlaying: true,
				audioTrack: rndInt(0, bgmTracks.length),
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
			help: !localStorage.getItem('guessing'),
			audioPlaying: true,
			audioTrack: inputObj.audioTrack,
		} as State;
	}, []);
	useEffect(() => {
		localStorage.setItem(initialState.mode, '1');
	}, [initialState.mode]);
	const [state, dispatch] = useImmerReducer(reducer, initialState);
	const { starmap, names, fakeOrder } = useMemo(() => {
		seedrandom(state.seed, { global: true });
		const names = new Set<string>();
		while (names.size < numConstellations) {
			names.add(grammar.flatten('#constellation#'));
		}
		return {
			starmap: new Array(rndInt(mapMinStars, mapMaxStars)).fill(0).map(() => [rndInt(1, mapWidth - 1), rndInt(6 + numConstellations, mapHeight - 6)]) as [number, number][],
			names: [...names],
			fakeOrder: new Array(names.size)
				.fill(0)
				.map((_, idx) => idx)
				.sort(() => Math.random() - 0.5)
				.map((i, idx) => ({ fake: i, original: idx }))
				.sort(({ fake: a }, { fake: b }) => a - b),
		};
	}, [state.seed]);
	const starToConstellation = useMemo(() => starmap.map((_, idx) => findIndexOrUndefined(state.constellations, (constellation) => constellation.some((edge) => edge.includes(idx)))), [
		starmap,
		state.constellations,
	]);
	const output = useMemo(() => {
		if (state.mode !== 'creating') return undefined;
		const toTransfer: TransferredState = {
			seed: state.seed,
			constellations: state.constellations,
			audioTrack: state.audioTrack,
		};
		return generateOutput(toTransfer);
	}, [state]);
	const canCopy = useMemo(() => state.constellations.every((i) => i.length > 0), [state.constellations]);

	const removeEdge = useCallback((constellation: number, edge: number) => dispatch({ type: 'remove-edge', payload: { constellation, edge } }), [dispatch]);
	const selectConstellation = useCallback(
		(event: JSXInternal.TargetedMouseEvent<HTMLButtonElement>) => dispatch({ type: 'set-current-constellation', payload: parseInt(event.currentTarget.value, 10) }),
		[dispatch],
	);
	const selectStar = useCallback(
		(event: JSXInternal.TargetedMouseEvent<HTMLButtonElement>) => {
			if (state.currentConstellation === undefined) return;
			// eslint-disable-next-line prefer-destructuring
			const currentStar = state.currentStar;
			const star = parseInt(event.currentTarget.value, 10);
			// deselect start point
			if (currentStar === star) {
				dispatch({ type: 'set-current-star', payload: undefined });
				return;
			}
			const otherConstellations = state.constellations.filter((_, idx) => idx !== state.currentConstellation);
			// ignore end point part of another constellation
			if (otherConstellations.some((constellation) => constellation.some((i) => i.includes(star)))) {
				return;
			}
			// select start point
			if (currentStar === undefined) {
				dispatch({ type: 'set-current-star', payload: star });
				return;
			}
			// ignore end point resulting in edge intersecting another constellation's edge
			if (
				otherConstellations.some((constellation) => constellation.some(([start, end]) => checkIntersection(...([start, end, currentStar, star].flatMap((i) => starmap[i]) as Parameters<typeof checkIntersection>)).type === 'intersecting'))
			) {
				return;
			}
			// avoid duplicate edge, and instead select new start point
			if (state.constellations[state.currentConstellation].some((i) => i.join(',') === [currentStar, star].sort().join(','))) {
				dispatch({ type: 'set-current-star', payload: star });
				return;
			}
			// select end point
			dispatch({ type: 'add-edge', payload: [currentStar, star].sort() as [number, number] });
			dispatch({ type: 'set-current-star', payload: star });
		},
		[dispatch, starmap, state.currentStar, state.constellations, state.currentConstellation],
	);
	const reroll = useCallback(() => dispatch({ type: 'set-seed', payload: nanoid() }), [dispatch]);
	const toggleHelp = useCallback(() => dispatch({ type: 'set-help', payload: !state.help }), [dispatch, state.help]);
	const hrefTweet = useMemo(() => `https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.href}?${output}`)}&text=`, [output]);
	const hrefOpen = useMemo(() => `${window.location.href}?${output}`, [output]);
	const copy = useCallback(() => {
		copyToClipboard(hrefOpen);
		dispatch({ type: 'set-copied', payload: true });
		setTimeout(() => {
			dispatch({ type: 'set-copied', payload: false });
		}, 500);
	}, [hrefOpen, dispatch]);
	const open = useCallback(() => window.open(hrefOpen, '_blank'), [hrefOpen]);
	const tweet = useCallback(() => window.open(hrefTweet, '_blank'), [hrefTweet]);
	const toggleAudio = useCallback(() => dispatch({ type: 'set-playing', payload: !state.audioPlaying }), [dispatch, state.audioPlaying]);
	const nextTrack = useCallback(() => dispatch({ type: 'next-track', payload: undefined }), [dispatch]);
	const previousTrack = useCallback(() => dispatch({ type: 'previous-track', payload: undefined }), [dispatch]);
	const onPlay = useCallback(() => dispatch({ type: 'set-playing', payload: true }), [dispatch]);
	const onPause = useCallback(() => dispatch({ type: 'set-playing', payload: false }), [dispatch]);
	const refAudio = useRef<HTMLAudioElement>(null);
	useEffect(() => {
		const elAudio = refAudio.current;
		if (!elAudio) return;
		if (elAudio.paused !== !state.audioPlaying) {
			if (state.audioPlaying) {
				elAudio.play().catch((err) => {
					// eslint-disable-next-line no-console
					console.warn("couldn't play audio", err);
					dispatch({ type: 'set-playing', payload: false });
				});
			} else {
				elAudio.pause();
			}
		}
	}, [state.audioPlaying, state.audioTrack, refAudio, dispatch]);
	const guess = useCallback((event: JSXInternal.TargetedMouseEvent<HTMLButtonElement>) => dispatch({ type: 'guess', payload: parseInt(event.currentTarget.value, 10) }), [dispatch]);
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
				html {
					font-size: max(10px, min(${100 / ((mapHeight + 1) * mapSpacing)}vh, ${100 / ((mapWidth + 1) * mapSpacing)}vw));
				}
				body {
					min-width: ${mapWidth * mapSpacing}rem;
				}
				[data-constellation="${state.currentConstellation}"] {
					color: rgba(255,255,255,1.0);
					text-shadow: 0 0 4px rgba(255,255,255,1.0);
				}
				[data-star="${state.currentStar}"] {
					color: rgba(0,255,0,1.0);
				}`}
			</style>
			<main data-guessed={state.guessed} className="map" style={useGridStyle(mapWidth, mapHeight)}>
				{state.constellations.map((i, idx) => {
					const correct = isGuessCorrect(state.guesses[idx], idx);
					return (
						<Constellation
							key={idx}
							data-correct={state.currentConstellation === idx ? correct.toString() : correct}
							data-constellation={state.mode === 'creating' ? idx : findIndexOrUndefined(state.guesses, (i) => i === idx)}
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
							data-constellation={state.mode === 'creating' ? constellationIdx : findIndexOrUndefined(state.guesses, (i) => i === constellationIdx)}
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
				{state.mode === 'creating'
					&& (canCopy ? (
						<>
							<Text x={2} y={4 + numConstellations}>
								Share
							</Text>
							<BorderedText x={8} y={3 + numConstellations} htmlFor="open" title="Open URL in new tab">
								Open
							</BorderedText>
							<BorderedText x={13} y={3 + numConstellations} htmlFor="tweet" title="Share URL to Twitter">
								Tweet
							</BorderedText>
							<BorderedText x={19} y={3 + numConstellations} htmlFor="copy" title="Copy URL to clipboard">
								{state.copied ? 'Copied!' : 'Copy'}
							</BorderedText>
						</>
					) : (
						<>
							<Text x={1} y={4 + numConstellations}>
								Draw all constellations
							</Text>
						</>
					))}
				{state.mode === 'creating' && (
					<BorderedText align="right" x={mapWidth} y={mapHeight - 3} htmlFor="reroll" title="Start over with a new map" cornerBL="-" cornerTR="|">
						Re-roll
					</BorderedText>
				)}

				{state.mode === 'guessing'
					&& !state.guessed
					&& (state.guesses.every((i) => i >= 0) ? (
						<BorderedText title="Confirm matches against solution" x={1} y={3 + numConstellations} htmlFor="submit-guesses">
							Confirm matches
						</BorderedText>
					) : (
						<Text x={2} y={4 + numConstellations}>
							Match all constellations
						</Text>
					))}
				{state.mode === 'guessing' && state.guessed && (
					<>
						<Text x={2} y={4 + numConstellations}>
							{`${state.guesses.filter(isGuessCorrect).length}/${numConstellations} correct`}
						</Text>
						<BorderedText title="Start over with a new map" x={14} y={3 + numConstellations} htmlFor="reroll">
							Play again?
						</BorderedText>
					</>
				)}
				<BorderedText x={mapWidth} align="right" y={0} htmlFor="help" title="Open help menu" cornerTL="-" cornerBR="|">
					?
				</BorderedText>
				<BorderedText x={0} y={mapHeight - 3} cornerBR="-">
					{`${bgmTracks[state.audioTrack].name} - ${bgmTracks[state.audioTrack].artist}`}
				</BorderedText>
				<BorderedText x={0} y={mapHeight - 5} htmlFor="previous-track" title="Play previous track" cornerBL="|" cornerBR="-">
					{'<'}
				</BorderedText>
				<BorderedText x={5} y={mapHeight - 5} htmlFor="next-track" title="Play next track" cornerBL="-" cornerBR="-">
					{'>'}
				</BorderedText>
				<BorderedText x={2} y={mapHeight - 5} htmlFor="toggle-audio" title={state.audioPlaying ? 'Pause audio' : 'Play audio'} cornerBL="-" cornerBR="-">
					{state.audioPlaying ? '||' : '[>'}
				</BorderedText>
				{state.help && (
					<>
						<BorderedText fill x={3} y={3} minW={mapWidth - 8} minH={mapHeight - 8}>
							{state.mode === 'guessing'
								? `
 Welcome to Finder's Keplers!
 ____________________________

 You are the GUESSER.

 The DRAWER drew ${numConstellations} constellations based on ${numConstellations} names,
 and then sent you this link.

 Now you have to guess which
 name goes with which constellation.

  1. Click one of the names in the list.
  2. Click on the constellation that you think
     matches the name.
  3. Repeat steps 1 and 2 for all ${numConstellations} names.
  4. Click "Confirm matches".

 You'll see your score out of ${numConstellations}.
 Try to get all ${numConstellations} correct!

 Good luck!`
								: `
 Welcome to Finder's Keplers!
 ____________________________

 You are the DRAWER.

 You get ${numConstellations} random names, and you need to draw ${numConstellations}
 constellations based on those names.
 If you don't like the names you got,
 then click "Re-roll" in the bottom right
 of the screen to get ${numConstellations} new names.

 To draw the constellations:

  1. Click one of the names in the list.
  2. Click a star on the map to start a constellation.
  3. Click another star to draw a line between
     that star and the previous star.
  4. Repeat steps 2 and 3 until you're done with the
     constellation.
  5. When you're done adding stars to the constellation,
     click another name in the list.
  6. Repeat steps 1 to 5 until you've drawn one
     constellation for each name.

 When you've drawn all of the constellations,
 you can send a link to one or more GUESSERS,
 and they'll try to match each to the names.

 To share a link to your GUESSER(s), click one of the
 "Share" buttons below the list of names. You can open
 the link to your constellations, tweet the link, or
 copy the link to your clipboard. Send this link to
 one or more people and ask them to match the names!

 The more constellations your GUESSER(s) gets right,
 the better you all did!`}
						</BorderedText>
						<BorderedText htmlFor="help" title="Close help menu" align="right" x={mapWidth - 3} y={3} cornerTL="-" cornerBR="|">
							X
						</BorderedText>
					</>
				)}
				<BorderedText x={0} y={0} cornerTR="-" cornerBL="|">
					Finder's Keplers
				</BorderedText>
			</main>
			<nav>
				<button id="help" onClick={toggleHelp}>
					toggle help
				</button>
				<button id="reroll" onClick={reroll}>
					reroll
				</button>
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
							{state.constellations.map((edges, constellationIdx) => edges.map((_, edgeIdx) => (
								<li key={`${constellationIdx}-${edgeIdx}`}>
									<button id={`remove-edge-${constellationIdx}-${edgeIdx}`} onClick={() => removeEdge(constellationIdx, edgeIdx)}>
											remove {names[constellationIdx]} edge {edgeIdx}
									</button>
								</li>
							)))}
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
						<button id="copy" onClick={copy}>
							copy
						</button>
						<button id="tweet" onClick={tweet}>
							tweet
						</button>
						<button id="open" onClick={open}>
							open
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
				<audio ref={refAudio} src={bgmTracks[state.audioTrack].src} onPlay={onPlay} onPause={onPause} loop />
				<button id="toggle-audio" onClick={toggleAudio}>
					toggle audio
				</button>
				<button id="next-track" onClick={nextTrack}>
					next track
				</button>
				<button id="previous-track" onClick={previousTrack}>
					previous track
				</button>
			</nav>
		</>
	);
}
