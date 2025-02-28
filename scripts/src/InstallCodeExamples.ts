import { execSync } from 'node:child_process';

/**
 * Copy all examples from github project `create-freon-languages` to the code-examples folder.
 */
{
	// for (const languageName of ['CourseSchedule', 'CustomizationsProject', 'Education', 'EducationInterpreter', 'Expressions', 'Insurance', "TyperExample"]) {
	for (const languageName of ['Calculator', 'CourseSchedule', 'Example', 'Octopus', 'Education', 'Insurance']) {
		console.log(`Copying ${languageName}`);
		const langRepo = `https://github.com/freon4dsl/Freon4dsl/packages/samples/${languageName}`;
		await execSync(`npx degit -v ${langRepo}/src/defs ../test-cases/samples/${languageName}/src/ --force`, { stdio: 'inherit' });
	}
	for (const languageName of ['CourseSchedule', 'CustomizationsProject', 'Education', 'EducationInterpreter', 'Expressions', 'Insurance', "TyperExample"]) {
		console.log(`Copying ${languageName} from freon-create-language`);
		const langRepo = `https://github.com/freon4dsl/create-freon-languages/languages/${languageName}`;
		await execSync(`npx degit -v ${langRepo}/src/defs ../test-cases/freon-languages/${languageName}/src/ --force`, { stdio: 'inherit' });
	}

}
