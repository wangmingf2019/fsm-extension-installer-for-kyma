//Define saved helm-chart files path after download it from github.
export const CHAR_CACHE_PATH: string = process.cwd() + '/chart_caches/';

//Define path of helm-cli and kubectl-cli, default need to initialization via ENN command in Dockerfile file.
export const HELM_BINARY_LOCATION: string = process.env.HELM_BINARY || '/usr/local/bin/helm3';
export const KUBECTL_BINARY_LOCATION: string = process.env.KUBECTL_BINARY || '/usr/local/bin/kubectl';

//Using binding serviceclass instance on Kyma cluster to get this value
export const KYMA_SERVICE_CLASS_GATEWAY_URL: string = process.env.GATEWAY_URL || 'https://et.coresystems.net/cloud-extension-catalog-service';

//Ensure to initialize this value('/share') via ENV command in Dockerfile
export const KUBE_CONFIG_LOCATION: string = process.env.KUBECONFIG_PATH || '/Users/i076717/.kube/config';

//For local test case
export const TOKEN_VALUE: string = process.env.TOKEN_VALUE_4_TEST || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfaWQiOm51bGwsInVzZXJfZW1haWwiOiJlcmljLmxpdTA0QHNhcC5jb20iLCJ1c2VyX25hbWUiOiJFVC1lcmljLWF1dG8yL2FkbWluIiwiYXV0aG9yaXRpZXMiOlsiVVNFUiIsIlNVUEVSVVNFUiJdLCJjbGllbnRfaWQiOiJleHRlbnNpb24tY2F0YWxvZyIsImNvbXBhbmllcyI6W3sicGVybWlzc2lvbkdyb3VwSWQiOjM2NzU5NjQsInN0cmljdEVuY3J5cHRpb25Qb2xpY3kiOmZhbHNlLCJuYW1lIjoiRVRBVVRPMiIsImRlc2NyaXB0aW9uIjoiRVRBVVRPMiIsImlkIjo3NzgzOTZ9XSwiYWNjb3VudF9pZCI6NzMzMDAyLCJ1c2VyX2lkIjoxMDEyNDY3LCJzY29wZSI6WyJuL2EiXSwiZXhwIjoxNTkwNjUzMzMwLCJ1c2VyIjoiYWRtaW4iLCJqdGkiOiI0ZDU2ZmU1OC1mODQ1LTQzMTItYWZjYy03YzMzZmNiMzMwMzkiLCJhY2NvdW50IjoiRVQtZXJpYy1hdXRvMiJ9.tMlbA5Xa5vsD8XwntH-6Dcp8xleHobKawUbLWl2aeZe2eP68HlsXu3XsXabuURV3-RpZcO8jxYYSEj9bXDn6zzU0f9QbqRybt2kkhFK2nRX4Wfpd9VbNVw2V9NIoBYIkJ36Ok7U9iubCRGVGhYuR1E_ZraRNBVRyHPLvpjRz-K5WOC7e3dXgpUDnhacOicL_jq6_qO3g7HRaRWh4l6pISFJkttBNHfexAnUxfVyXa2_wThHNOzI7o8aENyQw_TvGWN-HDDWrX4Sz4CSoroY-UEY2FY3dqn0fP5cF05Qs1iJVeYZUlye_VQpXLUc-zABS8CG9BRhtXAri5oCRb9AZXg';
