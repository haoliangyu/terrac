export TEST_BUCKET=terrac-test
export TERRAC_BACKEND_S3_ENDPOINT=http://s3.localhost.localstack.cloud:4566

# make sure localstack is running
localstack start -d

# make sure test bucket exists
awslocal s3api create-bucket --bucket $TEST_BUCKET

# clean up all test objects
awslocal s3 rm s3://$TEST_BUCKET --recursive

# run tests
npx mocha --forbid-only "test/**/*.test.ts"

# clean up all test objects
awslocal s3 rm s3://$TEST_BUCKET --recursive
