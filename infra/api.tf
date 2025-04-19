resource "aws_apigatewayv2_api" "shortener_api" {
  name          = "ShortenerAPI"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins     = ["http://localhost:3000", "http://3.91.170.131"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"]
    allow_headers     = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers", "Access-Control-Allow-Methods"]
    expose_headers    = ["Content-Length", "X-Amz-Date", "X-Api-Key", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers"]
    allow_credentials = true
    max_age           = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.shortener_api.id
  name        = "$default"
  auto_deploy = true
}

module "shortener_gateway" {
  source = "./modules/aws_api_gateway"

  lambda_name     = module.shortener_lambda.function_name
  invoke_arn      = module.shortener_lambda.invoke_arn
  api_gateway_id  = aws_apigatewayv2_api.shortener_api.id
  route_key       = "ANY /shorten/{proxy+}"
  execution_arn = aws_apigatewayv2_api.shortener_api.execution_arn
}

module "auth_gateway" {
  source = "./modules/aws_api_gateway"

  lambda_name     = module.auth_lambda.function_name
  invoke_arn      = module.auth_lambda.invoke_arn
  api_gateway_id  = aws_apigatewayv2_api.shortener_api.id
  route_key       = "ANY /auth/{proxy+}"
  execution_arn = aws_apigatewayv2_api.shortener_api.execution_arn
}

module "public_gateway" {
  source = "./modules/aws_api_gateway"

  lambda_name     = module.public_lambda.function_name
  invoke_arn      = module.public_lambda.invoke_arn
  api_gateway_id  = aws_apigatewayv2_api.shortener_api.id
  route_key       = "ANY /{proxy+}"
  execution_arn = aws_apigatewayv2_api.shortener_api.execution_arn
}

output "shortener_api_url" {
  value = aws_apigatewayv2_api.shortener_api.api_endpoint
}
