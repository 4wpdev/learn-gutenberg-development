/**
 * Match user input against wp-cli-commands.json entries.
 *
 * @param {string}      inputCommand User input.
 * @param {Array<object>} commands   Command definitions.
 * @return {{ output: string, tip: string, slug: string }}
 */
export function findCommand( inputCommand, commands ) {
	const command = String( inputCommand || '' ).trim().toLowerCase();
	const list = Array.isArray( commands ) ? commands : [];

	const exactMatch = list.find(
		( c ) =>
			typeof c.command === 'string' &&
			c.command.toLowerCase() === command
	);
	if ( exactMatch ) {
		return {
			output: exactMatch.output,
			tip: exactMatch.tip || '',
			slug: exactMatch.slug || 'help',
		};
	}

	const patternMatch = list.find(
		( c ) =>
			typeof c.pattern === 'string' &&
			command.startsWith( c.pattern.toLowerCase() )
	);
	if ( patternMatch ) {
		const parts = command.split( ' ' );
		const param = parts[ 3 ] || patternMatch.defaultParam || '';
		return {
			output: String( patternMatch.output || '' ).replace(
				/{param}/g,
				param
			),
			tip: patternMatch.tip || '',
			slug: patternMatch.slug || 'help',
		};
	}

	return {
		output: `Error: '${ inputCommand }' is not a registered wp command.\nType 'help' to see available commands.`,
		tip: 'Check command spelling or use wp help for available commands.',
		slug: 'help',
	};
}
