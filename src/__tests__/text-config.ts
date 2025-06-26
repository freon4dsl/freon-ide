import * as fs from 'node:fs';

export type ConfigType = {
    repositories: 
        {
            source   : string,
            branch   : string,
            target   : string,
            languages: string[]
        }[]
}

export function getConfig(): ConfigType {
    const configFile = fs.readFileSync("./src/__tests__/test-languages.json", 'utf-8');
    return JSON.parse(configFile) as ConfigType
}