/** Fallback tab sources when `attributes.files` is missing or invalid (matches block.json default). */
export const DEFAULT_FILES = [
	{ name: 'index.js', language: 'javascript', content: '' },
];

/** Default file tree when structure JSON / URL is empty (VS Code–style explorer). */
export const DEFAULT_TREE = {
	type: 'dir',
	name: 'LEARN-GUTENBERG-DEVELOPMENT',
	children: [
		{ type: 'dir', name: 'build', children: [] },
		{ type: 'dir', name: 'includes', children: [] },
		{
			type: 'dir',
			name: 'src',
			children: [
				{
					type: 'dir',
					name: 'blocks',
					children: [
						{
							type: 'dir',
							name: 'placeholder',
							children: [ { type: 'file', name: 'index.js' } ],
						},
					],
				},
			],
		},
		{ type: 'file', name: 'package.json' },
		{ type: 'file', name: 'learn-gutenberg-development.php' },
		{ type: 'file', name: 'README.md' },
	],
};

/** Emulated `npm run build` lines for the Lesson IDE terminal (editor + frontend). */
export const BUILD_LINES = [
	'$ npm run build',
	'',
	'> learn-gutenberg-development@0.1.1 build',
	'> wp-scripts build',
	'',
	'webpack 5.x compiled successfully in ~1200 ms',
];

export const SAMPLE_INDEX_JS = `import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';

function Edit() {
	const blockProps = useBlockProps();
	return <p { ...blockProps }>Lesson IDE — editor pane</p>;
}

function Save() {
	const blockProps = useBlockProps.save();
	return <p { ...blockProps }>Lesson IDE — frontend</p>;
}

registerBlockType( 'demo/example', {
	edit: Edit,
	save: Save,
} );
`;
