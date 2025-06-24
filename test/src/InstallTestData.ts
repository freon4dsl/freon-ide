import { execSync } from 'node:child_process';
import { ConfigType, getConfig } from './text-config.js';

let config: ConfigType = getConfig();

/**
 * Copy all language bdefinitions from github projects described in test-languages.json to this project.
 */
{
	config.repositories.forEach(repo => {
		repo.languages.forEach(language => {
			console.log(`Installing tests from ${repo.source}/${language}/src/defs to ${repo.target}/${language}/src/`)
			console.error(`npx degit -v ${repo.source}/${language}/src/defs/ ${repo.target}/${language}/src/ --force`)
			const subdir = (repo.source.includes("test") ? '/defs' : "/src/defs")
			execSync(`npx degit -v ${repo.source}/${language}${subdir}#${repo.branch} ${repo.target}/${language}/src/ --force`, { stdio: 'inherit' });
		})
	})

}
