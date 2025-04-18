resource "aws_apigatewayv2_api" "shortener_api" {
  name          = "ShortenerAPI"
  protocol_type = "HTTP"
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
  route_key       = "ANY /{proxy+}"
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

output "shortener_api_url" {
  value = aws_apigatewayv2_api.shortener_api.api_endpoint
}
