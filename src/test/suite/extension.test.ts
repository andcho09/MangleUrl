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
		it('Confluence server with space and title params', function () {
			assert.strictEqual(extract('https://confluence.server/pages/viewpage.action?spaceKey=MySpace&title=Page+In+Space+Title+Format#PageInSpaceTitleFormat-Proposedoption'), 'Page In Space Title Format#Proposedoption');
		});
		it('Confluence server with encoded URI characters', function () {
			assert.strictEqual(extract('https://confluence.server/display/Space/Page+With%3A+Colon'), 'Page With: Colon');

			// TODO is this a real example? Also should we disable title case here since we don't need to guess
			assert.strictEqual(extract('https://confluence.server/display/Space/Page+with+%28brackets%29+-+and+dashes'), 'Page With (brackets) - And Dashes');
		});
		it('Confluence server with attachments', function () {
			assert.strictEqual(extract('https://confluence.server/download/attachments/12345678/Example%20Request%20Topic.json?api=v2'), 'Example Request Topic.json');
		});
		it('JIRA', function () {
			assert.strictEqual(extract('https://jira.atlassian.com/browse/CONFCLOUD-74340'), 'CONFCLOUD-74340');
			assert.strictEqual(extract('https://jira.atlassian.com/browse/CONFCLOUD-74340?filter=-5'), 'CONFCLOUD-74340');
		});
		it('VS Code Fragment URL', function () {
			assert.strictEqual(extract('https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_status-bar'), 'Tips And Tricks#Status Bar');
		});
		it('SharePoint file URL', function () {
			assert.strictEqual(extract('https://company.sharepoint.com/:x:/r/sites/Site/_layouts/15/doc2.aspx?sourcedoc=%7B3333CCCC-CCCC-CCCC-CCCC-CCCCCCCCC%7D&file=File%20With%20Spaces_Underscores_Brackets%20(too).xlsx&action=default&mobileredirect=true&DefaultItemOpen=1&ct=1111111111111&wdOrigin=OFFICECOM-WEB.START.EDGEWORTH&cid=DDDDDD-DDDD-DDDD-DDDD-DDDDDDDD&wdPreviousSessionSrc=HarmonyWeb&wdPreviousSession=EEEE-EEEE-EEEE-EEEE-EEEEEEEE'), 'File With Spaces_Underscores_Brackets (too).xlsx');
		});
		it('SharePoint folder copy URL', function () {
			assert.strictEqual(extract('https://company.sharepoint.com/:f:/r/sites/MySite/Shared%20Documents/Architecture?csf=1&web=1&e=AAAAA'), 'MySite:Shared Documents/Architecture');
		});
		it('SharePoint folder URL', function () {
			assert.strictEqual(extract('https://company.sharepoint.com/sites/MySite/Shared%20Documents/Forms/AllItems.aspx?newTargetListUrl=%2Fsites%2FMySite%2FShared%20Documents&viewpath=%2Fsites%2FMySite%2FShared%20Documents%2FForms%2FAllItems%2Easpx&id=%2Fsites%2FMySite%2FShared%20Documents%2FArchitecture&viewid=BBBBBBB%2DBBBB%2DBBBB%2DBBBB%2DBBBBBBBB'), 'MySite:Shared Documents/Architecture');
		});
		it('Javadoc', function () {
			assert.strictEqual(extract('https://documentation-server/build/javadoc/com.company.package/com/company/package/spi/InterfaceProvider.html#resolve-java.util.Collection-java.util.Map-java.util.Locale-'), 'com.company.package.spi.InterfaceProvider#resolve');
		});
		it('Gitlab', function () {
			assert.strictEqual(extract('https://gitlab.com/ongresinc/stackgres/-/blob/main/stackgres-k8s/src/jobs/src/main/java/io/stackgres/jobs/Main.java?ref_type=heads'), 'io.stackgres.jobs.Main');
			assert.strictEqual(extract('https://gitlab.com/ongresinc/stackgres/-/blob/main/stackgres-k8s/src/jobs/src/main/java/io/stackgres/jobs/Main.java?ref_type=heads#L22'), 'io.stackgres.jobs.Main#L22');
			assert.strictEqual(extract('https://gitlab.com/ongresinc/stackgres/-/blob/main/stackgres-k8s/src/operator/src/test/java/io/stackgres/operator/conciliation/factory/cluster/patroni/PatroniTest.java'), 'io.stackgres.operator.conciliation.factory.cluster.patroni.PatroniTest');
			assert.strictEqual(extract('https://gitlab.com/ongresinc/stackgres/-/blob/release-1.6.0/stackgres-k8s/src/admin-ui/src/components/ClusterEvents.vue?ref_type=heads#L4'), 'admin-ui/src/components/ClusterEvents.vue#L4');
		});
		it('src/main', function () {
			assert.strictEqual(extract('https://stash.internal/projects/MyProject/repos/application_name/browse/application_name/long.package.name.prefix/src/main/java/long/package/name/prefix/internal/version/Class.java'), 'long.package.name.prefix.internal.version.Class');
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

	describe('Trim white space', function () {
		it('Trim spaces', function () {
			assert.strictEqual(extract(' https://jira.atlassian.com/browse/CONFCLOUD-74340 '), 'CONFCLOUD-74340');
		});
		it('Trim new lines', function () {
			assert.strictEqual(extract(' \n https://jira.atlassian.com/browse/CONFCLOUD-74340 \n '), 'CONFCLOUD-74340');
		});
	});
});
