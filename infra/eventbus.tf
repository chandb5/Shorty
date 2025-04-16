resource "aws_cloudwatch_event_bus" "bridge" {
  name = "bridge"
}

resource "aws_cloudwatch_event_rule" "trigger-event-rule" {
  name           = "trigger-event"
  event_bus_name = aws_cloudwatch_event_bus.bridge.name
  event_pattern = jsonencode({
    "source"      = ["aws.lambda"]
    "detail-type" = ["trigger.event"]
  })
  depends_on = [aws_cloudwatch_event_bus.bridge]
}

resource "aws_cloudwatch_event_target" "trigger_target" {
  rule           = aws_cloudwatch_event_rule.trigger-event-rule.name
  target_id      = "trigger_lambda"
  arn            = module.trigger_lambda.lambda_arn
  event_bus_name = aws_cloudwatch_event_bus.bridge.name
  depends_on     = [aws_cloudwatch_event_rule.trigger-event-rule]
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = module.trigger_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.trigger-event-rule.arn
  depends_on    = [aws_cloudwatch_event_target.trigger_target]
}