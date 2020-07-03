import { PackageInfo, PackageVersion, PackageInfoParsed, RequiredPackages } from '@app/types';
import fetch from 'node-fetch';
import { lt } from 'semver';
import fs, { promises as fsPromise } from 'fs';
import { spinnies } from './utis';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { SpinnerOptions } from 'spinnies';
import jsonToYaml from 'json-to-pretty-yaml';
import { renderTemplateFile } from 'template-file';
import latestVersion from 'latest-version';
import spawnAsync from '@expo/spawn-async';

const serverPackages: RequiredPackages = {
    dependencies: [{ name: 'body-parser' }, { name: 'cors' }, { name: 'express' }, { name: 'compression' }],
    devDependencies: [
        { name: '@types/compression' },
        { name: '@types/express' },
        { name: '@types/jest' },
        { name: '@types/cors' },
        { name: '@types/node' },
        { name: '@types/supertest' },
        { name: '@typescript-eslint/eslint-plugin' },
        { name: '@typescript-eslint/parser' },
        { name: 'eslint' },
        { name: 'eslint-config-airbnb-base' },
        { name: 'eslint-config-prettier' },
        { name: 'eslint-plugin-import' },
        { name: 'eslint-plugin-prettier' },
        { name: 'husky' },
        { name: 'jest' },
        { name: 'lint-staged' },
        { name: 'nodemon' },
        { name: 'prettier' },
        { name: 'supertest' },
        { name: 'ts-jest' },
        { name: 'ts-node' },
        { name: 'typescript' },
    ],
};

function getLastPackageVersions(versions: PackageVersion[]): string[] {
    return Object.keys(versions)
        .filter((version) => /^([0-9]+)\.([0-9]+)\.([0-9]+)$/.test(version))
        .sort((a, b) => (lt(a, b) ? 1 : -1))
        .slice(0, 20);
}

