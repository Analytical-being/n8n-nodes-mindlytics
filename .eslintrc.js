module.exports = {
	root: true,
	env: { node: true },
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: ['./tsconfig.json'],
	},
	plugins: ['eslint-plugin-n8n-nodes-base'],
	extends: ['plugin:eslint-plugin-n8n-nodes-base/nodes'],
	ignorePatterns: ['.eslintrc.js', 'gulpfile.js'],
};
