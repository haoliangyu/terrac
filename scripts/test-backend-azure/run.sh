if [[ "$CI" == "true" ]]; then
  set -e
fi

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")

mkdir -p ${SCRIPT_DIR}/data/__blobstorage__/terrac-test
docker run -d --name azurite -p 10000:10000 -p 10001:10001 -p 10002:10002 -v ${SCRIPT_DIR}/data:/data -v ${SCRIPT_DIR}/cert:/cert \
  mcr.microsoft.com/azure-storage/azurite azurite \
  --blobHost 0.0.0.0 --queueHost 0.0.0.0 --tableHost 0.0.0.0 --oauth basic --cert /cert/azurite-test-cert.pem --key /cert/azurite-test-key.pem

# trust self-signed certificate
export NODE_TLS_REJECT_UNAUTHORIZED=0
export TERRAC_BACKEND_AZURE_SERVICE_URL=https://localhost:10000/devstoreaccount1
export TEST_CONTAINER=terrac-test
export TEST_ACCOUNT=devstoreaccount1
npx mocha --forbid-only "test/backends/azure.test.ts"

docker rm -f azurite
rm -rf ${SCRIPT_DIR}/data
