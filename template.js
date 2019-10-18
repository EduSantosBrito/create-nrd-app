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
        devDependencies: {
            typescript: '^3.6.2',
            '@types/express': '^4.17.1',
        },
        dependencies: {
            '@typegoose/typegoose': '^5.9.1',
            '@types/cors': '^2.8.6',
            '@types/mongoose': '^5.5.17',
            '@types/node': '^12.7.4',
            'body-parser': '^1.19.0',
            cors: '^2.8.5',
            express: '^4.17.1',
            mongoose: '^5.6.13',
        },
    };
}

module.exports = { getDockerComposeJson, getTsConfig, getServerPackageJson };
