#!/usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const ora = require('ora');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const packageJSON = require('./package.json');
const { getDockerComposeJson, getTsConfig, getServerPackageJson } = require('./template');

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
            message: `What is the project license? ${chalk.yellow('(optional)')}`,
            default: null,
        },
    ]).then((values) => {
        spinner.render('Creating package.json');
        fs.writeFile(`${process.cwd()}/${projectName}/package.json`, JSON.stringify(values, null, 2), (err) => {
            if (err) { throw err; }
            spinner.succeed(`${chalk.green('package.json')} created!`);
        });
    });
}

async function generateDockerComposeProdJson(projectName) {
    spinner.render('Creating docker-compose.json');
    return fs.writeFile(`${process.cwd()}/${projectName}/docker-compose.json`, JSON.stringify(getDockerComposeJson(projectName, 'production'), null, 2), (err) => {
        if (err) { throw err; }
        spinner.succeed(`${chalk.green('docker-compose.json')} created!`);
    });
}

async function generateDockerComposeDevJson(projectName) {
    spinner.render('Creating docker-compose.dev.json');
    return fs.writeFile(`${process.cwd()}/${projectName}/docker-compose.dev.json`, JSON.stringify(getDockerComposeJson(projectName, 'development'), null, 2), (err) => {
        if (err) { throw err; }
        spinner.succeed(`${chalk.green('docker-compose.dev.json')} created!`);
    });
}

async function generateTsConfigJson(projectName) {
    spinner.render('Creating server/tsconfig.json');
    return fs.writeFile(`${process.cwd()}/${projectName}/server/tsconfig.json`, JSON.stringify(getTsConfig(), null, 2), (err) => {
        if (err) { throw err; }
        spinner.succeed(`${chalk.green('server/tsconfig.json')} created!`);
    });
}

async function generateServerPackageJson(projectName, isNpm) {
    return fs.writeFile(`${process.cwd()}/${projectName}/server/package.json`, JSON.stringify(getServerPackageJson(projectName), null, 2), (err) => {
        if (err) { throw err; }
        spinner.succeed(`${chalk.green('server/package.json')} created!`);
        if (isNpm) {
            exec(`cd ./${projectName}/server && npm install && cd ../..`, (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                }
            });
        } else {
            exec(`cd ./${projectName}/server && yarn && cd ../..`, (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(stdout);
                }
            });
        }
    });
}

program
    .arguments('<projectName>')
    .option('-n, --useNpm', 'Use npm to install dependencies')
    .action(async (projectName, options) => {
        console.log(`Starting ${chalk.cyan('create-nrd-app')}...`);
        await generateFolder(projectName);
        await generateFolder(`${projectName}/server`);
        await generateFolder(`${projectName}/client`);
        await generatePackageJson(projectName);
        await generateDockerComposeProdJson(projectName);
        await generateDockerComposeDevJson(projectName);
        await generateTsConfigJson(projectName);
        await generateServerPackageJson(projectName, options.useNpm);
    });

program.parse(process.argv);
