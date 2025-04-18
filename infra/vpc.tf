resource "aws_vpc" "main" {
  cidr_block           = "12.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "shortener-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "12.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "12.0.2.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "private-subnet-1a"
  }
}

resource "aws_subnet" "private-1b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "12.0.3.0/24"
  availability_zone = "us-east-1b"
  tags = {
    Name = "private-subnet-1b"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "private-rt"
  }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private-1b" {
  subnet_id = aws_subnet.private-1b.id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "rds" {
  name        = "rds-sg"
  description = "Allow PostgreSQL traffic from Lambda"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "rds-security-group"
  }
}

resource "aws_security_group" "lambda" {
  name        = "lambda-sg"
  description = "Security group for Lambda function"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lambda-security-group"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "shortener-db-subnet-group"
  subnet_ids = [aws_subnet.private.id, aws_subnet.private-1b.id]
  description = "Subnet group for RDS instance"
  tags = {
    Name = "shortener-db-subnet-group"
  }
  depends_on = [aws_subnet.private, aws_vpc.main, aws_security_group.rds]
}

resource "aws_vpc_endpoint" "eventbridge" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.events"
  vpc_endpoint_type = "Interface"
  subnet_ids   = [aws_subnet.public.id]
  security_group_ids = [aws_security_group.eventbridge.id, aws_security_group.lambda.id]
  private_dns_enabled = true
  tags = {
    Name = "eventbridge-vpc-endpoint"
  }
}


resource "aws_security_group" "eventbridge" {
  name        = "eventbridge-sg"
  description = "Security group for EventBridge VPC Endpoint"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "eventbridge-security-group"
  }
}

resource "aws_vpc_endpoint" "s3_endpoint" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id, aws_route_table.public.id]

  tags = {
    Name = "s3-vpc-endpoint"
  }
}