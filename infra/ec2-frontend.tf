resource "aws_instance" "web-server-frontend" {
  ami             = "ami-0655cec52acf2717b" # Ubuntu 22.04 LTS
  instance_type   = "t3.micro"
  key_name        = aws_key_pair.frontend-ec2-key.key_name
  security_groups = [aws_security_group.frontend-ec2-sg.name]

  user_data = <<-EOF
                #!/bin/bash
                sudo apt update
                sudo apt install apt-transport-https ca-certificates curl software-properties-common
                curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
                sudo apt update
                apt-cache policy docker-ce
                sudo apt install docker-ce -y
                
                sudo systemctl start docker
                sudo systemctl enable docker
                
                sudo docker pull nginx:latest
                sudo docker run -d -p 80:80 --restart always nginx:latest
                EOF
  tags = {
    Name = "web-server-frontend"
  }
}

resource "aws_key_pair" "frontend-ec2-key" {
  key_name   = "frontend-ec2-key"
  public_key = file("~/.ssh/id_ed25519.pub")
}

resource "aws_security_group" "frontend-ec2-sg" {
  name        = "frontend-ec2-sg"
  description = "Allow SSH and HTTP traffic"
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "frontend-ec2-sg"
  }
}

output "public_ip" {
  value       = aws_instance.web-server-frontend.public_ip
  description = "Public IP of the web server frontend instance"
}
