import { Injectable, LoggerService, Logger } from '@nestjs/common';
import yamljs = require('yamljs');

import {ExtensionCatalogService} from '../extensioncatalogservice/extensioncatalogservice.service';
import {ChartserviceService} from '../chartservice/chartservice.service';
import {HelmserviceService} from '../helmservice/helmservice.service';
import {HelmDeleteOptions, HelmDeployOptions} from '../utils/interfaces/helmperformoptions.interface';
import {DeployConfigData} from '../utils/interfaces/deployconfigdata.interface';
import {UpdatedDeployData} from '../utils/interfaces/updateddeploydata.interface';
import {DeployResultData} from '../utils/interfaces/deployresultdata.interface';
import {KubectlService} from '../kubectl/kubectl.service';
import {RequestInstallData, RequestUninstallData} from '../utils/interfaces/requestdata.interface';

@Injectable()
export class InstallerService {
    private readonly loggerService: LoggerService = new Logger(InstallerService.name, true);

    constructor(private readonly extensionCatalogService: ExtensionCatalogService,
                private readonly chartserviceService: ChartserviceService,
                private readonly helmserviceService: HelmserviceService,
                private readonly kubectlService: KubectlService) {
    }

    public async installExtension(requestData: RequestInstallData) {
        this.loggerService.log("Begin to install extension application ...");
        return await this.deployExtension(requestData, false);
    }

    public async upgradeExtension(requestData: RequestInstallData) {
        this.loggerService.log("Begin to upgrade extension application ...");
        return await this.deployExtension(requestData, true);
    }

    public async uninstallExtension(requestData: RequestUninstallData) {
        this.loggerService.log("Begin to uninstall extension application ...");

        await this.helmserviceService.delete({releaseName: requestData.releaseName,
            namespace: requestData.namespace} as HelmDeleteOptions);

        this.loggerService.log('Successfully finish uninstall workflow.');
    }

    private getReleaseName(chartPath: string): string {
        try {
            const chartObject = yamljs.load(chartPath + '/Chart.yaml');
            if (!chartObject || !chartObject.name) {
                throw new Error(`Chart name is required;`);
            }

            return chartObject.name;
        } catch (error) {
            this.loggerService.error(error.toString());
            throw error;
        }
    }

    private async deployExtension(requestData: RequestInstallData, isUpgradeFlow: boolean) {
        let chartLocalPath: string = null;
        try {
            this.loggerService.log('Step1, Get deployment configuration data via deploymentId from Extension Catalog service.');
            const deployConfigData: DeployConfigData =
                await this.extensionCatalogService.getDeploymentConfigData(requestData);

            this.loggerService.log('Step2, Download helm chart from github repository.');
            chartLocalPath = await this.chartserviceService.downloadChartFromGithubRepo(deployConfigData.chartConfigData);

            await this.preUpgradeFlow(isUpgradeFlow, deployConfigData);

            this.loggerService.log(`Step${isUpgradeFlow ? 4 : 3}, Using helm-cli to install extension app to Kyma cluster.`);
            const result = await this.installOperation(chartLocalPath, deployConfigData);

            const helmResult = JSON.parse(result);
            this.loggerService.log(`Step5, Add helmRelease:${helmResult.name} and namespace:${helmResult.namespace} to Extension Deployment Result table.`);
            await this.updateHelmValueToDeploymentResult(requestData, helmResult);

            this.loggerService.log(`Step6, Get access url from Kyma cluster via virtualservice api-resource type.`);
            const accessUrl = await this.kubectlService.getAccessUrlFromKymaByAppName(helmResult.name, helmResult.namespace);

            this.loggerService.log(`Step7, Update state:${this.getDeployState(isUpgradeFlow, accessUrl)} to Extension Catalog service via API call.`);
            const updatedDeployData = this.buildUpdatedDeployInfo(requestData,
                this.getDeployState(isUpgradeFlow, accessUrl), deployConfigData.appVersion, accessUrl);
            await this.extensionCatalogService.updateDeploymentInfoToCatalog(updatedDeployData);

            this.loggerService.log('Successfully finish install or upgrade workflow.');
        } catch (error) {
            const state = isUpgradeFlow ? 'UPDATE_FAILED' : 'INSTALL_FAILED';
            const updatedDeployData = this.buildUpdatedDeployInfo(requestData, state, null, '');
            await this.extensionCatalogService.updateDeploymentInfoToCatalog(updatedDeployData);

            //Record error info to Result table
            await this.updateErrorToDeploymentResult(requestData, error);

            //Throw exception to NestJS framework
            throw error;
        } finally {
            //Clean up current download helm-chart folder
            this.chartserviceService.removeDownloadedPath(chartLocalPath);
        }
    }