async function getPackageVersions(packageName: string): Promise<PackageInfoParsed> {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`, {
        headers: {
            Accept: 'application/vnd.npm.install-v1+json',
        },
    });

    const { versions }: PackageInfo = await response.json();

    return {
        versions: getLastPackageVersions(versions),
    };
}

async function generateFolder(folderPath: string): Promise<SpinnerOptions> {
    spinnies.add('generate-folder', { text: `Creating ${folderPath}` });
    if (fs.existsSync(`${process.cwd()}/${folderPath}`)) {
        spinnies.fail('generate-folder', { text: 'Folder already exist, use another name! Aborting...' });
        return process.exit(1);
    }
    await fsPromise.mkdir(`${process.cwd()}/${folderPath}`);
    return spinnies.succeed('generate-folder', { text: `Folder ${folderPath} created!` });
}

async function generatePackageJson(projectName: string): Promise<SpinnerOptions> {
    const values = await inquirer.prompt([
        {
            name: 'name',
            message: 'What is the project name?',
            default: projectName,
        },
        {
            name: 'version',
            message: 'What is the project version?',
            default: '0.1.0',
        },
        {
            name: 'description',
            message: `Describe your project here ${chalk.yellow('(optional)')}:`,
            default: null,
        },
        {
            name: 'author',
            message: `What is the project author? ${chalk.yellow('(optional)')}`,
            default: null,
        },
        {
            name: 'license',
            message: 'What is the project license?',
            default: 'ISC',
        },
    ]);
    spinnies.add('create-package-json', { text: 'Creating package.json' });
    fsPromise.writeFile(`${process.cwd()}/${projectName}/package.json`, JSON.stringify(values, null, 2));
    return spinnies.succeed('create-package-json', { text: 'package.json created!' });
}

async function getDockerComposeData(projectName: string, environment: string, isProduction: boolean): Promise<string> {
    return renderTemplateFile(`${process.cwd()}/templates/docker-compose.template.mustache`, {
        projectName,
        environment,
        dockerfile: isProduction ? 'Dockerfile' : 'dev.Dockerfile',
        appPort: isProduction ? 80 : 3000,
        appContainerPort: isProduction ? '3000:80' : '3000:3000',
    });
}

async function generateDockerCompose(projectName: string, environment: string, dockerComposeFilesInJson: boolean): Promise<SpinnerOptions> {
    const isProduction = !(environment === 'development');

    spinnies.add(`create-${environment}-docker`, {
        text: `Creating docker-compose${!isProduction ? '.dev' : ''}${dockerComposeFilesInJson ? '.json' : '.yml'}`,
    });

    const fileData = await getDockerComposeData(projectName, environment, isProduction);

    await fsPromise.writeFile(
        `${process.cwd()}/${projectName}/docker-compose${!isProduction ? '.dev' : ''}${dockerComposeFilesInJson ? '.json' : '.yml'}`,
        dockerComposeFilesInJson ? fileData : jsonToYaml.stringify(JSON.parse(fileData)),
    );
    return spinnies.succeed(`create-${environment}-docker`, {
        text: `docker-compose${!isProduction ? '.dev' : ''}${dockerComposeFilesInJson ? '.json' : '.yml'} created!`,
    });
}

async function getTsConfigData(): Promise<string> {
    return renderTemplateFile(`${process.cwd()}/templates/tsconfig.template.mustache`);
}

async function generateTsConfigJson(projectName: string): Promise<SpinnerOptions> {
    spinnies.add('create-ts-config', { text: 'Creating server/tsconfig.json' });
    await fs.promises.writeFile(`${process.cwd()}/${projectName}/server/tsconfig.json`, await getTsConfigData());
    return spinnies.succeed('create-ts-config', { text: 'server/tsconfig.json created!' });
}

async function getDependenciesVersions() {
    const { wantToSelectVersions }: { wantToSelectVersions: boolean } = await inquirer.prompt({
        type: 'list',
        message: 'Do you want to select the dependencies versions? (Selecting no, the last version will be selected)',
        name: 'wantToSelectVersions',
        choices: [
            { name: 'Yes', value: true },
            { name: 'No', value: false },
        ],
    });
    if (!wantToSelectVersions) {
        return serverPackages.dependencies.reduce(async (promiseAccumulator, dependency) => {
            const accumulator = await promiseAccumulator;
            return { ...accumulator, [dependency.name]: await latestVersion(dependency.name) };
        }, Promise.resolve({}));
    }
    return serverPackages.dependencies.reduce(async (promiseAccumulator, dependency) => {
        const accumulator = await promiseAccumulator;
        const { selectedVersion }: { selectedVersion: string } = await inquirer.prompt({
            type: 'list',
            message: `Select version for ${chalk.green(dependency.name)}`,
            name: 'selectedVersion',
            choices: (await getPackageVersions(dependency.name)).versions.map((version) => ({ name: version, value: version })),
        });
        return { ...accumulator, [dependency.name]: selectedVersion };
    }, Promise.resolve({}));
}

async function getDevDependenciesVersions() {
    const { wantToSelectVersions }: { wantToSelectVersions: boolean } = await inquirer.prompt({
        type: 'list',
        message: 'Do you want to select the devDependencies versions? (Selecting no, the last version will be selected)',
        name: 'wantToSelectVersions',
        choices: [
            { name: 'Yes', value: true },
            { name: 'No', value: false },
        ],
    });
    if (!wantToSelectVersions) {
        return serverPackages.devDependencies.reduce(async (promiseAccumulator, dependency) => {
            const accumulator = await promiseAccumulator;
            return { ...accumulator, [dependency.name]: await latestVersion(dependency.name) };
        }, Promise.resolve({}));
    }
    return serverPackages.devDependencies.reduce(async (promiseAccumulator, dependency) => {
        const accumulator = await promiseAccumulator;
        const { selectedVersion }: { selectedVersion: string } = await inquirer.prompt({
            type: 'list',
            message: `Select version for ${chalk.green(dependency.name)}`,
            name: 'selectedVersion',
            choices: (await getPackageVersions(dependency.name)).versions.map((version) => ({ name: version, value: version })),
        });
        return { ...accumulator, [dependency.name]: selectedVersion };
    }, Promise.resolve({}));
}

async function getServerPackageJsonData(projectName: string): Promise<string> {
    return renderTemplateFile(`${process.cwd()}/templates/api.packageJson.template.mustache`, {
        projectName,
        dependencies: JSON.stringify(await getDependenciesVersions(), null, 2),
        devDependencies: JSON.stringify(await getDevDependenciesVersions(), null, 2),
    });
}

async function generateServerPackageJson(projectName: string): Promise<void> {
    return fs.promises.writeFile(`${process.cwd()}/${projectName}/server/package.json`, await getServerPackageJsonData(projectName));
}

async function getServerIndexExpress(): Promise<string> {
    return renderTemplateFile(`${process.cwd()}/templates/api.index.template.mustache`);
}

async function generateServerIndex(projectName: string): Promise<SpinnerOptions> {
    spinnies.add('create-index-server', { text: 'Creating server/src/server.ts' });
    await fs.promises.writeFile(`${process.cwd()}/${projectName}/server/src/server.ts`, await getServerIndexExpress());
    return spinnies.succeed('create-index-server', { text: 'server/src/server.ts created!' });
}

async function getEslintConfigData(): Promise<string> {
    return renderTemplateFile(`${process.cwd()}/templates/api.eslint.template.mustache`);
}

async function generateEslintConfig(projectName: string): Promise<SpinnerOptions> {
    spinnies.add('create-eslint-config', { text: 'Creating server/.eslintrc.json' });
    await fs.promises.writeFile(`${process.cwd()}/${projectName}/server/.eslintrc.json`, await getEslintConfigData());
    return spinnies.succeed('create-eslint-config', { text: 'server/.eslintrc.json created!' });
}

async function getPrettierConfigData(): Promise<string> {
    return renderTemplateFile(`${process.cwd()}/templates/api.prettier.template.mustache`);
}

async function generatePrettierConfig(projectName: string): Promise<SpinnerOptions> {
    spinnies.add('create-prettier-config', { text: 'Creating server/.prettierrc' });
    await fs.promises.writeFile(`${process.cwd()}/${projectName}/server/.prettierrc`, await getPrettierConfigData());
    return spinnies.succeed('create-prettier-config', { text: 'server/.prettierrc created!' });
}

async function getGlobalSetupJestData(): Promise<string> {
    return renderTemplateFile(`${process.cwd()}/templates/api.jest-setup.template.mustache`);
}

async function generateGlobalSetupJest(projectName: string): Promise<SpinnerOptions> {
    spinnies.add('create-setup-jest-config', { text: 'Creating server/global.setup.js' });
    await fs.promises.writeFile(`${process.cwd()}/${projectName}/server/global.setup.js`, await getGlobalSetupJestData());
    return spinnies.succeed('create-setup-jest-config', { text: 'server/global.setup.js created!' });
}

async function getGlobalTeardownJestData(): Promise<string> {
    return renderTemplateFile(`${process.cwd()}/templates/api.jest-teardown.template.mustache`);
}

async function generateGlobalTeardownJest(projectName: string): Promise<SpinnerOptions> {
    spinnies.add('create-teardown-jest-config', { text: 'Creating server/global.teardown.js' });
    await fs.promises.writeFile(`${process.cwd()}/${projectName}/server/global.teardown.js`, await getGlobalTeardownJestData());
    return spinnies.succeed('create-teardown-jest-config', { text: 'server/global.teardown.js created!' });
}

async function getDockerignoreData(): Promise<string> {
    return renderTemplateFile(`${process.cwd()}/templates/dockerignore.template.mustache`);
}

async function generateDockerIgnore(folderPath: string): Promise<SpinnerOptions> {
    spinnies.add(`create-${folderPath}-dockerignore`, { text: `Creating ${folderPath}` });
    await fs.promises.writeFile(`${process.cwd()}/${folderPath}`, await getDockerignoreData());
    return spinnies.succeed(`create-${folderPath}-dockerignore`, { text: `${folderPath} created!` });
}

async function getGitIgnoreData(): Promise<string> {
    return renderTemplateFile(`${process.cwd()}/templates/gitignore.template.mustache`);
}

async function generateGitIgnore(folderPath: string): Promise<SpinnerOptions> {
    spinnies.add(`create-${folderPath}-gitignore`, { text: `Creating ${folderPath}` });
    await fs.promises.writeFile(`${process.cwd()}/${folderPath}`, await getGitIgnoreData());
    return spinnies.succeed(`create-${folderPath}-gitignore`, { text: `${folderPath} created!` });
}

async function getDockerfileData(isProduction: boolean, isServer: boolean): Promise<string> {
    return renderTemplateFile(
        `${process.cwd()}/templates/${isServer ? 'api' : 'client'}.${isProduction ? 'Dockerfile' : 'devDockerfile'}.template.mustache`,
    );
}

async function generateDockerfile(projectName: string, environment: string, app: string): Promise<SpinnerOptions> {
    const isProduction = !(environment === 'development');
    const isServer = !!(app === 'server');
    const fileName = isProduction ? 'Dockerfile' : 'dev.Dockerfile';
    spinnies.add(`create-${app}-${environment}-dockerfile`, { text: `Creating ${app}/${fileName}` });
    await fs.promises.writeFile(`${process.cwd()}/${projectName}/${app}/${fileName}`, await getDockerfileData(isProduction, isServer));
    return spinnies.succeed(`create-${app}-${environment}-dockerfile`, { text: `${app}/${fileName} created!` });
}

async function installServerPackages(projectName: string, isNpm: boolean): Promise<SpinnerOptions> {
    spinnies.add('install-packages', { text: `Installing Server packages with ${chalk.yellow(isNpm ? 'npm' : 'yarn')}` });
    await spawnAsync('cd', [`./${projectName}/server`, '&&', isNpm ? 'npm' : 'yarn', 'install', '&&', 'cd', '../..'], { shell: true });
    return spinnies.succeed('install-packages', { text: 'Server packages installed' });
}

async function executeCreateReactApp(projectName: string, isNpm: boolean): Promise<SpinnerOptions | never> {
    spinnies.add('execute-create-react-app', {
        text: `Executing create-react-app with ${chalk.yellow(isNpm ? 'npx create-react-app' : 'yarn create react-app')}`,
    });
    try {
        await spawnAsync(
            'cd',
            [
                `./${projectName}`,
                '&&',
                `${isNpm ? 'npm init react-app client --use-npm' : 'yarn create react-app client'}`,
                '&&',
                'cd',
                '..',
            ],
            { shell: true },
        );
        return spinnies.succeed('execute-create-react-app', { text: 'create-react-app finished!' });
    } catch (error) {
        spinnies.fail('execute-create-react-app', { text: 'create-react-app failed! :( Aborting...' });
        return process.exit(1);
    }
}

async function getNginxConfigFileData(projectName: string): Promise<string> {
    return renderTemplateFile(`${process.cwd()}/templates/client.nginxconf.template.mustache`, { projectName });
}

async function generateNginxConfigFile(projectName: string): Promise<SpinnerOptions> {
    spinnies.add('create-client-nginx-config-file', { text: 'Creating client/conf/conf.d/default.conf' });
    await fs.promises.writeFile(
        `${process.cwd()}/${projectName}/client/conf/conf.d/default.conf`,
        await getNginxConfigFileData(projectName),
    );
    return spinnies.succeed('create-client-nginx-config-file', { text: 'client/conf/conf.d/default.conf created!' });
}

export {
    getPackageVersions,
    generateFolder,
    generatePackageJson,
    generateDockerCompose,
    generateTsConfigJson,
    generateServerIndex,
    generateServerPackageJson,
    generateEslintConfig,
    generatePrettierConfig,
    generateGlobalSetupJest,
    generateGlobalTeardownJest,
    generateDockerIgnore,
    generateGitIgnore,
    generateDockerfile,
    installServerPackages,
    executeCreateReactApp,
    generateNginxConfigFile,
};
