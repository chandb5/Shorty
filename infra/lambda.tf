module "auth_lambda" {
  source      = "./modules/aws_lambda"
  handler     = "bootstrap"
  lambda_name = "auth"
  lambda_iam_policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ]
      Resource = "*"
    }]
  })
}

module "shortener_lambda" {
  source      = "./modules/aws_lambda"
  handler     = "bootstrap"
  lambda_name = "shortener"
  lambda_iam_policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "events:PutEvents",
      ]
      Resource = "*"
    }]
  })
}

module "trigger_lambda" {
  source      = "./modules/aws_lambda"
  handler     = "bootstrap"
  lambda_name = "trigger"
  lambda_iam_policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ]
      Resource = "*"
    }]
  })
}
