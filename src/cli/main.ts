// import type { Model } from '../language/generated/ast.js';
import chalk from 'chalk';
import { Command } from 'commander';
import { FreonAstLanguageMetaData } from '../language/generated/module.js';
import { createFreonServices } from '../language/freon-module.js';
// import { extractAstNode } from './cli-util.js';
// import { generateJavaScript } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { extractFreonModels } from './cli-util-multifile.js';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export type ConfigType = {
    repositories: 
        {
            source   : string,
            target   : string,
            languages: string[]
        }[]
}

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {

    const services = createFreonServices(NodeFileSystem).Freon;
    const configFile = await fs.readFile("./scripts/test-languages.json", 'utf-8');
    const config = JSON.parse(configFile) as ConfigType

    console.log(`Repo ${config.repositories[1].languages.join(" ")}`)

    const models = await extractFreonModels('./src/defs', services)
    models.forEach( m => {
        if (m.ast !== undefined) {
            console.log("Ast model " + m.ast.name)
        }
        if (m.edit !== undefined) {
            console.log("Edit model " + m.edit.name)
        }
        if (m.scoper !== undefined) {
            console.log("Edit model " + m.scoper.name)
        }
        if (m.typer !== undefined) {
            console.log("Edit model " + m.typer)
        }
        if (m.validator !== undefined) {
            console.log("Edit model " + m.validator)
        }

    })
    console.log(chalk.green(`DONE`));
};

export type GenerateOptions = {
    destination?: string;
}

// export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = FreonAstLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates JavaScript code that prints "Hello, {name}!" for each greeting in a source file')
        .action(generateAction);

    program.parse(process.argv);
// }


