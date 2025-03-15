data "archive_file" "zip_generator" {
  type        = "zip"
  source_file = "${path.module}/../../../backend/src/lambda/${var.lambda_name}/bootstrap"
  output_path = "${path.module}/../../../zips/${var.lambda_name}-handler.zip"
}

resource "aws_lambda_function" "auth_lambda" {
  function_name = "${var.lambda_name}-${var.project_name}"
  filename      = data.archive_file.zip_generator.output_path
  handler       = var.handler
  runtime       = var.runtime
  architectures = ["arm64"]

  source_code_hash = data.archive_file.zip_generator.output_base64sha256
  role             = var.iam_role_arn
  memory_size      = 128
  timeout          = 1
  tags = {
    "env" = "dev"
  }
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.auth_lambda.function_name}"
  retention_in_days = 14
}
