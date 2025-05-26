provider "aws" {
  region = "us-east-1"
}

variable "aws_region" {}

module "test" {
  source = "http://localhost:4566/terrac-test/test-module/1.3.3/module.zip"
}
