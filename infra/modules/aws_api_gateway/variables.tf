variable "lambda_name" {
    type = string
    description = "value of the lambda function name"
}

variable "invoke_arn" {
    type = string
    description = "value of the invoke ARN"
}

variable "api_gateway_id" {
    description = "The id of the API Gateway"
    type        = string
}

variable "route_key" {
  default = "ANY /{proxy+}"
}

variable "execution_arn" {
  description = "The execution ARN of the API Gateway"
  type        = string
}