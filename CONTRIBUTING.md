# Contributing

## TODO

* Test Sharepoint URL
* Craft pre-release checklist
* Publish to Marketplace

## Development Environment Setup

Install requirements:

* ``Node.js`` - tested using Node 18 although VS Code's is using 16 (see _About_ menu)
* (Optional) [nvm](https://github.com/nvm-sh/nvm)

Then run:

``$ npm install``


## Testing

Launch tests from VS Code's _Run and Debug_ using the ``Extension Tests`` configuration.


## Debugging

Debug using VS Code's _Run and Debug_ using the ``Run Extension`` configuration.

Reload the window to take the latest code changes.


## Publishing

### Checklist

1. Update Release Notes section in [README.md](README.md)
1. Test the package with a [vsce deployment]https://code.visualstudio.com/api/working-with-extensions/publishing-extension#vsce]:
	1. Run {{$ vsce package}}
