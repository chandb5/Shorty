package utils

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv(filename string) {
	err := godotenv.Load(filename)
	if err != nil {
		fmt.Printf("Error reading %v file %v \n", filename, err)
	}
}

func Getenv(key string, fallback ...string) string {
	value := os.Getenv(key)
	if len(value) == 0 && len(fallback) > 0 {
		return fallback[0]
	}
	return value
}
