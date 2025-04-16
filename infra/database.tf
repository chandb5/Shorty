resource "aws_db_instance" "shortener-db" {
  allocated_storage   = 10
  storage_type        = "gp2"
  engine              = "postgres"
  engine_version      = "16.6"
  instance_class      = "db.t3.micro"
  username            = "postgres"
  password            = "supersecretpassword"
  db_name             = "shortener"
  publicly_accessible = false
  identifier          = "shortener-db"

  skip_final_snapshot     = true
  backup_retention_period = 0
  multi_az                = false
}