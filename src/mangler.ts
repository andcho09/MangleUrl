export enum OutputFormat {
	displayNameOnly, // Just the display name only
	href, // A href with extracted display name and original URL
	jira, // A link in JIRA's raw text format [<display name>|URL]
	markdown // A link in Markdown format [<display name>](URL)]
}

const REGEX_CHARS_TO_REPLACE = /[-+_]/g;

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
		url = new URL(urlString);
	} catch (err) {
		// Not a URL
		return '';
	}

	const lastSlash: number = url.pathname.lastIndexOf('/');
	let title: string = url.pathname.substring(lastSlash + 1);
	let hash = url.hash;

	// JIRA handling: preserve '-'
	if (url.hostname.toLowerCase().indexOf('jira') >= 0) {
		return title;
	}

	// Confluence handling: insert spaces and handle fragments
	let result = title.replaceAll(REGEX_CHARS_TO_REPLACE, ' ');
	if (hash) {
		hash = hash.substring(1);
		// The hash gives us a big hint as how to format the case (but not the insertion of spaces) of the display name
		let titleNoSpaces = title.replaceAll(REGEX_CHARS_TO_REPLACE, '');
		if (hash.toLowerCase().startsWith(titleNoSpaces.toLowerCase())) {
			result = toFragmentCase(result, hash);
			hash = hash.substring(titleNoSpaces.length + 1);
		} else {
			// Can't use the hash to derive the case, just use sentence case
			result = toSentenceTitleCase(result);
		}

		// Append fragment
		hash = hash.replaceAll(REGEX_CHARS_TO_REPLACE, ' ').trim();
		result += '#' + toSentenceTitleCase(hash);

	} else {
		result = toSentenceTitleCase(title.replaceAll(REGEX_CHARS_TO_REPLACE, ' '));
	}

	return result;
}

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
 * @param fragment the fragment which must not have space. Can be longer than the sentence (i.e. has a genuine fragment at the end)
 * @returns the sentence using the fragment's case
 */
function toFragmentCase(text: string, fragment: string): string {
	let result: string[] = [];
	let j: number = 0;
	for (let i: number = 0; i < text.length; i++) {
		let c = text.charAt(i);
		if (c === ' ') {
			result.push(' '); // Advance through the input text that has spaces but not the fragment which doesn't have spaces
		} else {
			result.push(fragment.charAt(j));
			j++;
		}
	}
	return result.join('');
}