package main

import (
	"log"
	"net/http"

	"github.com/AlkorMizar/WebApp/app/hub"
)

var h hub.Hub = hub.NewHub()

func home(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "../template/index.html")

}

func connect(w http.ResponseWriter, r *http.Request) {
	log.Println("connecting")
	h.AddConnection(w, r)
}

func main() {

	http.HandleFunc("/", home)
	http.HandleFunc("/connect", connect)

	http.Handle("/scripts/", http.StripPrefix("/scripts/", http.FileServer(http.Dir("../scripts"))))

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("../static/"))))
	http.Handle("/static/lib/", http.StripPrefix("/static/lib/", http.FileServer(http.Dir("../static/lib/"))))

	log.Fatal(http.ListenAndServe(":8080", nil))
}
