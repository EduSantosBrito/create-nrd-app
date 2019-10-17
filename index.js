#!/usr/bin/env node

const program = require('commander');
const package = require('./package.json');
const inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const ora = require('ora');
const fs = require('fs');

program.version(package.version);

console.log(chalk.cyan(figlet.textSync('create-nrd-app')));

program
    .arguments('<projectName>')
    .option('-n, --useNpm', 'Use npm to install dependencies')
    .action((projectName, options) => {
        console.log(`Starting ${chalk.cyan('create-nrd-app')}...`)
        const spinner = generateFolder(projectName);
        console.log(`Creating ${chalk.yellow('package.json')}...`);
        generatePackageJson(spinner, projectName);
        console.log(`Creating ${chalk.yellow('docker-compose.json')}...`)
        generateDockerComposeJson(spinner, projectName);
    })


function generateFolder(projectName) {
    const spinner = ora({ text: 'Creating project folder', spinner: 'bouncingBar' }).start();
    if (fs.existsSync(`${process.cwd()}/${projectName}`)) {
        spinner.fail(`Folder already exist, use another name! ${chalk.red('Aborting...')}`);
        process.exit(1);
    } else {
        fs.mkdirSync(`${process.cwd()}/${projectName}`);
        spinner.succeed(`Folder ${chalk.green(projectName)} created!`);
        return spinner;
    }
}

function generatePackageJson(spinner, projectName) {
    inquirer.prompt([
        {
            name: 'name',
            message: 'What is the project name?',
            default: projectName
        },
        {
            name: 'version',
            message: 'What is the project version?',
            default: '0.1.0'
        },
        {
            name: 'description',
            message: `Describe your project here ${chalk.yellow('(optional)')}:`,
            default: null
        },
        {
            name: 'author',
            message: `What is the project author? ${chalk.yellow('(optional)')}`,
            default: null
        },
        {
            name: 'license',
            message: `What is the project license? ${chalk.yellow('(optional)')}`,
            default: null
        }
    ]).then((values) => {
        spinner.render('Creating file...').start();
        fs.writeFile(`${process.cwd()}/${projectName}/package.json`, JSON.stringify(values, null, 2), function (err) {
            if (err)
                throw err;
            spinner.succeed(`${chalk.green('package.json')} created!`);
        });
    })
}

function generateDockerComposeJson(spinner, projectName) {
}

program.parse(process.argv);