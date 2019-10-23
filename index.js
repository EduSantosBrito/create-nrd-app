#!/usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const Spinnies = require('spinnies');
const fs = require('fs');
const spawnAsync = require('@expo/spawn-async');
const packageJSON = require('./package.json');
const {
    getDockerComposeJson,
    getTsConfig,
    getServerPackageJson,
    getServerIndexExpress,
    getServerProdDockerfile,
    getServerDevDockerfile,
    getDockerignore,
    getNginxConfigFile,
    getGitignore,
    getClientProdDockerfile,
    getClientDevDockerfile,
} = require('./functions');

program.version(packageJSON.version);

console.log(chalk.cyan(figlet.textSync('create-nrd-app')));
const bouncingBarEffect = {
    interval: 80,
    frames: [
        '[    ]',
        '[=   ]',
        '[==  ]',
        '[=== ]',
        '[ ===]',
        '[  ==]',
        '[   =]',
        '[    ]',
        '[   =]',
        '[  ==]',
        '[ ===]',
        '[====]',
        '[=== ]',
        '[==  ]',
        '[=   ]',
    ],
};
const spinnies = new Spinnies({
    spinner: bouncingBarEffect,
});

async function generateFolder(folderPath) {
    spinnies.add('generate-folder', { text: `Creating ${folderPath}` });
    if (fs.existsSync(`${process.cwd()}/${folderPath}`)) {
        spinnies.fail('generate-folder', { text: 'Folder already exist, use another name! Aborting...' });
        return process.exit(1);
    }
    fs.mkdirSync(`${process.cwd()}/${folderPath}`);
    return spinnies.succeed('generate-folder', { text: `Folder ${folderPath} created!` });
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
        spinnies.add('create-package-json', { text: 'Creating package.json' });
        fs.writeFile(`${process.cwd()}/${projectName}/package.json`, JSON.stringify(values, null, 2), (err) => {
            if (err) {
                throw err;
            }
            spinnies.succeed('create-package-json', { text: 'package.json created!' });
        });
    });
}

async function generateDockerComposeProdJson(projectName) {
    spinnies.add('create-prod-docker', { text: 'Creating docker-compose.json' });
    return fs.writeFile(`${process.cwd()}/${projectName}/docker-compose.json`, JSON.stringify(getDockerComposeJson(projectName, 'production'), null, 2), (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed('create-prod-docker', { text: 'docker-compose.json created!' });
    });
}

async function generateDockerComposeDevJson(projectName) {
    spinnies.add('create-dev-docker', { text: 'Creating docker-compose.dev.json' });
    return fs.writeFile(`${process.cwd()}/${projectName}/docker-compose.dev.json`, JSON.stringify(getDockerComposeJson(projectName, 'development'), null, 2), (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed('create-dev-docker', { text: 'docker-compose.dev.json created!' });
    });
}

async function generateTsConfigJson(projectName) {
    spinnies.add('create-ts-config', { text: 'Creating server/tsconfig.json' });
    return fs.writeFile(`${process.cwd()}/${projectName}/server/tsconfig.json`, JSON.stringify(getTsConfig(), null, 2), (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed('create-ts-config', { text: 'server/tsconfig.json created!' });
    });
}

async function generateServerPackageJson(projectName) {
    spinnies.add('create-server-package-json', { text: 'Creating server/package.json' });
    return fs.writeFile(`${process.cwd()}/${projectName}/server/package.json`, JSON.stringify(getServerPackageJson(projectName), null, 2), async (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed('create-server-package-json', { text: 'server/package.json created!' });
    });
}

async function generateServerIndex(projectName) {
    spinnies.add('create-index-server', { text: 'Creating server/index.ts' });
    await fs.writeFile(`${process.cwd()}/${projectName}/server/src/index.ts`, getServerIndexExpress(), (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed('create-index-server', { text: 'server/src/index.ts created!' });
    });
}

async function generateServerProdDockerfile(projectName) {
    spinnies.add('create-server-prod-dockerfile', { text: 'Creating server/Dockerfile' });
    await fs.writeFile(`${process.cwd()}/${projectName}/server/Dockerfile`, getServerProdDockerfile(), (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed('create-server-prod-dockerfile', { text: 'server/Dockerfile created!' });
    });
}

async function generateServerDevDockerfile(projectName) {
    spinnies.add('create-server-dev-dockerfile', { text: 'Creating server/dev.Dockerfile' });
    await fs.writeFile(`${process.cwd()}/${projectName}/server/dev.Dockerfile`, getServerDevDockerfile(), (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed('create-server-dev-dockerfile', { text: 'server/dev.Dockerfile created!' });
    });
}

