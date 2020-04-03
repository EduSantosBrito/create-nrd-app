function isProduction(env) {
    return env === 'production';
}

function getDockerComposeJson(projectName, env) {
    return {
        version: '3',
        services: {
            [`${projectName}-${env}-client`]: {
                container_name: `${projectName}-${env}-client`,
                build: {
                    context: './client',
                    dockerfile: isProduction(env) ? 'Dockerfile' : 'dev.Dockerfile',
                },
                restart: 'always',
                environment: {
                    NODE_ENV: env,
                    REACT_APP_PORT: isProduction(env) ? 80 : 3000,
                    REACT_APP_HOST: '0.0.0.0',
                    REACT_APP_API_HOST: '0.0.0.0',
                    REACT_APP_API_PORT: 3001,
                },
                ports: [isProduction(env) ? '3000:80' : '3000:3000'],
                depends_on: [`${projectName}-${env}-server`],
                networks: [`${projectName}-${env}-network`],
            },
            [`${projectName}-${env}-server`]: {
                container_name: `${projectName}-${env}-server`,
                build: {
                    context: './server',
                    dockerfile: isProduction(env) ? 'Dockerfile' : 'dev.Dockerfile',
                },
                restart: 'always',
                environment: {
                    NODE_ENV: env,
                    NODE_PORT: 3001,
                    NODE_HOST: '0.0.0.0',
                },
                ports: ['3001:3001'],
                networks: [`${projectName}-${env}-network`],
            },
        },
        networks: {
            [`${projectName}-${env}-network`]: {
                driver: 'bridge',
            },
        },
    };
}

function getTsConfig() {
    return {
        compilerOptions: {
            incremental: true,
            target: 'ES2020',
            module: 'commonjs',
            outDir: 'dist',
            removeComments: true,
            strict: true,
            esModuleInterop: true,
            forceConsistentCasingInFileNames: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', '**/*.test.ts', '**/*.spec.ts'],
    };
}

function getServerPackageJson(projectName) {
    return {
        name: `${projectName}-server`,
        version: '0.1.0',
        main: 'dist/server.js',
        license: 'MIT',
        husky: {
            hooks: {
                'pre-commit': 'tsc && lint-staged && yarn test',
            },
        },
        'lint-staged': {
            '*.{js,ts}': ['eslint --fix'],
        },
        jest: {
            testEnvironment: 'node',
            coveragePathIgnorePatterns: ['./node_modules/', './dist'],
            collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
            globalSetup: './global.setup.js',
            globalTeardown: './global.teardown.js',
        },
        scripts: {
            'build:dev': "nodemon --watch 'dist/**/*'",
            watch: 'tsc --watch',
            dev: 'yarn run watch & yarn run build:dev',
            build: 'tsc',
            lint: "tsc && eslint '*/**/*.{js,ts}' --quiet --fix",
            start: 'node ./dist/server.js',
            test: 'tsc && jest',
        },
        dependencies: {
            'body-parser': '^1.19.0',
            cors: '^2.8.5',
            express: '^4.17.1',
            compression: '^1.7.4',
        },
        devDependencies: {
            '@types/compression': '^1.7.0',
            '@types/express': '^4.17.3',
            '@types/jest': '^25.1.4',
            '@types/node': '^13.9.1',
            '@types/supertest': '^2.0.8',
            '@typescript-eslint/eslint-plugin': '^2.19.0',
            '@typescript-eslint/parser': '^2.19.0',
            eslint: '^6.8.0',
            'eslint-config-airbnb-base': '^14.1.0',
            'eslint-config-prettier': '^6.10.0',
            'eslint-plugin-import': '^2.20.1',
            'eslint-plugin-prettier': '^3.1.2',
            husky: '^4.2.3',
            jest: '^25.1.0',
            'lint-staged': '^10.0.8',
            nodemon: '^2.0.2',
            prettier: '^1.19.1',
            supertest: '^4.0.2',
            'ts-jest': '^25.2.1',
            'ts-node': '^8.6.2',
            typescript: '^3.8.3',
        },
    };
}

function getServerIndexExpress() {
    return `
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req: Request, res: Response) => res.send('Hello World'));

app.listen(process.env.NODE_PORT || 3000);
`;
}

function getServerProdDockerfile() {
    return `FROM node:13.12-slim

    WORKDIR /usr/src/app

    COPY . .
    
    RUN yarn add -D typescript
    
    RUN yarn build
    
    RUN yarn --network-timeout 1000000
    
    EXPOSE 3000
    
    CMD [ "yarn", "start" ]`;
}

function getServerDevDockerfile() {
    return `FROM node:13.12-slim

WORKDIR /usr/src/app

COPY . .

RUN yarn

EXPOSE 3001

CMD [ "yarn", "run", "dev" ]`;
}

function getDockerignore() {
    return `
Dockerfile
.dockerignore
.gitignore
README.md

build
node_modules`;
}

function getNginxConfigFile(projectName) {
    return `
server {
    listen 80;
    server_name ${projectName};

    location / {
    root   /usr/share/nginx/html;
    index  index.html index.htm;
    try_files $uri $uri/ /index.html;
    }
}`;
}

function getGitignore() {
    return `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*`;
}

function getClientProdDockerfile() {
    return `FROM node:13.12-slim as build

WORKDIR /usr/src/app

COPY . .

RUN yarn
RUN yarn run build --production

FROM nginx:1.17.9-alpine

RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx

COPY --from=build /usr/src/app/build /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]`;
}

function getClientDevDockerfile() {
    return `FROM node:13.12-slim

            WORKDIR /usr/src/app

            COPY . .
            
            RUN yarn --network-timeout 1000000
            
            EXPOSE 3000
            
            CMD ["yarn", "start"]`;
}

function getPrettierConfig() {
    return {
        printWidth: 140,
        singleQuote: true,
        jsxSingleQuote: true,
        useTabs: false,
        tabWidth: 4,
        trailingComma: 'all',
        semi: true,
    };
}

function getEslintConfig() {
    return {
        env: {
            es6: true,
            node: true,
            jest: true,
        },
        extends: [
            'airbnb-base',
            'prettier/@typescript-eslint',
            'plugin:prettier/recommended',
            'plugin:import/errors',
            'plugin:import/warnings',
            'plugin:import/typescript',
        ],
        parser: '@typescript-eslint/parser',
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.jsx', '.ts', '.tsx'],
                    moduleDirectory: ['node_modules', 'src/'],
                },
            },
        },
        parserOptions: {
            ecmaVersion: 2018,
            sourceType: 'module',
        },
        plugins: ['@typescript-eslint', 'prettier'],
        rules: {
            'prettier/prettier': ['error'],
            'no-underscore-dangle': 'off',
            strict: ['error', 'global'],
            'class-methods-use-this': 'off',
            'object-curly-newline': [
                'error',
                {
                    multiline: true,
                },
            ],
            'global-require': 'off',
            'arrow-parens': ['error', 'as-needed'],
            'no-param-reassign': [
                'error',
                {
                    props: false,
                },
            ],
            'no-unused-vars': 'off',
            'import/extensions': [
                'error',
                'ignorePackages',
                {
                    js: 'never',
                    ts: 'never',
                },
            ],
        },
    };
}

module.exports = {
    getDockerComposeJson,
    getTsConfig,
    getServerPackageJson,
    getServerIndexExpress,
    getServerProdDockerfile,
    getServerDevDockerfile,
    getDockerignore,
    getNginxConfigFile,
    getGitignore,
    getClientDevDockerfile,
    getClientProdDockerfile,
    getPrettierConfig,
    getEslintConfig,
};
