package interfaces

import "github.com/AlkorMizar/WebApp/app/models"

type ElementDao interface {
	Create(el *models.Element) error
	Update(el *models.Element) error
	Delete(name string) error
	GetByType(t models.TypeOfEl) ([]models.Element, error)
	GetAll() ([]models.Element, error)
}
