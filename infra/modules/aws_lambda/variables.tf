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
  default     = "python3.10"
}

variable "handler" {
  description = "The handler to use for the lambda function"
  type        = string
  
}

variable "environment_variables" {
  description = "Environment variables to pass to the lambda function"
  type        = map(string)
  default     = {}
}

variable "log_retention_in_days" {
  description = "The number of days to retain logs for the lambda function"
  type        = number
  default     = 14
}

variable "lambda_iam_policy_json" {
  description = "The IAM policy JSON to attach to the lambda function"
  type        = string
}

variable "vpc_id" {
  description = "The VPC ID to attach the lambda function to"
  type        = string
  default = ""
}

variable "subnet_ids" {
  description = "The subnet IDs to attach the lambda function to"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "The security group IDs to attach the lambda function to"
  type        = list(string)
  default     = []
}
