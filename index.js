#!/usr/bin/env node

const program = require('commander');
const package = require('./package.json');
const chalk = require('chalk');
const figlet = require('figlet');
const ora = require('ora');

program.version(package.version);

console.log(chalk.cyan(figlet.textSync('create-nrd-app')));

program
    .arguments('<name>')
    .action((name) => {
        console.log(`Starting ${chalk.cyan('create-nrd-app')}...`)
        const spinner = ora({ text: `Loading...`, spinner: 'bouncingBar' }).start();
        setTimeout(() => {
            spinner.stop();
            console.log(`${chalk.green(`Project ${name} created!`)}`);
        }, 1000);
    })

program.parse(process.argv);