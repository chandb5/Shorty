resource "aws_s3_bucket" "shortener-analytics" {
  bucket = "shortener-analytics"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name        = "shortener-analytics"
  }
}