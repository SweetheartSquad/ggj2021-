export const numConstellations = 5;
export const mapWidth = 64;
export const mapHeight = 48;
export const mapMinStars = 30;
export const mapMaxStars = 50;
export const mapSpacing = 0.9;
export const mapStars = ['*', '*', '*', 'o', 'O', '.', '.', '.', '+', '+'];
export const bgmTracks = ['The_Belt_of_Death', 'The_Heart_of_Ambition', 'The_Princess_of_Leadership'].map(i => ({
	name: i.replaceAll('_', ' '),
	src: `./audio/${i}.mp3`,
	artist: 'Andrew Yolland',
}));
export const traceryConstellations = {
	group: ['belt', 'arm', 'leg', 'heart', 'collection', 'prince', 'princess', 'bastard', 'ensorcellment', 'enchantment', 'convalescence', 'beast', 'box', 'bow', 'vortex', 'tooth'],
	grouping: ['stars', 'patience', 'death', 'possession', 'temperament', 'perspective', 'ambition', 'leadership', 'chaos', 'balance', 'faith'],
	constellation: ['The #group.capitalize# of #grouping.capitalize#', '#group.capitalize# of #grouping.capitalize#'],
};
