#Prepare node.js basic run environment
FROM node:10-alpine3.11

#Add ENVs
ENV HELM_VERSION="v3.2.0" \
    HELM_BINARY="/usr/local/bin/helm" \
    KUBE_LATEST_VERSION="v1.18.0" \
    KUBECTL_BINARY="/usr/local/bin/kubectl" \
    KUBECONFIG_PATH="/share/kubeconfig"

#Install necessary tools, include: git, kubectl and helm-ctl
RUN apk add --no-cache git bash \
    && wget -q https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz -O - | tar -xzO linux-amd64/helm > /usr/local/bin/helm \
    && chmod +x /usr/local/bin/helm \
    && wget -q https://storage.googleapis.com/kubernetes-release/release/${KUBE_LATEST_VERSION}/bin/linux/amd64/kubectl -O /usr/local/bin/kubectl \
        && chmod +x /usr/local/bin/kubectl

#Create app directory and set to current
WORKDIR /usr/src/fsm-extension-installer-for-kyma

#Copy source code and dependency packages
COPY ./backend/release ./backend
COPY ./backend/node_modules ./node_modules

#Run current application
CMD ["node", "./backend/main.js"]
