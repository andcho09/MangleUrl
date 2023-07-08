import * as assert from 'assert';
import { describe, it } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';

import { OutputFormat, extract, formatDisplayName } from '../../mangler';

suite('URL Mangler Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	describe('Extract', function () {
		it('Not a URL', function () {
			assert.strictEqual('', extract('foo'));
		});
		it('Confluence-like', function () {
			// The real https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page-278692715.html has a URL extension and page ID in the URL
			assert.strictEqual('The Differences Between Various Url Formats For A Confluence Page', extract('https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page'));
		});
		it('Confluence-like with simple fragment', function () {
			assert.strictEqual('The Differences Between Various URL Formats for a Confluence Page#Background', extract('https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background'));
		});
		it('JIRA', function () {
			assert.strictEqual('CONFCLOUD-74340', extract('https://jira.atlassian.com/browse/CONFCLOUD-74340'));
			assert.strictEqual('CONFCLOUD-74340', extract('https://jira.atlassian.com/browse/CONFCLOUD-74340?filter=-5'));
		});
	});

	describe('Extract with output formatting', function () {
		it('href', function () {
			assert.strictEqual('<a href="https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background">The Differences Between Various URL Formats for a Confluence Page#Background</a>', formatDisplayName('https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background', 'The Differences Between Various URL Formats for a Confluence Page#Background', OutputFormat.href));
		});
		it('Jira', function () {
			assert.strictEqual('[The Differences Between Various URL Formats for a Confluence Page#Background|https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background]', formatDisplayName('https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background', 'The Differences Between Various URL Formats for a Confluence Page#Background', OutputFormat.jira));
		});
		it('Markdown', function () {
			assert.strictEqual('[The Differences Between Various URL Formats for a Confluence Page#Background](https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background)', formatDisplayName('https://confluence.atlassian.com/confkb/the-differences-between-various-url-formats-for-a-confluence-page#TheDifferencesBetweenVariousURLFormatsforaConfluencePage-Background', 'The Differences Between Various URL Formats for a Confluence Page#Background', OutputFormat.markdown));
		});
	});
});
