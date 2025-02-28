import * as fs from 'node:fs';

export type ConfigType = {
    repositories: 
        {
            source   : string,
            target   : string,
            languages: string[]
        }[]
}

export function getConfig(): ConfigType {
    const configFile = fs.readFileSync("./scripts/test-languages.json", 'utf-8');
    return JSON.parse(configFile) as ConfigType
}