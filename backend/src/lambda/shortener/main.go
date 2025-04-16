package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/eventbridge"
	eventbridgetypes "github.com/aws/aws-sdk-go-v2/service/eventbridge/types"
)

type MyEvent struct {
	ID string `json:"id"`
}

func handler(ctx context.Context, e MyEvent) (string, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Fatalf("unable to load SDK config: %v", err)
	}

	client := eventbridge.NewFromConfig(cfg)

	detail, err := json.Marshal(map[string]string{
		"id":   e.ID,
		"note": "Triggered by Go Lambda",
	})
	if err != nil {
		return "", fmt.Errorf("error marshaling detail: %v", err)
	}

	_, err = client.PutEvents(ctx, &eventbridge.PutEventsInput{
		Entries: []eventbridgetypes.PutEventsRequestEntry{
			{
				Source:       aws.String("shortener"),
				DetailType:   aws.String("trigger"),
				Detail:       aws.String(string(detail)),
				EventBusName: aws.String("bridge"),
			},
		},
	})
	if err != nil {
		return "", fmt.Errorf("failed to put event: %v", err)
	}

	return fmt.Sprintf("Event with ID %s sent!", e.ID), nil
}

func main() {
	lambda.Start(handler)
}
