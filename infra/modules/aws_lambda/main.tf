resource "null_resource" "setup_dependencies" {
  triggers = {
    requirements_hash = md5(file("${path.module}/../../../backend/src/lambda/${var.lambda_name}/requirements.txt"))
    source_hash = md5(file("${path.module}/../../../backend/src/lambda/${var.lambda_name}/index.py"))
  }

  provisioner "local-exec" {
    command = <<EOT
      rm -rf ${path.module}/../../../backend/src/lambda/${var.lambda_name}/build
      rm -rf ${path.module}/../../../zips/${var.lambda_name}-handler.zip
      mkdir -p ${path.module}/../../../backend/src/lambda/${var.lambda_name}/build
      pip3 install --platform manylinux2014_x86_64 --only-binary :all: --python-version 3.10 -r ${path.module}/../../../backend/src/lambda/${var.lambda_name}/requirements.txt -t ${path.module}/../../../backend/src/lambda/${var.lambda_name}/build
      cp -r ${path.module}/../../../backend/src/lambda/${var.lambda_name}/index.py ${path.module}/../../../backend/src/lambda/${var.lambda_name}/build
    EOT
  }
}

data "archive_file" "zip_generator" {
  type = "zip"
  source_dir = "${path.module}/../../../backend/src/lambda/${var.lambda_name}/build"
  output_path = "${path.module}/../../../zips/${var.lambda_name}-handler.zip"
  depends_on = [null_resource.setup_dependencies]
}

resource "aws_lambda_function" "lambda_function" {
  function_name = "${var.lambda_name}-${var.project_name}"
  filename      = data.archive_file.zip_generator.output_path
  handler       = var.handler
  runtime       = var.runtime
  role          = aws_iam_role.lambda_role.arn

  architectures = ["x86_64"]
  source_code_hash = data.archive_file.zip_generator.output_sha
  memory_size = 128
  timeout     = 30

  environment {
    variables = var.environment_variables
  }

  dynamic "vpc_config" {
    for_each = var.vpc_id != "" ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
  }
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${var.lambda_name}-${var.project_name}"
  retention_in_days = var.log_retention_in_days
}

resource "aws_iam_role" "lambda_role" {
  name = "${var.lambda_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "lambda_iam_policy" {
  name        = "${var.lambda_name}-lambda-policy"
  description = "IAM policy for Lambda ${var.lambda_name} function"
  policy      = var.lambda_iam_policy_json
}

resource "aws_iam_role_policy_attachment" "iam_role_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_iam_policy.arn
}
