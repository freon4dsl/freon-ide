import { startLanguageServer } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { createFreonServices } from './freon-module.js';

console.log("Freon Language Server 0.0.2")

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared } = createFreonServices({ connection, ...NodeFileSystem });

// Start the language server with the shared services
startLanguageServer(shared);
