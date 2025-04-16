package main

import (
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/lambda"
)

type Response struct {
	Message string `json:"message"`
}

func HandleRequest(ctx context.Context, e any) (Response, error) {
	fmt.Println("Trigger lambda invoked")
	fmt.Printf("Event: %v\n", e)

	return Response{
		Message: "Hello from trigger lambda!",
	}, nil
}

func main() {
	lambda.Start(HandleRequest)
}
