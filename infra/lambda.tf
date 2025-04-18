module "auth_lambda" {
  source      = "./modules/aws_lambda"
  handler     = "index.handler"
  lambda_name = "auth"
  runtime     = "python3.10"
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
      },
      {
        Effect = "Allow",
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ],
        Resource = "*"
    }]
  })
  environment_variables = {
    DB_HOST     = "shortener-db.crwwc0880566.us-east-1.rds.amazonaws.com"
    DB_PORT     = "5432"
    DB_USER     = "postgres"
    DB_PASSWORD = "supersecretpassword"
    DB_NAME     = "shortener"
    JWT_SECRET = "supersecret"
  }
  vpc_id             = aws_vpc.main.id
  subnet_ids         = [aws_subnet.public.id]
  security_group_ids = [aws_security_group.lambda.id]
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
    },
    {
        Effect = "Allow",
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ],
        Resource = "*"
    }]
  })
  environment_variables = {
    DB_HOST     = "shortener-db.crwwc0880566.us-east-1.rds.amazonaws.com"
    DB_PORT     = "5432"
    DB_USER     = "postgres"
    DB_PASSWORD = "supersecretpassword"
    DB_NAME     = "shortener"
    EVENT_BUS_NAME = aws_cloudwatch_event_bus.default-bus.name
    JWT_SECRET = "supersecret"
  }
  vpc_id             = aws_vpc.main.id
  subnet_ids         = [aws_subnet.public.id]
  security_group_ids = [aws_security_group.lambda.id]
}

module "public_lambda" {
  source      = "./modules/aws_lambda"
  handler     = "index.handler"
  lambda_name = "public"
  lambda_iam_policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
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
    EVENT_BUS_NAME = aws_cloudwatch_event_bus.default-bus.name
    EVENTBRIDGE_ENDPOINT_URL = "vpce-020a38e03683aadff-xfsl8raf-us-east-1a.events.us-east-1.vpce.amazonaws.com"
  }
  vpc_id             = aws_vpc.main.id
  subnet_ids         = [aws_subnet.public.id]
  security_group_ids = [aws_security_group.lambda.id]

}

module "analytic_lambda" {
  source      = "./modules/aws_lambda"
  handler     = "index.handler"
  lambda_name = "analytics"
  lambda_iam_policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "s3:*",
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
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
    BUCKET_NAME = aws_s3_bucket.shortener-analytics.bucket
  }
  vpc_id             = aws_vpc.main.id
  subnet_ids         = [aws_subnet.public.id]
  security_group_ids = [aws_security_group.lambda.id]
}
