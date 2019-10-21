#!/usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const ora = require('ora');
const fs = require('fs');
const spawnAsync = require('@expo/spawn-async');
const packageJSON = require('./package.json');
const {
    getDockerComposeJson,
    getTsConfig,
    getServerPackageJson,
    getServerIndexExpress,
    getServerProdDockerFile,
    getServerDevDockerFile,
} = require('./functions');

program.version(packageJSON.version);

console.log(chalk.cyan(figlet.textSync('create-nrd-app')));
const spinner = ora({ spinner: 'bouncingBar' });

async function generateFolder(folderPath) {
    spinner.render(`Creating ${folderPath}`);
    if (fs.existsSync(`${process.cwd()}/${folderPath}`)) {
        spinner.fail(`Folder already exist, use another name! ${chalk.red('Aborting...')}`);
        return process.exit(1);
    }
    fs.mkdirSync(`${process.cwd()}/${folderPath}`);
    return spinner.succeed(`Folder ${chalk.green(folderPath)} created!`);
}

async function generatePackageJson(projectName) {
    return inquirer.prompt([
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
    ]).then((values) => {
        spinner.render('Creating package.json');
        fs.writeFile(`${process.cwd()}/${projectName}/package.json`, JSON.stringify(values, null, 2), (err) => {
            if (err) {
                throw err;
            }
            spinner.succeed(`${chalk.green('package.json')} created!`);
        });
    });
}

async function generateDockerComposeProdJson(projectName) {
    spinner.render('Creating docker-compose.json');
    return fs.writeFile(`${process.cwd()}/${projectName}/docker-compose.json`, JSON.stringify(getDockerComposeJson(projectName, 'production'), null, 2), (err) => {
        if (err) {
            throw err;
        }
        spinner.succeed(`${chalk.green('docker-compose.json')} created!`);
    });
}

async function generateDockerComposeDevJson(projectName) {
    spinner.render('Creating docker-compose.dev.json');
    return fs.writeFile(`${process.cwd()}/${projectName}/docker-compose.dev.json`, JSON.stringify(getDockerComposeJson(projectName, 'development'), null, 2), (err) => {
        if (err) {
            throw err;
        }
        spinner.succeed(`${chalk.green('docker-compose.dev.json')} created!`);
    });
}

async function generateTsConfigJson(projectName) {
    spinner.render('Creating server/tsconfig.json');
    return fs.writeFile(`${process.cwd()}/${projectName}/server/tsconfig.json`, JSON.stringify(getTsConfig(), null, 2), (err) => {
        if (err) {
            throw err;
        }
        spinner.succeed(`${chalk.green('server/tsconfig.json')} created!`);
    });
}

async function generateServerPackageJson(projectName, isNpm) {
    return fs.writeFile(`${process.cwd()}/${projectName}/server/package.json`, JSON.stringify(getServerPackageJson(projectName), null, 2), async (err) => {
        if (err) {
            throw err;
        }
        spinner.succeed(`${chalk.green('server/package.json')} created!`);
        const packageInstallProcessAsync = spawnAsync(`cd ./${projectName}/server && ${isNpm ? 'npm' : 'yarn'} install && cd ../..`, { shell: true });
        packageInstallProcessAsync.child.stdout.on('data', (data) => {
            console.log(data.toString());
        });
    });
}

async function generateIndexServer(projectName) {
    spinner.render('Creating server/index.ts');
    await fs.writeFile(`${process.cwd()}/${projectName}/server/src/index.ts`, getServerIndexExpress(), (err) => {
        if (err) {
            throw err;
        }
        spinner.succeed(`${chalk.green('server/src/index.ts')} created!`);
    });
}

async function generateServerProdDockerFile(projectName) {
    spinner.render('Creating server/Dockerfile');
    await fs.writeFile(`${process.cwd()}/${projectName}/server/Dockerfile`, getServerProdDockerFile(), (err) => {
        if (err) {
            throw err;
        }
        spinner.succeed(`${chalk.green('server/Dockerfile')} created!`);
    });
}

async function generateServerDevDockerFile(projectName) {
    spinner.render('Creating server/dev.Dockerfile');
    await fs.writeFile(`${process.cwd()}/${projectName}/server/dev.Dockerfile`, getServerDevDockerFile(), (err) => {
        if (err) {
            throw err;
        }
        spinner.succeed(`${chalk.green('server/dev.Dockerfile')} created!`);
    });
}

program
    .arguments('<projectName>')
    .option('-n, --useNpm', 'Use npm to install dependencies')
    .action(async (projectName, options) => {
        console.log(`Starting ${chalk.cyan('create-nrd-app')}...`);
        await generateFolder(projectName);
        await generateFolder(`${projectName}/server`);
        await generateFolder(`${projectName}/server/src`);
        await generateFolder(`${projectName}/client`);
        await generatePackageJson(projectName);
        await generateDockerComposeProdJson(projectName);
        await generateDockerComposeDevJson(projectName);
        await generateTsConfigJson(projectName);
        await generateServerPackageJson(projectName, options.useNpm);
        await generateIndexServer(projectName);
        await generateServerDevDockerFile(projectName);
        await generateServerProdDockerFile(projectName);
    });

program.parse(process.argv);
