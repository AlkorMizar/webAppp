const addSvg=1,
      setSvg=2,
      getSvg=3,
      removeSVG=4,
      createFromSvg=5,
      setLocked=6,
      addLock=7,
      getLocked=8,
      lockElem=9,
      unlock=10,
      changePos=11,
      changeTextOfNode=12,
      changePosOfNode=13,
      createNode = 14,
      removeN = 15,
      setHTML=16,
      getHTML=17;


var group;
var connection;
var lockList;
function setText(event, bounds, text) {
    var pos = $("#parent-div").position();
    var textarea = $(
        "<textarea class='dynamic-textarea' " +
        "style='position:absolute; left:" + (bounds.x + pos.left) +
        "px; top:" + (bounds.y + pos.top) + "px; width: " + bounds.width +
        "px; height: " + bounds.height +
        "px; resize: both;' placeholder='Enter text' cols='20' wrap='hard'>" + text + "</textarea>");
    $("#parent-div").append(textarea);

    textarea.focus();

    textarea.focusout(function (e) {
        if (e.target.value.trim() != "") {
            var pos = $("#parent-div").position();
            var y = $(e.target).position().top - pos.top + 16
            var x = $(e.target).position().left - pos.left
            var text = new paper.PointText({
                point: [x, y],
                content: e.target.value,
                fillColor: 'black',
                fontFamily: 'Courier New',

                fontSize: 16
            });
            text.name = "id" + text.id
            group.addChild(text);
            value = e.target.value;
            var svg = text.exportSVG({ asString: true });
            connection.send(JSON.stringify(
                {type:createFromSvg,
                 body:{
                     name:text.name,
                     content:svg
                 }}))
        }
        $(e.target).remove();
    })
};



function setNote(bounds, text, name, fl) {
    var pos = $("#parent-div").position();
    var textarea;
    if (fl) {
        textarea = $("<div id='" + name + "'contenteditable='true'" +
            "style='position:absolute; left:" + (bounds.x + pos.left) +
            "px; top:" + (bounds.y + pos.top) + "px; width: " + bounds.width +
            "px; height: " + bounds.height +
            "px; resize: both;; background-color:PaleTurquoise;border-color:MidnightBlue;border-style: solid;overflow: auto'></div>");
        textarea.append(text);
    } else textarea = $(text);
    $(textarea).appendTo("#parent-div");

    if (fl) {
        textarea.focus();
        placeCaretAtEnd(document.getElementById(name));
    }

    draggable = new PlainDraggable(document.getElementById(name));
    draggable.onDragStart = function (e) {
        console.log("on drag start")
        if (lockList[this.element.id]) {
            this.containment = { left: 0, top: 0, width: 0, height: 0 };
            alert("Item is busy")
        } else {
            if (!$("#move input").prop("checked")) {
                console.log("you cant move")
                this.containment = { left: 0, top: 0, width: 0, height: 0 };
            } else {
                console.log("you can move")
                this.containment = { left: pos.left, top: pos.top, width: 5000, height: 5000 };
            }
        }
    }

    $(textarea).keyup(function (e) {
        if (!lockList[e.target.id]) {
            if ((e.keyCode || e.which) == 13) {
                $(e.target).append("-");
                placeCaretAtEnd(document.getElementById(e.target.id));
            }
            connection.send(JSON.stringify(
                {type:changeTextOfNode,
                 body:{
                     name:e.target.id,
                     content:document.getElementById(e.target.id).innerHTML,
                     view:document.getElementById(e.target.id).outerHTML,
                 }}))
        } else {
            alert("Item is busy")
        }
    })

    $(textarea).focusout(function (e) {
        connection.send(JSON.stringify(
            {type:unlock,
             body:{
                 name:e.target.id,
             }}))
    });

    $(textarea).focusin(function (e) {
        if (!lockList[e.target.id]) {
            if ($("#note").prop("checked")) {
                placeCaretAtEnd(document.getElementById(e.target.id));
                connection.send(JSON.stringify(
                    {type:lockElem,
                     body:{
                         name:e.target.id,
                     }}))
            } else {
                e.target.blur()
            }
        } else {
            e.target.blur();
            alert("Item is busy")
        }
    })

    draggable.onMove = function (e) {
        console.log("move")
        var id = this.element.id,
            x = e.left,
            y = e.top;
        var name = this.element.id
        connection.send(JSON.stringify(
            {type:changePosOfNode,
             body:{
                 name:id,
                 x:x,
                 y:y,
                 view:document.getElementById(name).outerHTML
             }}))
        connection.send(JSON.stringify(
        {type:unlock,
            body:{
                name:id,
            }}))
    }

    if (fl){
        connection.send(JSON.stringify(
            {type:createNode,
             body:{
                 name:name,
                 view:textarea[0].outerHTML
             }}))
    }

    textarea.click(function (e) {
        if (!lockList[e.target.id]) {
            if ($("#erase").prop("checked")) {
                connection.send(JSON.stringify(
                    {type:lockElem,
                     body:{
                         name:e.target.id
                     }}))

                connection.send(JSON.stringify(
                        {type:removeN,
                         body:{
                             name:e.target.id
                         }}))
                $(e.target).remove();
            } else if ($("#note").prop("checked")) {
                placeCaretAtEnd(document.getElementById(e.target.id));
                $(e.target).focus();
            }
        }
    })
};

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
        && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}


function setHTMLF(list) {
    for (var i = 0; i < list.length; i++) {
        setNote(null, list[i].content, list[i].name, false)
    }
}

function changePosOfNote(id, x, y) {
    draggable = new PlainDraggable(document.getElementById(id));
    draggable.left = x;
    draggable.top = y;
}

function removeNote(id) {
    $("#" + id).remove();
}

function createNote(id, html) {
    var el = (document.getElementById(id));
    if (el) {
        if (lockList[el.id]) {
            lockList[el.id] = false;
            lockList[el.id + el.id] = true;
        }
        el.id = el.id + el.id;

        draggable = new PlainDraggable(document.getElementById(el.id));
    }

    setNote(null, html, id, false)
}

function changeTextOfNote(id, text) {
    id = "#" + id;
    $(id).html(text)

}

function setVar(con, gr, ll,msgHnl) {
    group = gr;
    lockList = ll
    connection = con;
    connection.onmessage = function(event) {
        let msg = JSON.parse(event.data);
        let body=msg.body
        switch(msg.type){
            case setHTML:
                setHTMLF(body.list)
                break;
            case changePosOfNode:
                changePosOfNote(body.name,body.x,body.y);
                break;
            case removeN:
                removeNote(body.name)
                break;
            case createNode:
                createNote(body.name,body.content)
                break;
            case changeTextOfNode:
                changeTextOfNote(body.name,body.x,body.y);
                break;      
            //1-8
            default:
                msgHnl(msg)
                break;   
        }
    }

    connection.send(JSON.stringify({type:getHTML,body:null}) )
}
