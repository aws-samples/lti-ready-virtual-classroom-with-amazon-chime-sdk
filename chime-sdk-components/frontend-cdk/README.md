**Steps to deploy**

- Pre-requisites
    - Deploy the Chime SDK backend and retrieve the API GW URL
- In your CLI, enter the AWS credentials of the account you want to deploy this solution in
- Edit `react-meeting-demo/demo/meeting/src/utils/api.ts` and provide the updated API GW URL from the previous step as the `BASE_URL`
- In the root folder, run the following commands in CLI 
    - `cd frontend-cdk`
    - `cdk deploy -c pipeline-mode=false`
