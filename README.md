# fsm-extension-installer-for-kyma

## How to build docker image
1. Ensure that the docker server is runnin on your local computer;
2. Enter to 'backend' folder and run below command:
*   `npm run build:prod`
*  Note: Please firstly delete node_modules folder if you find have node_modules folder on current path.
3. Back to root folder and you can find 'Dockerfile' file, then run below command to build docker image:
*   `docker build -t ${docker_registry}/${application_name}:${application_version} .`
4. Run below command to view new docker image:
*   `docker images | grep '${application_name}'`
