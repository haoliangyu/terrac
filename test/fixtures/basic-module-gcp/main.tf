provider "aws" {
  region = "us-east-1"
}

variable "aws_region" {}

data "aws_caller_identity" "current" {}
