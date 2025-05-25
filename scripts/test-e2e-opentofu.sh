TEST_BUCKET=terrac-test
TEST_MODULE=test-module
WORK_DIR=test/fixtures/e2e-module-s3

# remove old artifacts
aws s3 rm s3://$TEST_BUCKET/ --recursive --exclude "*" --include "$TEST_MODULE*"

# publish test module
npm run start -- publish --work-directory $WORK_DIR --overwrite-config backend.bucket=$TEST_BUCKET

# install test module
cd $WORK_DIR && tofu init
