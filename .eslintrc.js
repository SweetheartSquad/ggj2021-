module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: ['airbnb-base', 'preact'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 12,
		sourceType: 'module',
	},
	plugins: ['react', '@typescript-eslint'],
	rules: {
		'max-len': 'off', // just apply common-sense
		'import/no-unresolved': 'off', // doesn't seem to work with parcel

		// named instead of default
		'import/prefer-default-export': 'off',
		'import/no-default-export': 'error',

		// fix ts issues
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': 'error',

		// tabs instead of spaces
		'no-tabs': 'off',
		indent: ['error', 'tab'],

		// i just like using these 🤷‍♀️
		'import/extensions': 'off',
		'no-multi-assign': 'off',
		'no-plusplus': 'off',
		'no-continue': 'off',
	},
};
