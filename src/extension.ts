// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { OutputFormat, extract, formatDisplayName } from './mangler';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	//console.log('Congratulations, your extension "urlmanglervscodeextension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('urlmanglervscodeextension.extract', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const editor = vscode.window.activeTextEditor;
		const selection = editor?.selection;
		if (selection && !selection.isEmpty) {
			const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
			const highlighted = editor.document.getText(selectionRange);
			const displayName = extract(highlighted);
			if (displayName === '') {
				vscode.window.showWarningMessage(`Can't mangle the URL '${highlighted}', it doesn't appear to be a URL`);
			} else {
				const item = await vscode.window.showQuickPick(['Display name only', 'href', 'Jira text', 'Markdown'], { title: 'Select an output format' });
				let outputFormat;
				switch (item) {
					case 'href':
						outputFormat = OutputFormat.href;
						break;
					case 'Jira text':
						outputFormat = OutputFormat.jira;
						break;
					case 'Markdown':
						outputFormat = OutputFormat.markdown;
					default:
						outputFormat = OutputFormat.displayNameOnly;
				}
				const result = formatDisplayName(highlighted, displayName, outputFormat);
				vscode.env.clipboard.writeText(result);
				vscode.window.showInformationMessage('Mangled URL to clipboard: ' + result);
			}
		} else {
			vscode.window.showInformationMessage('Select a URL to mangle');
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
