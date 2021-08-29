#!/bin/bash
abort()
{
    echo >&2 '
***************
*** ABORTED ***
***************
'
    echo "An error occurred. Exiting..." >&2
    exit 1
}

trap 'abort' 0

set -e

### PROCESS INLINE ARGS ###
confirm='N'
while getopts i: flag
do
    case "${flag}" in
        i) publicjwkurl=${OPTARG}
        confirm='Y';;
    esac
done
regex='(https?|ftp|file)://[-A-Za-z0-9\+&@#/%?=~_|!:,.;]*[-A-Za-z0-9\+&@#/%=~_|]'
if [[ ! $publicjwkurl =~ $regex ]]
then 
    echo "Invalid JWK Url provided in argument, entering interactive prompt"
    confirm='N'
fi
echo "Options: $publicjwkurl";

### COLLECT USER INPUT ###
echo Welcome to the LTI-ready Amazon Chime SDK Meetings Application
echo ====================================
echo Lets get some information from you before we begin the deployment...
while [[ ! "$confirm" =~ ^([yY][eE][sS]|[yY])$ ]]
do
    echo Please provide the public JWK url from your LTI solution eg. 'https://your-jwk-domain.com/dev/getPublicKey'
    unset publicjwkurl
    while [[ ! ${publicjwkurl} =~ $regex ]]
    do
        read -p 'Public JWK URI:' publicjwkurl
            if [[ $publicjwkurl =~ $regex ]]
            then 
                echo "Link valid"
            else
                echo "Link not valid"
            fi
    done
    echo
    echo Thank you, this is the Public JWK URI you provided: $publicjwkurl
    read -p 'Confirm (y/N)' confirm 
done
echo Thank you, starting the deployment process!

### DEPLOY BACKEND ###
echo "Deploying backend cdk..."
cd backend-cdk
if [ -f "cdk.context.json" ]; then
    echo ""
    echo "INFO: Removing cdk.context.json"
    rm cdk.context.json
else
    echo ""
    echo "INFO: cdk.context.json not present, nothing to remove"
fi
if [ ! -f "package-lock.lock" ]; then
    echo ""
    echo "Installing Packages"
    echo ""
    npm install
fi
echo "Bootstrapping CDK"
cdk bootstrap -c publicjwkurl=$publicjwkurl
echo ""
echo "Building CDK"
echo ""
npm run build
echo ""
echo "Building Packages"
echo ""
pushd src/join
npm install
popd
pushd src/auth
npm install
popd
echo ""
echo "Deploying Backend with context ${publicjwkurl}"
echo ""
cdk deploy -c publicjwkurl=$publicjwkurl
### DEPLOY FRONTEND ###
echo "Deploying Frontend"
echo ""
cd ../frontend-cdk
if [ -f "cdk.context.json" ]; then
    echo ""
    echo "INFO: Removing cdk.context.json"
    rm cdk.context.json
else
    echo ""
    echo "INFO: cdk.context.json not present, nothing to remove"
fi
npm install
npm run build
cdk deploy

trap : 0

echo >&2 '
************
*** DONE *** 
************
'
