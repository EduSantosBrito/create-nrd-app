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
                ports: [
                    isProduction(env) ? '50100:80' : '50200:3000',
                ],
                depends_on: [
                    `${projectName}-${env}-server`,
                ],
                networks: [
                    `${projectName}-${env}-network`,
                ],
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
                    MONGODB_PORT: 27017,
                    MONGODB_HOST: `${projectName}-${env}-mongo`,
                    MONGODB_DATABASE: `${projectName}-${env}-database`,
                },
                ports: [
                    isProduction(env) ? '50110:3001' : '50210:3001',
                ],
                depends_on: [
                    `${projectName}-${env}-mongo`,
                ],
                networks: [
                    `${projectName}-${env}-network`,
                ],
            },
            [`${projectName}-${env}-mongo`]: {
                container_name: `${projectName}-${env}-mongo`,
                image: 'mongo',
                restart: 'always',
                environment: {
                    MONGODB_PORT: 27017,
                    MONGODB_HOST: '0.0.0.0',
                },
                volumes: [
                    './data:/data/db',
                ],
                ports: [
                    isProduction(env) ? '50120:27017' : '50220:27017',
                ],
                networks: [
                    `${projectName}-${env}-network`,
                ],
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
            module: 'commonjs',
            esModuleInterop: true,
            target: 'es6',
            noImplicitAny: true,
            moduleResolution: 'node',
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            sourceMap: true,
            outDir: 'dist',
            baseUrl: '.',
            paths: {
                '*': [
                    'node_modules/*',
                ],
            },
        },
        include: [
            'src/**/*',
        ],
    };
}

function getServerPackageJson(projectName) {
    return {
        name: `${projectName}-server`,
        version: '0.1.0',
        main: 'dist/index.js',
        scripts: {
            build: 'tsc',
        },
        license: 'ISC',
        devDependencies: {
            typescript: '^3.6.2',
            '@types/express': '^4.17.1',
            '@types/cors': '^2.8.6',
            '@types/mongoose': '^5.5.17',
            '@types/node': '^12.7.4',
        },
        dependencies: {
            '@typegoose/typegoose': '^5.9.1',
            'body-parser': '^1.19.0',
            cors: '^2.8.5',
            express: '^4.17.1',
            mongoose: '^5.6.13',
        },
    };
}

function getServerIndexExpress() {
    return `
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

const {
    MONGODB_DATABASE,
    MONGODB_HOST,
    MONGODB_PORT,
} = process.env;

const app = express();

app.use(cors());
app.use(bodyParser.json());

const mongoURI = \`mongodb://\${MONGODB_HOST}:\${MONGODB_PORT}/\${MONGODB_DATABASE}\`;
mongoose.connect(mongoURI, { useNewUrlParser: true });

app.get('/', (req, res) => res.send('Hello World'));

app.listen(process.env.NODE_PORT || 3000);
`;
}

function getServerProdDockerfile() {
    return `FROM node:12.8-slim

# Create app directory
WORKDIR /usr/src/server


# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . . 

RUN npm run build

EXPOSE 3001

CMD [ "node", "./dist/index.js" ]`;
}

function getServerDevDockerfile() {
    return `FROM node:12.8-slim
# Create app directory
WORKDIR /usr/src/server


# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

RUN npm install -g nodemon ts-node

EXPOSE 3001

CMD ["nodemon", "./src/index.ts"]`;
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
    return `FROM node:12.8-slim as build

WORKDIR /usr/src/app

COPY package.json .

COPY . .

ENV PATH /usr/src/app/node_modules/.bin:$PATH

RUN npm install
RUN npm run build --production

FROM nginx:1.17.3-alpine

RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx

COPY --from=build /usr/src/app/build /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]`;
}

function getClientDevDockerfile() {
    return `FROM node:12.8-slim
WORKDIR /usr/src/app
COPY package.json .
ENV PATH /usr/src/app/node_modules/.bin:$PATH

RUN npm install --silent
RUN npm install react-scripts@3.0.1 -g --silent
EXPOSE 3000
CMD ["npm", "start"]`;
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
};
