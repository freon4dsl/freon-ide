# Freon IDE Integration

## How to use this repo

run `npm install`

### Npm Scripts

**update-version** This script increases the version of the generated VS Code extension.
This is used to ensure that at each build there is a new extension with a higher version number so we can install a new version in VSCode.

**langium:generate** Generated all Langium artefacts.

**install-test-data** Makes a copy of test data into this project.
The data sources are git repos, described in `test/test-languages.json`.
Currently it copies all samples and test languages from the main Freon repository.

**test** runs all tests, which means all installed test languages will be parsed. When output contains parser errors, there is something to fix.
Note that this does not test whether code completion, syntax coloring etc is ok.

**September 25 2025, 2025: Released 0.0.7**
Takes into account all syntax changes in Freon 2.0.0-beta.4

**September 11 2025, 2025: Released 0.0.6**
Takes into account all syntax changes in Freon 2.0.0-beta.3

**May 13, 2025: Released 0.0.4**

For developing Freon using the Freon specification languages, you can use the ingrated IDE
support. For Visual Studio Code (VSCode) there is an extention to be installed, for Jetbrains
IDE's like WebStorm an LSP language server is available.

The IDE support has ben developed using Langium.
Note that is a first version please report any problems or feedback,
preferably as an issue in the github project: [https://github.com/freon4dsl/freon-ide.git](https://github.com/freon4dsl/freon-ide.git)

## Installation in VSCode
Install the `freon-ide` extension from the VSCode Marketplace.
See [freon-ide](https://marketplace.visualstudio.com/items?itemName=freon.freon-ide).

## Installation in WebStorm / IntelliJ IDE's

Download the freon-ide release

- Download the latest freon-ide release (freon-ide-<version>.zip) from the assets in [https://github.com/freon4dsl/freon-ide/releases](https://github.com/freon4dsl/freon-ide/releases).
- Unzip the release file into a folder, this folder should not be a tmp folder, its needs to stay available.

Install the LPS plugin

- Install the Red Hat LSP plugin: [https://plugins.jetbrains.com/plugin/23257-lsp4ij](https://plugins.jetbrains.com/plugin/23257-lsp4ij)
  Open the settings for this plugin:

- Goto WebStorm => Settings => Languages & Frameworks => Language Servers.

- Add a Language Server with the name: `freon`.

- Under 'Command' write `node <path-to-unzipped-freon-ide-directory>/public/freonLanguageServer.cjs --stdio`.

- Under the Mappings tab select File name patterns, and create mappings for `*.ast, *.edit`, `*.type`, `*.valid` and `*.scope` with Language Id `Freon`.

- Click OK.

You can open the Language Servers tool window through the menu View => Tools Windows => Language Servers.
Now the tool windows opens and you can see the Freon language server.
If there are any *.ast, *.edit, *.type, *.valid and *.scope files in the project, you can see that the
Freon language server is started and you can see the log output window.
You can also stop and restart the language server.

# Installation of syntax hightlighting
Syntax highlighting in the IDE is not part of the Language Server Protocol.

## Syntax Highlighting in VSCode
The VSCode extension includes both the LSP support, and also the syntax highlighting.
Once the extension is installed both should work.

## Syntax Highlighting in WebStorm
The Redhat LSP plugin only supports the typical LSP functionality, but no syntax highlighting.
To install the syntax highlighting you need to use the WebStorm builtin textmate support.

- Goto WebStorm => Settings => Editor => TextMate bundles
- Click `+` to add a new bundle
- Select the folder where the unzipped freon-ide resides.
- There should now be an entry `freon-ide`

## Other IDE's
You should be able to use the Freon Language Server in other tools that accept an LSP server,
but we have not tried this out. 
