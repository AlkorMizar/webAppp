package mysql

import (
	"log"

	"github.com/AlkorMizar/WebApp/app/models"
)

type DaoImpl struct {
}

func (dao DaoImpl) Create(el *models.Element) error {
	log.Println("craete")
	db := get()
	defer db.Close()

	result, err := db.Exec("insert into db.table (name, content, `type`) values (?, ?, ?)",
		el.Name, el.Content, el.Type)
	if err != nil {
		panic(err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	el.ID = int(id)
	return nil
}

func (dao DaoImpl) GetAll() ([]models.Element, error) {
	log.Println("select")
	query := "SELECT id, name, content, `type` FROM db.table"
	elements := make([]models.Element, 0)
	db := get()
	defer db.Close()

	stmt, err := db.Prepare(query)
	if err != nil {
		return elements, err
	}

	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		return elements, err
	}

	for rows.Next() {
		var row models.Element
		err := rows.Scan(&row.ID, &row.Name, &row.Content, &row.Type)
		if err != nil {
			return nil, err
		}

		elements = append(elements, row)
	}

	return elements, nil

}

func (dao DaoImpl) Update(el *models.Element) error {
	log.Println("update")
	query := "UPDATE db.table SET content = ? WHERE name = ?"
	db := get()
	defer db.Close()
	stmt, err := db.Prepare(query)

	if err != nil {
		return err
	}

	defer stmt.Close()
	_, err = stmt.Exec(el.Content, el.Name)
	if err != nil {
		return err
	}

	return nil
}

func (dao DaoImpl) Delete(name string) error {
	log.Println("delete")
	query := "DELETE FROM db.table WHERE name = ?"
	db := get()
	defer db.Close()
	stmt, err := db.Prepare(query)

	if err != nil {
		return err
	}

	defer stmt.Close()
	_, err = stmt.Exec(name)
	if err != nil {
		return err
	}

	return nil
}
func (dao DaoImpl) GetByType(t models.TypeOfEl) ([]models.Element, error) {
	log.Println("getType")
	elements := make([]models.Element, 0)
	db := get()
	defer db.Close()

	rows, err := db.Query("select id, name, content, `type` from db.table where `type` = ?", t)
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	for rows.Next() {
		var row models.Element
		err := rows.Scan(&row.ID, &row.Name, &row.Content, &row.Type)
		if err != nil {
			return nil, err
		}

		elements = append(elements, row)
	}
	return elements, nil
}
