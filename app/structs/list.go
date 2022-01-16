package structs

import (
	"container/list"
	"log"
	"sync"
)

type List struct {
	*list.List
	lock sync.RWMutex
}

func NewList() (l *List) {
	l = &List{}
	l.List = list.New()
	log.Println(l)
	return
}

func (l *List) Add(v interface{}) *list.Element {
	l.lock.Lock()
	defer l.lock.Unlock()
	return l.PushBack(v)
}

func (l *List) removeEl(c *list.Element) {
	l.lock.Lock()
	defer l.lock.Unlock()
	l.Remove(c)
}

func (l *List) Remove(v interface{}) {
	l.lock.RLock()
	e := l.Front()
	for ; e != nil && e.Value != v; e = e.Next() {
	}
	l.lock.RUnlock()

	if e != nil {
		l.removeEl(e)
	}
}

func (l *List) GetSlice() (sl []interface{}) {
	sl = make([]interface{}, l.Len())
	i := 0
	l.lock.RLock()
	defer l.lock.RUnlock()
	for e := l.Front(); e != nil; e = e.Next() {
		sl[i] = e.Value
	}
	return
}
