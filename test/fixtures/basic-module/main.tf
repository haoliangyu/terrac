provider "aws" {
  region = var.aws_region
}

variable "aws_region" {}

data "aws_caller_identity" "current" {}