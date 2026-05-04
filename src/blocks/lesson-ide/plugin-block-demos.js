/**
 * Select options for Lesson IDE: labels come from the REST ide-block catalog
 * (`/learn-gutenberg/v1/ide-block-catalog`); this module only formats them.
 */

/**
 * @param {Array<{ slug: string, title: string }>|undefined} blocks
 * @return {Array<{ label: string, value: string }>}
 */
export function formatIdeBlockCatalogOptions( blocks ) {
	if ( ! Array.isArray( blocks ) || blocks.length === 0 ) {
		return [];
	}
	return blocks.map( ( b ) => ( {
		label: `${ b.title } (${ b.slug })`,
		value: b.slug,
	} ) );
}

/**
 * @param {string|undefined} slug
 * @param {Array<{ slug: string, title: string }>|undefined} blocks
 * @return {boolean}
 */
export function isIdeCatalogSlug( slug, blocks ) {
	if ( ! slug || typeof slug !== 'string' || ! Array.isArray( blocks ) ) {
		return false;
	}
	return blocks.some( ( b ) => b.slug === slug );
}

/**
 * When the catalog has loaded, only listed blocks are allowed; otherwise fall back to the
 * same slug rules as the REST ide-sources endpoint (excludes Lesson IDE).
 *
 * @param {string|undefined} slug
 * @param {Array<{ slug: string, title: string }>|undefined} blocks
 * @return {boolean}
 */
export function canSelectIdeBlockSlug( slug, blocks ) {
	if ( ! slug || typeof slug !== 'string' ) {
		return false;
	}
	if ( 'learn-gutenberg/lesson-ide' === slug ) {
		return false;
	}
	if ( Array.isArray( blocks ) && blocks.length > 0 ) {
		return isIdeCatalogSlug( slug, blocks );
	}
	return /^learn-gutenberg\/[a-z0-9-]+$/.test( slug );
}
