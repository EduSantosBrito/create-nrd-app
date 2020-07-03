// tslint:disable-next-line:no-var-requires
require('module-alias/register');
import { Command } from 'commander';
import chalk from 'chalk';
import { version } from './package.json';
import {
    generateFolder,
    generatePackageJson,
    generateDockerCompose,
    generateTsConfigJson,
    generateServerPackageJson,
    generateServerIndex,
    generateEslintConfig,
} from '@app/functions';
import inquirer from 'inquirer';
import { spinnies } from '@app/utis';

const program = new Command();
program.version(version);
console.log(`\nWelcome to ${chalk.magenta('create-nrd-app')}\n`);
program
    .arguments('<projectName>')
    .option('-n, --useNpm', 'Use npm to install dependencies')
    .action(async (projectName: string, { useNpm }: { useNpm: Boolean }) => {
        console.log(`Starting ${chalk.cyan('create-nrd-app')}...`);
        console.log(`Resolving ${chalk.cyan('server')}...`);
        console.log({ useNpm });
        await generateFolder(projectName);
        await generateFolder(`${projectName}/server`);
        await generateFolder(`${projectName}/server/src`);
        await generatePackageJson(projectName);
        const { dockerComposeFilesInJson }: { dockerComposeFilesInJson: Boolean } = await inquirer.prompt({
            type: 'list',
            message: 'Choose file type for docker-compose:',
            name: 'dockerComposeFilesInJson',
            choices: [
                { name: 'JSON', value: true },
                { name: 'YML', value: false },
            ],
        });
        await generateDockerCompose(projectName, 'production', dockerComposeFilesInJson);
        await generateDockerCompose(projectName, 'development', dockerComposeFilesInJson);
        await generateTsConfigJson(projectName);
        await generateServerPackageJson(projectName);
        spinnies.add('create-server-package-json', { text: 'Creating server/package.json' });
        spinnies.succeed('create-server-package-json', { text: 'server/package.json created!' });
        await generateServerIndex(projectName);
        await generateEslintConfig(projectName);
    });
program.parse(process.argv);
