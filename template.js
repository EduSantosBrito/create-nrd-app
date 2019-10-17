export function getDockerComposeProdJson(projectName) {
    return {
        "version": "3",
        "services": {
            [`${projectName}-client`]: {
                "container_name": `${projectName}-client`,
                "build": {
                    "context": "./client",
                    "dockerfile": "Dockerfile"
                },
                "restart": "always",
                "environment": {
                    "NODE_ENV": "production",
                    "REACT_APP_PORT": 80,
                    "REACT_APP_HOST": "0.0.0.0",
                    "REACT_APP_API_HOST": "0.0.0.0",
                    "REACT_APP_API_PORT": 3001
                },
                "ports": [
                    "50100:80"
                ],
                "depends_on": [
                    `${projectName}-server`
                ],
                "networks": [
                    `${projectName}-network`
                ]
            },
            [`${projectName}-server`]: {
                "container_name": `${projectName}-server`,
                "build": {
                    "context": "./server",
                    "dockerfile": "Dockerfile"
                },
                "restart": "always",
                "environment": {
                    "NODE_ENV": "production",
                    "NODE_PORT": 3001,
                    "NODE_HOST": "0.0.0.0",
                    "MONGODB_PORT": 27017,
                    "MONGODB_HOST": `${projectName}-mongo`,
                    "MONGODB_DATABASE": `${projectName}-database`
                },
                "ports": [
                    "50110:3001"
                ],
                "depends_on": [
                    `${projectName}-mongo`
                ],
                "networks": [
                    `${projectName}-network`
                ]
            },
            [`${projectName}-mongo`]: {
                "container_name": `${projectName}-mongo`,
                "image": "mongo",
                "restart": "always",
                "environment": {
                    "MONGODB_PORT": 27017,
                    "MONGODB_HOST": "0.0.0.0"
                },
                "volumes": [
                    "./data:/data/db"
                ],
                "ports": [
                    "50120:27017"
                ],
                "networks": [
                    `${projectName}-network`
                ]
            }
        },
        "networks": {
            [`${projectName}-network`]: {
                "driver": "bridge"
            }
        }
    }
}