async function generateClientProdDockerfile(projectName) {
    spinnies.add('create-client-prod-dockerfile', { text: 'Creating client/Dockerfile' });
    await fs.writeFile(`${process.cwd()}/${projectName}/client/Dockerfile`, getClientProdDockerfile(), (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed('create-client-prod-dockerfile', { text: 'client/Dockerfile created!' });
    });
}

async function generateClientDevDockerfile(projectName) {
    spinnies.add('create-client-dev-dockerfile', { text: 'Creating client/dev.Dockerfile' });
    await fs.writeFile(`${process.cwd()}/${projectName}/client/dev.Dockerfile`, getClientDevDockerfile(), (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed('create-client-dev-dockerfile', { text: 'client/dev.Dockerfile created!' });
    });
}


async function generateDockerIgnore(folderPath) {
    spinnies.add(`create-${folderPath}-dockerignore`, { text: `Creating ${folderPath}` });
    await fs.writeFile(`${process.cwd()}/${folderPath}`, getDockerignore(), (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed(`create-${folderPath}-dockerignore`, { text: `${folderPath} created!` });
    });
}

async function generateGitignore(folderPath) {
    spinnies.add(`create-${folderPath}-gitignore`, { text: `Creating ${folderPath}` });
    await fs.writeFile(`${process.cwd()}/${folderPath}`, getGitignore(), (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed(`create-${folderPath}-gitignore`, { text: `${folderPath} created!` });
    });
}

async function installServerPackages(projectName, isNpm) {
    spinnies.add('install-packages', { text: `Installing Server packages with ${chalk.yellow(isNpm ? 'npm' : 'yarn')}` });
    await spawnAsync(`cd ./${projectName}/server && ${isNpm ? 'npm' : 'yarn'} install && cd ../..`, { shell: true });
    spinnies.succeed('install-packages', { text: 'Server packages installed' });
}

async function generateNginxConfigFile(projectName) {
    spinnies.add('create-client-nginx-config-file', { text: 'Creating client/conf/conf.d/default.conf' });
    await fs.writeFile(`${process.cwd()}/${projectName}/client/conf/conf.d/default.conf`, getNginxConfigFile(projectName), (err) => {
        if (err) {
            throw err;
        }
        spinnies.succeed('create-client-nginx-config-file', { text: 'client/conf/conf.d/default.conf created!' });
    });
}


async function executeCreateReactApp(projectName, isNpm) {
    spinnies.add('execute-create-react-app', { text: `Executing create-react-app with ${chalk.yellow(isNpm ? 'npx create-react-app' : 'yarn create react-app')}` });
    try {
        await spawnAsync(`cd ./${projectName} && ${isNpm ? 'npx create-react-app' : 'yarn create react-app'} client && cd ..`, { shell: true });
        spinnies.succeed('execute-create-react-app', { text: 'create-react-app finished!' });
    } catch (error) {
        console.error(error.stdout);
        spinnies.fail('execute-create-react-app', { text: 'create-react-app failed! :(' });
        process.exit(1);
    }
}

program
    .arguments('<projectName>')
    .option('-n, --useNpm', 'Use npm to install dependencies')
    .action(async (projectName, options) => {
        console.log(`Starting ${chalk.cyan('create-nrd-app')}...`);
        console.log(`Resolving ${chalk.cyan('server')}...`);
        await generateFolder(projectName);
        await generateFolder(`${projectName}/server`);
        await generateFolder(`${projectName}/server/src`);
        await generatePackageJson(projectName);
        await generateDockerComposeProdJson(projectName);
        await generateDockerComposeDevJson(projectName);
        await generateTsConfigJson(projectName);
        await generateServerPackageJson(projectName);
        await generateServerIndex(projectName);
        await generateDockerIgnore(`${projectName}/server/.dockerignore`);
        await generateGitignore(`${projectName}/server/.gitignore`);
        await generateServerDevDockerfile(projectName);
        await generateServerProdDockerfile(projectName);
        await installServerPackages(projectName, options.useNpm);
        console.log(`Resolving ${chalk.cyan('client')}...`);
        await executeCreateReactApp(projectName, options.useNpm);
        await generateFolder(`${projectName}/client/conf`);
        await generateFolder(`${projectName}/client/conf/conf.d`);
        await generateNginxConfigFile(projectName);
        await generateDockerIgnore(`${projectName}/client/.dockerignore`);
        await generateClientProdDockerfile(projectName);
        await generateClientDevDockerfile(projectName);
    });

program.parse(process.argv);
