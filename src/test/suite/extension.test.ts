import * as assert from 'assert';
import { describe, it } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';

import { OutputFormat, extract, formatDisplayName, separateWords } from '../../mangler';

suite('URL Mangler Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	describe('Extract', function () {
		it('Not a URL', function () {
			assert.strictEqual('', extract('foo'));
		});
		it('Confluence-like', function () {
			// The real https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page-278692715.html has a URL extension and page ID in the URL
			assert.strictEqual(extract('https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page'), 'The Differences Between Various Url Formats For A Confluence Page');
		});
		it('Confluence-like with simple fragment', function () {
			assert.strictEqual(extract('https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background'), 'The Differences Between Various URL Formats for a Confluence Page#Background');
		});
		it('Confluence server', function () {
			assert.strictEqual(extract('https://confluence.intranet/display/Space/Page+With+Spaces+-+And+Dashes'), 'Page With Spaces - And Dashes');
			assert.strictEqual(extract('https://confluence.intranet/display/Space/Page+With+Spaces+-+And+Dashes#PageWithSpaces-AndDashes#Anchor Target'), 'Page With Spaces - And Dashes#Anchor Target');
		});
		it('JIRA', function () {
			assert.strictEqual(extract('https://jira.atlassian.com/browse/CONFCLOUD-74340'), 'CONFCLOUD-74340');
			assert.strictEqual(extract('https://jira.atlassian.com/browse/CONFCLOUD-74340?filter=-5'), 'CONFCLOUD-74340');
		});
		it('VS Code Fragment URL', function () {
			assert.strictEqual(extract('https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_status-bar'), 'Tips And Tricks#Status Bar');
		});
	});

	describe('Extract with output formatting', function () {
		it('href', function () {
			assert.strictEqual(formatDisplayName('https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background', 'The Differences Between Various URL Formats for a Confluence Page#Background', OutputFormat.href), '<a href="https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background">The Differences Between Various URL Formats for a Confluence Page#Background</a>');
		});
		it('Jira', function () {
			assert.strictEqual(formatDisplayName('https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background', 'The Differences Between Various URL Formats for a Confluence Page#Background', OutputFormat.jira), '[The Differences Between Various URL Formats for a Confluence Page#Background|https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background]');
		});
		it('Markdown', function () {
			assert.strictEqual(formatDisplayName('https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background', 'The Differences Between Various URL Formats for a Confluence Page#Background', OutputFormat.markdown), '[The Differences Between Various URL Formats for a Confluence Page#Background](https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background)');
		});
	});

	describe('Separate words', function () {
		it('Separate pluses but not dashes', function () {
			assert.strictEqual(separateWords('Page+With+Spaces+-+And+Dashes').separatedText, 'Page With Spaces - And Dashes');
		});
	});
});
