module "lambdas" {
  source = "./modules/aws_lambda"

  for_each     = var.lambdas
  lambda_name  = each.value.handler
  runtime      = each.value.runtime
  iam_role_arn = aws_iam_role.lambda_exec.arn
  handler      = "bootstrap"
}

variable "lambdas" {
  description = "A map of lambda names to their configuration"
  type = map(object({
    handler = string
    runtime = string
  }))
  default = {
    auth = {
      handler = "auth"
      runtime = "provided.al2"
    }
    shortener = {
      handler = "shortener"
      runtime = "provided.al2"
    }
  }
}

output "lambdas" {
  value = { for k,v in module.lambdas : k => v.function_name }
}
