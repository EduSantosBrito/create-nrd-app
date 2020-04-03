# Create Node-React-Docker App 
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg)](https://github.com/EduSantosBrito/create-nrd-app/pulls)

Create Node-React-Docker apps easily.

- [Creating an App](#creating-an-app) – How to create a new app.

Create Nrd App works on macOS and Linux.<br>
This repository uses [create-react-app](https://github.com/facebook/create-react-app) to build client app.<br>
This repository is based on [create-react-app](https://github.com/facebook/create-react-app) idea, thank you guys ❤️<br>
If something doesn’t work, please [file an issue](https://github.com/EduSantosBrito/create-nrd-app/issues/new).<br>

## Quick Overview

```sh
npx create-nrd-app my-app
cd my-app
docker-compose -f docker-compose.yml up --build
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher)_

Then open:<br>
[http://localhost:3000/](http://localhost:3000/) to see your app.<br>
[http://localhost:3001/](http://localhost:3001/) to see your server.<br>

### Get Started Immediately

You **don’t** need to install or configure tools like Webpack or Babel.<br>
They are preconfigured and hidden so that you can focus on the code.

Just create a project, and you’re good to go.

## Creating an App

**You’ll need to have Node 8.16.0 or Node 10.16.0 or later version on your local development machine** (but it’s not required on the server). You can use [nvm](https://github.com/creationix/nvm#installation) (macOS/Linux) to easily switch Node versions between different projects.

To create a new app, you may choose one of the following methods:

### npx

```sh
npx create-nrd-app my-app
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) is a package runner tool that comes with npm 5.2+ and higher)_

### npm

```sh
npm init nrd-app my-app
```

_`npm init <initializer>` is available in npm 6+_

### Yarn

```sh
yarn create nrd-app my-app
```

_`yarn create` is available in Yarn 0.25+_

It will create a directory called `my-app` inside the current folder.<br>
Inside that directory, it will generate the initial project structure and install the transitive dependencies:

```
my-app
├── docker-compose.dev.yml
├── docker-compose.yml
├── package.json
├── server
│   ├── .gitignore
│   ├── .dockerignore
│   ├── .prettierrc
│   ├── .eslintrc.json
│   ├── node_modules
│   ├── package.json
│   ├── tsconfig.json
│   ├── dev.Dockerfile
│   ├── Dockerfile
│   ├── server.ts
└── client
    ├── conf
    │   └── conf.d
    │      └── default.conf
    ├── README.md
    ├── node_modules
    ├── package.json
    ├── .gitignore
    ├── .dockerignore
    ├── dev.Dockerfile
    ├── Dockerfile
    ├── public
    │   ├── favicon.ico
    │   ├── index.html
    │   └── manifest.json
    └── src
        ├── App.css
        ├── App.js
        ├── App.test.js
        ├── index.css
        ├── index.js
        ├── logo.svg
        └── serviceWorker.js
```

Once the installation is done, you can open your project folder:

```sh
cd my-app
```

Inside the newly created project, you can run some built-in commands:

### `docker-compose -f docker-compose.dev.yml up --build`

Runs the app in development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view your app it in the browser.<br>
Open [http://localhost:3001](http://localhost:3001) to view your server it in the browser.<br>

The page will automatically reload if you make changes to the code.<br>

### `docker-compose -f docker-compose.yml up --build`

Runs the app in production mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view your app it in the browser.<br>
Open [http://localhost:3001](http://localhost:3001) to view your server it in the browser.<br>

## License

Create Node-React-Docker App is open source software [licensed as MIT](https://github.com/EduSantosBrito/create-nrd-app/blob/master/LICENSE).
