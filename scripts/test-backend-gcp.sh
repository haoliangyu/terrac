export TEST_BUCKET=terrac-test

export TERRAC_BACKEND_GCP_ENDPOINT=http://localhost:8080

# make sure localstack is running
docker pull localstack/localstack
localstack start -d

# make sure test bucket exists
awslocal s3api create-bucket --bucket $TEST_BUCKET

# clean up all test objects
awslocal s3 rm s3://$TEST_BUCKET --recursive

# run tests
npx mocha --forbid-only "test/backends/s3.test.ts"

# clean up all test objects
awslocal s3 rm s3://$TEST_BUCKET --recursive
