# Contributing

## Development Environment Setup

Install requirements:

* ``Node.js`` - tested using Node 20. See what version VS Code's under the _Help > About_ menu).
* (Optional) [nvm](https://github.com/nvm-sh/nvm)

Then run:

* ``$ npm install``
* ``$ npm install -g @vscode/vsce``

## Testing

Launch tests from VS Code's _Run and Debug_ using the ``Extension Tests`` configuration.


## Debugging

Debug using VS Code's _Run and Debug_ using the ``Run Extension`` configuration. You might need to run `npm package` first.

Reload the window to take the latest code changes.


## Publishing to VS Code Marketplace

### First-time setup

1. Sign up for a [Azure Personal Access Token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token)
1. [Create a publisher for the VS Code Marketplace](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher)

### Checklist

1. Lint with ``npm run lint``
1. Update version number in:
	* [package.json](package.json)
	* [package-lock.json](package-lock.json)
	* _Release Notes_ section in [README.md](README.md)
1. Run ``$ vsce package``
1. Test the package with a [vsce deployment](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#vsce):
	1. Right-click the generated ``.vsix`` and select ``Install VSIX extension``
	1. Mangle some URLs
	1. View the extensions README.md in the Extensions sidebar
	1. Don't forget to uninstall the extension when you're done testing
1. Publish with ``$ vsce publish``
	1. Follow publication status at https://marketplace.visualstudio.com/manage/publishers