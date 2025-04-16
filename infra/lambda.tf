module "auth_lambda" {
  source      = "./modules/aws_lambda"
  handler     = "index.handler"
  lambda_name = "auth"
  runtime = "python3.10"
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
  handler     = "index.handler"
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
  environment_variables = {
    DB_HOST     = "shortener-db.crwwc0880566.us-east-1.rds.amazonaws.com"
    DB_PORT     = "5432"
    DB_USER     = "postgres"
    DB_PASSWORD = "supersecretpassword"
    DB_NAME     = "shortener"
  }
}

module "trigger_lambda" {
  source      = "./modules/aws_lambda"
  handler     = "index.handler"
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
