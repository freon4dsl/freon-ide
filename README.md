# Freon IDE Integration

**NB** The current release 0.0.3 is a **prerelease**, and syntactically diverges from the Freon languages in the .valid and .type files.

For developing Freon using the Freon specification languages, you can use the ingrated IDE
support. For Visual Studio Code (VSCode) there is an extention to be installed, for Jetbrains
IDE's like WebStorm an LSP language server is available.

The IDE support has ben developed using Langium.
Note that is a first version please report any problems or feedback,
preferably as an issue in the github project: [https://github.com/freon4dsl/freon-ide.git](https://github.com/freon4dsl/freon-ide.git)

## Installation in VSCode
Install the `freon-ide` extension from the VSCode Marketplace.

## Installation in WebStorm / IntelliJ IDE's

Download the freon-ide release

- Download the latest freon-ide release (freon-ide-<version>.zip) from the assets in [https://github.com/freon4dsl/freon-ide/releases](https://github.com/freon4dsl/freon-ide/releases).
- Unzip the release file into a folder, this folder should not be a tmp folder, its needs to stay available.

Install the LPS plugin

- Install the Red Hat LSP plugin: [https://plugins.jetbrains.com/plugin/23257-lsp4ij](https://plugins.jetbrains.com/plugin/23257-lsp4ij)
  Open the settings for this plugin:

- Goto WebStorm => Settings => Languages & Frameworks => Language Servers.

- Add a Language Server with the name: `freon`.

- Under 'Command' write `node <path-to-freon-ide-directory>/public/freonLanguageServer.cjs --stdio`.

- Under the Mappings tab select File name patterns, and create mappings for *.ast, *.edit, *.type, *.valid and *.scope with Language Id `freon`.

- Click OK.

You can open the Language Servers tool window through the menu View => Tools Windows => Language Servers.
Now the tool windows opens and you can see the Freon language server.
If there are any *.ast, *.edit, *.type, *.valid and *.scope files in the project, you can see that the
Freon language server is started and you can see the log output window.
You can also stop and restart the language server.

# Installation of syntax hightlighting
Syntax highlighting in the IDE is not part of the Language Server Protocol.

## Syntax Highlighting in VSCode
The VSCode extension includes both the LSP support, and also the syntx highlighting.
Once the extension is installed both should work.

## Syntax Highlighting in WebStorm
The Redhat LSP plugin only supports the typical LSP functionality, but no syntax highlighting.
To install the syntax highlighting you need to use the WebStorm textmate support.

- Goto WebStorm => Settings => Editor => TextMate bundles
- Click `+` to add a new bundle
- Select the folder where the unzipped freon-ide resides. 
- There should now be an entry `freon-ide`

## Other IDE's
You should be able to use the Freon Language Server in other tools that accept an LSP server,
but we have not tried this out. 
