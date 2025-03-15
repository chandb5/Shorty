variable "project_name" {
  description = "The name of the project"
  type        = string
  default = "shorty"
}

variable "lambda_name" {
  description = "The name of the lambda function"
  type        = string
}

variable "runtime" {
  description = "The runtime to use for the lambda function"
  type        = string
}

variable "handler" {
  description = "The handler to use for the lambda function"
  type        = string
  
}

variable "iam_role_arn" {
  description = "The ARN of the IAM role to attach to the lambda function"
  type        = string
}