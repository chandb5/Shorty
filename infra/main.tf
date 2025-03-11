terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1"
}

# resource "aws_instance" "app_server" {
#   ami           = "ami-830c94e3"
#   instance_type = "t2.micro"

#   tags = {
#     Name = "tf-app-server"
#   }
# }

data "archive_file" "auth_lambda" {
  type        = "zip"
  source_file = "${path.module}/../src/auth/bootstrap"
  output_path = "${path.module}/../zips/auth-handler.zip"
}

resource "aws_lambda_function" "auth_lambda" {
  function_name = "auth-lambda"
  filename      = data.archive_file.auth_lambda.output_path
  handler       = "bootstrap"
  runtime       = "provided.al2"
  architectures = ["arm64"]

  source_code_hash = data.archive_file.auth_lambda.output_base64sha256
  role             = aws_iam_role.lambda_exec.arn
  memory_size      = 128
  timeout          = 1
  tags = {
    "env" = "dev"
  }
}

resource "aws_cloudwatch_log_group" "auth_lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.auth_lambda.function_name}"
  retention_in_days = 14
}

resource "aws_iam_role" "lambda_exec" {
  name = "serverless_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
