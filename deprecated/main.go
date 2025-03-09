package main

import (
	"net/http"
	routes "not-short/router"
	"not-short/utils"

	"github.com/gin-gonic/gin"
)

var ENV string = utils.Getenv("GIN_MODE", "debug")
var PORT string = utils.Getenv("port", "6000")

func main() {
	if ENV == "release" {
		utils.LoadEnv(".env.prod")
		gin.SetMode(gin.ReleaseMode)
	} else {
		utils.LoadEnv(".env.dev")
		gin.SetMode(gin.DebugMode)
	}
	// database.ConnectDB()
	router := routes.SetupRouter()

	s := &http.Server{
		Handler:        router,
		Addr:           ":" + PORT,
		MaxHeaderBytes: 1 << 20,
	}
	s.ListenAndServe()
}
