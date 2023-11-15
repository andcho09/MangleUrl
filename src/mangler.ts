import path = require("path");

export enum OutputFormat {
	displayNameOnly, // Just the display name only
	href, // A href with extracted display name and original URL
	jira, // A link in JIRA's raw text format [<display name>|URL]
	markdown // A link in Markdown format [<display name>](URL)]
}

const REGEX_DASH_WORD_SEPARATOR = /[A-z0-0]-[A-z0-0]/g;
const REGEX_PLUS_WORD_SEPARATOR = /[A-z0-0]\+[A-z0-0]/g;
const REGEX_JAVA_IDENTIFIER = /[A-z0-9]+/;

/**
 * For the given the URL and display name to the specified output format.
 * @param urlString the URL the displayName was extracted from
 * @param displayName the display name for the URL
 * @param outputFormat the desired output format. Defaults to OutputFormat.displayNameOnly
 * @returns a formatted string
 */
export function formatDisplayName(urlString: string, displayName: string, outputFormat: OutputFormat = OutputFormat.displayNameOnly): string {
	switch (outputFormat) {
		// TODO need some escaping here if the display name has special characters
		case OutputFormat.href:
			return `<a href="${urlString}">${displayName}</a>`;
		case OutputFormat.jira:
			return `[${displayName}|${urlString}]`;
		case OutputFormat.markdown:
			return `[${displayName}](${urlString})`;
	}
	return displayName;
}

/**
 * Extract the display from the the given URL
 * @param urlString the URL
 * @returns the display name or the empty string if a display name can't be extracted
 */
export function extract(urlString: string): string {
	let url: URL;
	try {
		url = new URL(urlString.trim());
	} catch (err) {
		// Not a URL
		return '';
	}

	const lastSlash: number = url.pathname.lastIndexOf('/');
	let title: string = url.pathname.substring(lastSlash + 1);
	let hash: string = url.hash;

	const hostnameLower: string = url.hostname.toLowerCase();

	// JIRA handling: preserve '-'
	if (hostnameLower.indexOf('jira') >= 0) {
		return title;
	}

	// SharePoint handling
	if (hostnameLower.indexOf('sharepoint.com') >= 0) {
		const fileParam: string | null = url.searchParams.get('file');
		if (fileParam) {
			return fileParam;
		}

		const idParam: string | null = url.searchParams.get('id');
		const pathname = idParam ? idParam : url.pathname;
		const sitesIndex = pathname.indexOf('sites/');
		return decodeURI(pathname.substring(sitesIndex + 6).replace('/', ':'));
	}

	// Javadoc handling
	if (url.pathname.toLowerCase().indexOf('javadoc') >= 0) {
		let result: string = '';
		const paths: string[] = url.pathname.split('/');
		for (let i: number = paths.length - 2; i >= 0; i--) {
			const path: string = paths[i];
			if (path.indexOf('.') < 0) {
				result = path + '.' + result; // Legal Java package names do not have periods '.'
			} else {
				break;
			}
		}
		const dotIndex: number = title.indexOf('.');
		if (dotIndex > 0) {
			result += title.substring(0, dotIndex);
		} else {
			result += title;
		}
		const methodNameMatch = REGEX_JAVA_IDENTIFIER.exec(url.hash);
		if (methodNameMatch) {
			result += '#' + methodNameMatch[0];
		}
		return result;
	}

	// Confluence handling
	if (url.searchParams.has('spaceKey') && url.searchParams.has('title')) {
		// Confluence URL format with "viewpage.action" as the pathname and "spaceKey" and "title" query params
		title = url.searchParams.get('title')!;
	}
	const separatorResult: SeparatorResult = separateWords(title); // Confluence server uses + while cloud seems to use - to separate words
	let result: string = separatorResult.separatedText;
	if (hash) {
		hash = hash.substring(1);
		// The hash gives us a big hint as how to format the case (but not the insertion of spaces) of the display name
		const titleNoSpaces = result.replaceAll(' ', '');
		if (hash.toLowerCase().startsWith(titleNoSpaces.toLowerCase())) {
			result = toFragmentCase(result, hash);
			hash = hash.substring(titleNoSpaces.length + 1);
		} else {
			// Can't use the hash to derive the case, just use sentence case
			result = toSentenceTitleCase(result);
		}

		// Append fragment
		if (separatorResult.separator) {
			hash = hash.replaceAll(separatorResult.separator, ' ').trim();
		}
		result += '#' + toSentenceTitleCase(clean(hash));

	} else {
		result = toSentenceTitleCase(result);
	}

	return decodeURIComponent(result);
}

/**
 * Guesses whether the words in the given text is separated by dashes '-' or pluses '+' and replaces them with spaces ' '
 * @param text string of words separated by dashes or pluses
 * @returns a SeparatorResult containing the word space separated and the regex used, or the original text if the word separator cannot be determined
 */
export function separateWords(text: string): SeparatorResult {
	// Guess whether the words are separated by dashes or pluses
	let matches = text.match(REGEX_DASH_WORD_SEPARATOR);
	const dashCount: number = matches ? matches.length : 0;
	matches = text.match(REGEX_PLUS_WORD_SEPARATOR);
	const plusCount: number = matches ? matches.length : 0;
	if (dashCount > plusCount) {
		return { separatedText: text.replaceAll('-', ' '), separator: '-' }; //TODO probably should replace using the regex since some dashes shouldn't be replaced e.g. "Category - Sub Category". Need to find an example.
	} else if (plusCount > dashCount) {
		return { separatedText: text.replaceAll('+', ' '), separator: '+' };
	}
	return { separatedText: text };
}

type SeparatorResult = {
	separatedText: string;
	separator?: string | undefined;
};

/**
 * Converts a space separated sentence phrase and changes it to title case (i.e. the first letter of each word is upper case). The case of other letters is not adjusted to handle cases where upper casing has already been applied.
 * @param text the sentence
 * @returns the sentence in title case
 */
function toSentenceTitleCase(text: string): string {
	let words: string[] = text.split(' ');
	words = words.map(function (word) {
		return word.charAt(0).toUpperCase() + word.slice(1);
	});
	return words.join(' ');
}

/**
 * Converts the given sentence using the same case as given fragment. This is useful in sites such as Confluence where the path is always lower case but the fragment has the case of the title of the page.
 * @param text the sentence with spaces (this function doesn't add new spaces)
 * @param fragment the fragment which must not have spaces. Can be longer than the sentence (i.e. has a genuine fragment at the end)
 * @returns the sentence using the fragment's case
 */
function toFragmentCase(text: string, fragment: string): string {
	const result: string[] = [];
	let j: number = 0;
	for (let i: number = 0; i < text.length; i++) {
		const c = text.charAt(i);
		if (c === ' ') {
			result.push(' '); // Advance through the input text that has spaces but not the fragment which doesn't have spaces
		} else {
			result.push(fragment.charAt(j));
			j++;
		}
	}
	return result.join('');
}

function clean(text: string): string {
	let result: string = text;
	if (result.charAt(0) === '_') {
		result = result.substring(1);
	}
	return decodeURI(result).trim();
}
