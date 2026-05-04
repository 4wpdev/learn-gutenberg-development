/**
 * Toolbar and front-end icons: `@wordpress/icons` where available, otherwise inline
 * `SVG`/`Path` primitives. Raw `.svg` file imports do not match what `Icon` / `ToolbarButton`
 * expect (React elements from `@wordpress/primitives`), so paths live here as JSX.
 */
import { arrowRight, starFilled, thumbsUp } from '@wordpress/icons';
import { Path, SVG } from '@wordpress/primitives';

const wordpress = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 1.5a8.5 8.5 0 0 1 6.73 13.69l-2.13-5.84a2.5 2.5 0 0 0-4.7.01L10.63 15l-2.2-6.7a2.2 2.2 0 0 0-2.27-1.5A8.5 8.5 0 0 1 12 3.5zm0 17a8.47 8.47 0 0 1-3.52-.77l2.2-6.43 1.15 3.41a1 1 0 0 0 1.9 0l1.22-3.53 1.67 4.58A8.46 8.46 0 0 1 12 20.5z" />
	</SVG>
);

const github = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.21.68-.48 0-.24-.01-.86-.01-1.7-2.49.54-3.02-1.2-3.02-1.2-.41-1.03-.99-1.31-.99-1.31-.81-.55.06-.54.06-.54.89.06 1.36.92 1.36.92.8 1.35 2.09.96 2.6.73.08-.57.31-.96.56-1.18-1.99-.23-4.09-1-4.09-4.43 0-.98.35-1.78.92-2.4-.09-.23-.4-1.15.09-2.39 0 0 .75-.24 2.46.91a8.53 8.53 0 0 1 4.48 0c1.71-1.15 2.46-.91 2.46-.91.49 1.24.18 2.16.09 2.39.57.62.92 1.42.92 2.4 0 3.44-2.1 4.2-4.1 4.43.32.28.6.82.6 1.65 0 1.19-.01 2.16-.01 2.45 0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
	</SVG>
);

const youtube = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M22 12s0-3.13-.4-4.64a2.42 2.42 0 0 0-1.7-1.71C18.4 5.25 12 5.25 12 5.25s-6.4 0-7.9.4a2.42 2.42 0 0 0-1.7 1.71C2 8.87 2 12 2 12s0 3.13.4 4.64a2.42 2.42 0 0 0 1.7 1.71c1.5.4 7.9.4 7.9.4s6.4 0 7.9-.4a2.42 2.42 0 0 0 1.7-1.71C22 15.13 22 12 22 12zM10 15.5v-7l6 3.5-6 3.5z" />
	</SVG>
);

const linkedin = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M6.94 8.5A1.56 1.56 0 1 1 6.9 5.38a1.56 1.56 0 0 1 .04 3.12zM5.5 9.75h2.87V19H5.5V9.75zm4.67 0h2.75v1.26h.04c.38-.73 1.32-1.5 2.72-1.5 2.9 0 3.43 1.9 3.43 4.37V19h-2.86v-4.54c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39V19h-2.85V9.75z" />
	</SVG>
);

export const ICONS_MAP = {
	star: starFilled,
	heart: thumbsUp,
	arrowRight,
	wordpress,
	github,
	youtube,
	linkedin,
};

export function getIconForToolbar( iconAttr ) {
	if ( iconAttr === 'none' || ! ICONS_MAP[ iconAttr ] ) {
		return starFilled;
	}
	return ICONS_MAP[ iconAttr ];
}

export function getIconForButton( iconAttr ) {
	if ( iconAttr === 'none' || ! ICONS_MAP[ iconAttr ] ) {
		return undefined;
	}
	return ICONS_MAP[ iconAttr ];
}
