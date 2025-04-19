resource "aws_s3_bucket" "shortener-analytics" {
  bucket = "shortener-analytics"

  tags = {
    Name        = "shortener-analytics"
  }
}