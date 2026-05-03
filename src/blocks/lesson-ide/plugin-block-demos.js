/**
 * Inspector catalog: which plugin block’s sources the Lesson IDE mirrors.
 * Actual tree + file contents load from disk via REST (`/learn-gutenberg/v1/ide-sources`).
 */
import { __ } from '@wordpress/i18n';

export const LESSON_IDE_BLOCK_NAME = 'learn-gutenberg/lesson-ide';

/** Blocks under src/blocks/ (except Lesson IDE). Extend when you add blocks. */
export const PLUGIN_BLOCK_DEMOS = [
	{
		slug: 'learn-gutenberg/placeholder',
		title: __( 'Placeholder', 'learn-gutenberg-development' ),
	},
];

const DEMO_BY_SLUG = Object.fromEntries(
	PLUGIN_BLOCK_DEMOS.map( ( d ) => [ d.slug, d ] )
);

export function getPluginBlockDemoBySlug( slug ) {
	if ( ! slug || typeof slug !== 'string' ) {
		return null;
	}
	return DEMO_BY_SLUG[ slug ] ?? null;
}

export function getPluginBlockDemoSelectOptions() {
	return PLUGIN_BLOCK_DEMOS.map( ( d ) => ( {
		label: `${ d.title } (${ d.slug })`,
		value: d.slug,
	} ) );
}
