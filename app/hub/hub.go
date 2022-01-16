package hub

import (
	"log"
	"net/http"

	"github.com/AlkorMizar/WebApp/app/dao/factory"
	"github.com/AlkorMizar/WebApp/app/models"
	"github.com/AlkorMizar/WebApp/app/structs"
	"github.com/gorilla/websocket"
)

type Hub struct {
	users       structs.List
	lockedElems structs.List
	msgHandlers [size]msgHandler
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

var dao = factory.FactoryDao("mysql")

func NewHub() (h Hub) {
	h.users = structs.NewList()
	h.lockedElems = structs.NewList()

	h.msgHandlers[addSvg] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return changePosF(msg.Name, msg.X, msg.Y, msg.Content)
	}
	h.msgHandlers[getSvg] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return getSVGF()
	}
	h.msgHandlers[removeSVG] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return removeSVGF(msg.Name)
	}
	h.msgHandlers[createFromSvg] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return createFromSVGF(msg.Name, msg.Content)
	}
	h.msgHandlers[getLocked] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return h.getLockedF()
	}
	h.msgHandlers[lockElem] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return h.lockElemF(msg.Name)
	}
	h.msgHandlers[unlock] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return h.unlockElemF(msg.Name)
	}
	h.msgHandlers[changePos] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return changePosF(msg.Name, msg.X, msg.Y, msg.Content)
	}
	h.msgHandlers[changeTextOfNode] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return changeTextOfNoteF(msg.Name, msg.Content, msg.View)
	}
	h.msgHandlers[changePosOfNode] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return changePosOfNote(msg.Name, msg.X, msg.Y, msg.View)
	}
	h.msgHandlers[createNode] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return createNoteF(msg.Name, msg.View)
	}
	h.msgHandlers[removeN] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return removeNoteF(msg.Name)
	}
	h.msgHandlers[getHTML] = func(msg JsonBodyStruct) (MsgForSend, error) {
		return getHTMLF()
	}
	return
}

func (h *Hub) AddConnection(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}

	el := h.users.Add(c)
	log.Println("connected ", c)
	defer func() {
		h.users.List.Remove(el)
		c.Close()
		log.Println("dissconnected ", c)
	}()

	for {
		var message Message
		err := c.ReadJSON(&message)
		if err != nil {
			log.Println("read:", err)
			break
		}

		msg, err := h.HandleMessage(message)
		if err != nil {
			log.Println("handle:", err)
			return
		}

		switch msg.forWhom {
		case caller:
			err = c.WriteJSON(msg.Message)
			if err != nil {
				log.Println("write:", err)
				return
			}
		case others:
			for e := h.users.Front(); e != nil; e = e.Next() {
				if e != el {
					err = e.Value.(*websocket.Conn).WriteJSON(msg.Message)
					if err != nil {
						log.Println("write:", err)
						return
					}
				}
			}
		}

	}
}

type TypeOfMessage int

const (
	_ TypeOfMessage = iota
	addSvg
	setSvg
	getSvg
	removeSVG
	createFromSvg
	setLocked
	addLock
	getLocked
	lockElem
	unlock
	changePos
	changeTextOfNode
	changePosOfNode
	createNode
	removeN
	setHTML
	getHTML
	size = iota
)

type ForUsers int

const (
	none ForUsers = iota
	caller
	others
)

type Message struct {
	Type TypeOfMessage  `json:"type"`
	Body JsonBodyStruct `json:"body"`
}

type MsgForSend struct {
	Message
	forWhom ForUsers
}

type JsonBodyStruct struct {
	Name    string        `json:"name"`
	X       float64       `json:"x"`
	Y       float64       `json:"y"`
	Content string        `json:"content"`
	View    string        `json:"view"`
	List    []interface{} `json:"list"`
}

type msgHandler func(JsonBodyStruct) (MsgForSend, error)

func (h *Hub) HandleMessage(msg Message) (msgTo MsgForSend, err error) {
	msgTo, err = h.msgHandlers[msg.Type](msg.Body)
	if err != nil {
		return
	}
	return msgTo, nil
}

func changePosF(name string, x float64, y float64, svg string) (msg MsgForSend, e error) {
	var el = models.Element{Name: name, Content: svg}
	msg.forWhom = others
	msg.Type = changePos
	msg.Body.Name = name
	msg.Body.X = x
	msg.Body.Y = y
	return msg, dao.Update(&el)
}

func changePosOfNote(name string, x float64, y float64, html string) (msg MsgForSend, e error) {
	var el = models.Element{Name: name, Content: html}
	msg.forWhom = others
	msg.Type = changePosOfNode
	msg.Body.Name = name
	msg.Body.X = x
	msg.Body.Y = y
	return msg, dao.Update(&el)
}

func (h *Hub) lockElemF(name string) (msg MsgForSend, e error) {
	h.lockedElems.Add(name)
	msg.forWhom = others
	msg.Type = addLock
	msg.Body.Name = name
	return msg, nil
}

func (h *Hub) unlockElemF(name string) (msg MsgForSend, e error) {
	h.lockedElems.RemoveByVal(name)
	msg.forWhom = others
	msg.Type = unlock
	msg.Body.Name = name
	return msg, nil
}

func (h *Hub) getLockedF() (msg MsgForSend, e error) {
	msg.forWhom = caller
	msg.Type = setLocked
	msg.Body.List = h.lockedElems.GetSlice()
	log.Println(h.lockedElems.GetSlice())
	return msg, nil
}

func removeNoteF(name string) (msg MsgForSend, e error) {
	msg.forWhom = others
	msg.Type = removeN
	msg.Body.Name = name
	return msg, dao.Delete(name)
}

func removeSVGF(name string) (msg MsgForSend, e error) {
	msg.forWhom = others
	msg.Type = removeSVG
	msg.Body.Name = name
	return msg, dao.Delete(name)
}

func createFromSVGF(name string, svg string) (msg MsgForSend, e error) {
	var el = models.Element{Name: name, Content: svg, Type: models.SVG}
	msg.forWhom = others
	msg.Type = createFromSvg
	msg.Body.Name = name
	msg.Body.Content = svg
	return msg, dao.Create(&el)
}

func createNoteF(name string, view string) (msg MsgForSend, e error) {
	var el = models.Element{Name: name, Content: view, Type: models.HTML}
	msg.forWhom = others
	msg.Type = createNode
	msg.Body.Name = name
	msg.Body.Content = view
	return msg, dao.Create(&el)
}

func changeTextOfNoteF(name string, text string, html string) (msg MsgForSend, e error) {
	var el = models.Element{Name: name, Content: html}
	msg.forWhom = others
	msg.Type = changeTextOfNode
	msg.Body.Name = name
	msg.Body.Content = text
	return msg, dao.Update(&el)

}

func getSVGF() (msg MsgForSend, e error) {

	svgs, e := dao.GetByType(models.SVG)
	if e == nil {
		svgsI := make([]interface{}, len(svgs))
		for i, s := range svgs {
			svgsI[i] = s
		}
		msg.forWhom = caller
		msg.Type = setSvg
		msg.Body.List = svgsI
		return msg, nil
	}
	return
}

func getHTMLF() (msg MsgForSend, e error) {
	html, e := dao.GetByType(models.HTML)
	if e == nil {
		htmlI := make([]interface{}, len(html))
		for i, s := range html {
			htmlI[i] = s
		}
		msg.forWhom = caller
		msg.Type = setHTML
		msg.Body.List = htmlI
		return msg, nil
	}
	return
}
