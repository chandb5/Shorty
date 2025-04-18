resource "aws_cloudwatch_event_bus" "default-bus" {
  name = "shortener-default-bus"
}

resource "aws_cloudwatch_event_rule" "trigger-event-rule" {
  name           = "analytics-event"
  event_bus_name = aws_cloudwatch_event_bus.default-bus.name 
  event_pattern = jsonencode({
    "source"      = ["public-lambda"],
    "detail-type" = ["public"]
  })
  depends_on = [aws_cloudwatch_event_bus.default-bus]
}

resource "aws_cloudwatch_event_target" "analytics_target" {
  rule           = aws_cloudwatch_event_rule.trigger-event-rule.name
  target_id      = "analytics_lambda"
  arn            = module.analytic_lambda.lambda_arn
  event_bus_name = aws_cloudwatch_event_bus.default-bus.name
  depends_on     = [aws_cloudwatch_event_rule.trigger-event-rule]
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = module.analytic_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.trigger-event-rule.arn
  depends_on    = [aws_cloudwatch_event_target.analytics_target]
}