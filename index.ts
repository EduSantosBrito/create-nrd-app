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
    generatePrettierConfig,
    generateGlobalSetupJest,
    generateGlobalTeardownJest,
    generateDockerIgnore,
    generateGitIgnore,
    installServerPackages,
    executeCreateReactApp,
    generateNginxConfigFile,
    generateDockerfile,
} from '@app/functions';
import inquirer from 'inquirer';
import { spinnies } from '@app/utis';

const program = new Command();
program.version(version);
console.log(`\nWelcome to ${chalk.magenta('create-nrd-app')}\n`);
program
    .arguments('<projectName>')
    .option('-n, --useNpm', 'Use npm to install dependencies')
    .action(async (projectName: string, { useNpm }: { useNpm: boolean }) => {
        console.log(`Starting ${chalk.cyan('create-nrd-app')}...`);
        console.log(`Resolving ${chalk.cyan('server')}...`);
        await generateFolder(projectName);
        await generateFolder(`${projectName}/server`);
        await generateFolder(`${projectName}/server/src`);
        await generatePackageJson(projectName);
        const { dockerComposeFilesInJson }: { dockerComposeFilesInJson: boolean } = await inquirer.prompt({
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
        await generatePrettierConfig(projectName);
        await generateGlobalSetupJest(projectName);
        await generateGlobalTeardownJest(projectName);
        await generateDockerIgnore(`${projectName}/server/.dockerignore`);
        await generateGitIgnore(`${projectName}/server/.gitignore`);
        await generateDockerfile(projectName, 'production', 'server');
        await generateDockerfile(projectName, 'development', 'server');
        await installServerPackages(projectName, useNpm);
        console.log(`Resolving ${chalk.cyan('client')}...`);
        await executeCreateReactApp(projectName, useNpm);
        await generateFolder(`${projectName}/client/conf`);
        await generateFolder(`${projectName}/client/conf/conf.d`);
        await generateNginxConfigFile(projectName);
        await generateDockerIgnore(`${projectName}/client/.dockerignore`);
        await generateDockerfile(projectName, 'production', 'client');
        await generateDockerfile(projectName, 'development', 'client');
    });
program.parse(process.argv);
