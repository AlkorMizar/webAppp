package models

type Element struct {
	ID      int
	Name    string   `json:"name"`
	Content string   `json:"content"`
	Type    TypeOfEl `json:"type"`
}

type TypeOfEl int

const (
	HTML TypeOfEl = iota
	SVG
)
