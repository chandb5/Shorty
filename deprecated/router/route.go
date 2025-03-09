package routes

import (
	"not-short/controller"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()

	router.GET("/", controller.HomeHandler)
	return router
}
