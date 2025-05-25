if [[ "$CI" == "true" ]]; then
  set -e
fi

export TEST_BUCKET=terrac-test
export TERRAC_BACKEND_S3_ENDPOINT=http://s3.localhost.localstack.cloud:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

# make sure localstack is running
docker pull localstack/localstack
localstack start -d
localstack wait -t 30

# make sure test bucket exists
awslocal s3api create-bucket --bucket $TEST_BUCKET

# clean up all test objects
awslocal s3 rm s3://$TEST_BUCKET --recursive

# run tests
npx mocha --forbid-only "test/backends/s3.test.ts"

# clean up all test objects
awslocal s3 rm s3://$TEST_BUCKET --recursive

# stop localstack
localstack stop
