if [[ "$CI" == "true" ]]; then
  set -e
fi

export TEST_BUCKET=terrac-test
export TEST_PROJECT_ID=test
export TERRAC_BACKEND_GCP_API_ENDPOINT=http://localhost:4443

# run gcl local
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
docker run -d --name fake-gcs-server -p 4443:4443 -v ${SCRIPT_DIR}/data:/data fsouza/fake-gcs-server -scheme http

# run tests
npx mocha --forbid-only "test/backends/gcp.test.ts"

# remove gcp local
docker rm -f fake-gcs-server
