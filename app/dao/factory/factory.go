package factory

import (
	"log"

	"github.com/AlkorMizar/WebApp/app/dao/interfaces"
	"github.com/AlkorMizar/WebApp/app/dao/mysql"
)

func FactoryDao(e string) interfaces.ElementDao {
	var i interfaces.ElementDao
	switch e {
	case "mysql":
		i = mysql.DaoImpl{}
	default:
		log.Fatalf("El motor %s no esta implementado", e)
		return nil
	}

	return i
}