    private async updateErrorToDeploymentResult(requestData: RequestInstallData, error: any) {
        const deployResultData = {
            accountId: requestData.accountId,
            companyId: requestData.companyId,
            extensionDeploymentId: requestData.extensionDeploymentId,
            log: error.toString(),
            shortMessage: error.toString(),
            content: {
                helmRelease: '',
                namespace: ''
            }
        } as DeployResultData;
        await this.extensionCatalogService.addDeploymentResultToCatalog(deployResultData);
    }

    private async updateHelmValueToDeploymentResult(requestData: RequestInstallData, helmResult: any) {
        const deployResultData = {
            accountId: requestData.accountId,
            companyId: requestData.companyId,
            extensionDeploymentId: requestData.extensionDeploymentId,
            log: helmResult.info.notes,
            shortMessage: helmResult.info.description,
            content: {
                helmRelease: helmResult.name,
                namespace: helmResult.namespace
            }
        } as DeployResultData;
        await this.extensionCatalogService.addDeploymentResultToCatalog(deployResultData);
    }

    private async installOperation(chartPath: string, deployConfigData: DeployConfigData) {
        let helmChartPath = chartPath;
        if (deployConfigData.chartConfigData.path) {
            helmChartPath = helmChartPath + '/' + deployConfigData.chartConfigData.path;
        }
        const helmDeployOptions = {
            releaseName: this.getReleaseName(helmChartPath),
            chartLocation: helmChartPath,
            namespace: deployConfigData.namespace,
            values: deployConfigData.parameterValues
        } as HelmDeployOptions;
        this.loggerService.log("HelmDeployOptions:");
        this.loggerService.log(helmDeployOptions);
        const response = await this.helmserviceService.install(helmDeployOptions);
        if (response.stderr) {
            throw new Error(response.stderr);
        }else {
            return response.stdout;
        }
    }

    private async preUpgradeFlow(isUpgradeFlow: boolean, deployConfigData: DeployConfigData) {
        if (!isUpgradeFlow) {
            return;
        }

        this.loggerService.log(`Step3, Delete old release via releaseName:${deployConfigData.lastHelmContent.helmRelease} 
                and namespace:${deployConfigData.lastHelmContent.namespace} for upgrade workflow.`);

        const helmDeleteOptions = {
            releaseName: deployConfigData.lastHelmContent.helmRelease,
            namespace: deployConfigData.lastHelmContent.namespace
        } as HelmDeleteOptions;
        const deletedResult = await this.helmserviceService.delete(helmDeleteOptions);

        if (deletedResult.stderr) {
            throw new Error(deletedResult.stderr);
        }
    }

    private buildUpdatedDeployInfo(requestData: RequestInstallData,
                                   state: string,
                                   version: string,
                                   accessUrl: string): UpdatedDeployData {

        const value = {
            accountId: requestData.accountId,
            companyId: requestData.companyId,
            extensionDeploymentId : requestData.extensionDeploymentId,
            state : state,
            version : version,
            accessUrl : accessUrl
        } as UpdatedDeployData;

        if (!version) {
            delete value.version;
        }

        return value;
    }

    private getDeployState(isUpgradeFlow: boolean, accessUrl: string): string {
        if (isUpgradeFlow) {
            return (accessUrl && accessUrl !== '') ? 'UPDATED' : 'UPDATE_FAILED';
        } else {
            return (accessUrl && accessUrl !== '') ? 'INSTALLED' : 'INSTALL_FAILED';
        }
    }
}
