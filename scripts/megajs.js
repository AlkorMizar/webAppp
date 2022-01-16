const addSvg=1,
    setSvg=2,
    getSvg=3,
    removeSvg=4,
    createFromSVG=5,
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



paper.install(window);
window.onload = function() {
    paper.setup('canvas');

    group = new Group()

    setListnerfor('brush', 0);
    setListnerfor('note', 1);
    setListnerfor('text', 2);
    setListnerfor('erase', 3);
    setListnerfor('move', 4);

    var tool = new Tool();
    var path;
    var nameF = 0;
    var option = 0;
    var path;
    var segment, pathForSelect;
    var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
    };

    var rect;
    var group ;
    var lockList = {};

    // Define a mousedown and mousedrag handler
    tool.onMouseDown = function(event) {
        switch (option) {
            case 0:
                prepareDraw(event);
                break;
            case 1:
                startArea(event);
                break;
            case 3:
                selectElem(event);
                break;
            case 4:
                selectElem(event);
                break;
        }
    }

    tool.onMouseDrag = function(event) {
        switch (option) {
            case 0:
                path.add(event.point);
                break;
            case 1:
                adjustArea(event);
                break;
            case 4:
                dragElem(event);
                break;
        }
    }

    tool.onMouseMove=function(event) {
        project.activeLayer.selected = false;
        if (event.item)
            event.item.selected = true;
    }

    tool.onMouseUp = function (event) {
        
        
        switch (option) {
            case 0:
                setLine(event)
                break;
            case 1:
                editeNote(event);
                break;
            case 2:
                editeText(event);
                break;
            case 3:
                removeElem(event)
                break;
        }
    }

    function prepareDraw(event) {
        if (path) {
            path.selected = false;
        }
        path = new Path({
            segments: [event.point],
            strokeColor: 'black',
            strokeWidth: 5,
            fullySelected: true,
        });
        path.name = "id" + path.id
    }



    function selectElem(event) {
        segment = pathForSelect = null;
        var hitResult = project.hitTest(event.point, hitOptions);
        if (!hitResult) {
            return;
        }
        pathForSelect = group.children[hitResult.item.name];
        if (!lockList[pathForSelect._name]) {
            connection.send(JSON.stringify({type:lockElem,body:{name:pathForSelect._name}}))
        } else {
            alert("Item is busy")
            pathForSelect = null;
        }
    }

    function startArea(e) {
        rect = new paper.Path.Rectangle({
            from: e.downPoint,
            to: e.point,
            strokeWidth: 1,
            strokeColor: 'blue'
        });
    }
    
    function adjustArea(e) {
        if (rect) {
            rect.remove();
        }
        rect = new paper.Path.Rectangle({
            from: e.downPoint,
            to: e.point,
            strokeWidth: 1,
            strokeColor: 'blue'
        });
    }

    function dragElem(event) {
        
        if (pathForSelect) {
            
            
            pathForSelect.translate(event.delta)
            /*
            pathForSelect._position.x += event.delta.x;
            pathForSelect._position.y += event.delta.y;*/
            var svg = pathForSelect.exportSVG({ asString: true });
            connection.send(JSON.stringify(
                {type:changePos,
                body:{
                    name:pathForSelect._name,
                    x:pathForSelect.position.x,
                    y:pathForSelect.position.y,
                    content:svg
                }
                }))
        }
    }

    function setLine(e) {
        path.simplify(10);
        group.addChild(path);
        
        
        var svg = path.exportSVG({ asString: true });
        
        connection.send(JSON.stringify(
            {type:createFromSVG,
            body:{
                name:path._name,
                content:svg
            }
            }))

    }

    function editeNote(event) {
        if (rect) {
            rect.remove();
        }

        rect = new paper.Path.Rectangle({
            from: event.downPoint,
            to: event.point,
            strokeWidth: 1,
            fillColor: "Aqua",
            strokeColor: 'blue'
        });
        setNote(rect.bounds, "-", ("idd" + nameF), true);
        nameF++;
        rect.remove();
    }

    function removeElem(event) {
        
        if (pathForSelect) {
            connection.send(JSON.stringify(
                {type:removeSvg,
                body:{name:pathForSelect._name}
                }))
            pathForSelect.remove();
        }
    }

    function editeText(event) {
        if (event.item) {

            var p = event.item.hitTest(event.point, hitOptions).item;
            if (p.className == 'PointText') {
                if (!lockList[p.name]) {
                    var bounds = p.bounds;
                    bounds.width += 16;
                    bounds.height += 16;
                    connection.send(JSON.stringify(
                        {type:lockElem,
                        body:{name:p.name}
                        }))
                    setText(event, p.bounds, p.content);
                    selectElem(event);
                    removeElem(event);
                } else alert("Item is busy")
            }
        }
        else {
            var bounds = new Rectangle(event.downPoint, [100, 40]);
            setText(event, bounds, "");
        }
    }

    function setListnerfor(id, number) {
        document.getElementById(id).addEventListener('click', function (event) {
            
            option = number;
        })
    }

    $("#brush").prop("disabled", true);
    $("#note").prop("disabled", true);
    $("#text").prop("disabled", true);
    $("#erase").prop("disabled", true);
    $("#move").prop("disabled", true);

    

    function addSVGF(svg, id, x, y) {
        item = project.exportSVG(svg)
        item.point = new Point(x, y);
        item.name = id;
    }

    function setSVGF(list) {
        for (var i = 0; i < list.length; i++) {
            
            var el = project.importSVG(list[i].content);
            el.name = list[i].name;
            group.addChild(el);
        }
    }

    function createFromSVGF(id, svg) {
        var el = group.children[id];
        if (el) {
            if (lockList[el.name]) {
                lockList[el.name] = false;
                lockList[el.name + el.name] = true;
            }
            el.name = el.name + el.name;
        }
        el = project.importSVG(svg);
        el.name = id;
        group.addChild(el);
    }

    function removeSVGF(id) {
        group.children[id].remove()
    }


    function setLockedF(list) {
        for (var i = list.length - 1; i >= 0; i--) {
            lockList[list[i]] = true;
        }
    }

    function addLockF(id) {
        lockList[id] = true;
    }

    function unLockF(id) {
        lockList[id] = false;
    }

    function changePosF(id, x, y) {
            group.children[id].position = new Point(x, y);
    }

    var connection = new WebSocket("ws://"+window.location.host+"/connect" );
    
    connection.onopen = function () {

        $("#brush").prop("disabled", false);
        $("#note").prop("disabled", false);
        $("#text").prop("disabled", false);
        $("#erase").prop("disabled", false);
        $("#move").prop("disabled", false);

        connection.send(JSON.stringify({type:getLocked,body:null}) )
        connection.send(JSON.stringify({type:getSvg,body:null}))
        connection.send(JSON.stringify({type:getHTML,body:null}) )

        connection.onmessage = function(event) {
            try{
            let msg = JSON.parse(event.data);
            let body=msg.body
            
            switch(msg.type){
                //addSVG
                case addSvg:
                    addSVGF(body.content,body.name,body.x,body.y);
                    break;
                case setSvg:
                    setSVGF(body.list);
                    break;
                case createFromSVG:
                    createFromSVGF(body.name, body.content)
                    break;
                case removeSvg:
                    removeSVGF(body.name)
                    break;   
                case setLocked:
                    setLockedF(body.list)
                    break;
                case unlock:
                    unLockF(body.name)    
                    break;
                case addLock:
                    addLockF(body.name)
                    break;
                case changePos:
                    changePosF(body.name,body.x,body.y)
                    break;    
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
                    changeTextOfNote(body.name,body.content);
                    break;        
            }
        }catch(e){
            console.log(e)
        }
        }

    }

    



    function setText(event, bounds, text) {
        console.log("setting text",text)
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
            console.log("focusot")
            if (e.target.value.trim() != "") {
                console.log(e.target.value)
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
                    {type:createFromSVG,
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
        }
        
        var draggable 
        draggable = new PlainDraggable(document.getElementById(name));
        draggable.containment = { left: 0, top: 0, width: 0, height: 0 };            
        draggable.onDragStart = function (e) {
            
            if (lockList[this.element.id]) {
                this.containment = { left: 0, top: 0, width: 0, height: 0 };
                alert("Item is busy")
            } else {
                this.containment = { left: pos.left, top: pos.top, width: 5000, height: 5000 };
            }
        }
        draggable.onMove = function (e) {
            console.log(id,x,y)
            if(!$("#move input").prop("checked")){
                return
            }
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
        
    
        textarea.keyup(function (e) {
            console.log("dsadsa")
            if (!lockList[e.target.id]) {
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

        textarea.mousedown(function (e) {
            console.log("out")
            textarea.focusout()
            if (!lockList[e.target.id]) {
                
                if($("#move input").prop("checked")){
                    console.log("in")
                    draggable.containment = { left: pos.left, top: pos.top, width: 5000, height: 5000 };
                }else{
                    draggable.containment = { left: 0, top: 0, width: 0, height: 0 };
                }
            } else {
                alert("Item is busy")
            }
        })

        textarea.mouseup(function (e) {
            try{
                console.log(draggable)
                draggable.containment = { left: 0, top: 0, width: 0, height: 0 };
               
            }catch(e){}
        })
    
        textarea.focusout(function (e) {
            connection.send(JSON.stringify(
                {type:unlock,
                 body:{
                     name:e.target.id,
                 }}))
        });
    
        textarea.focusin(function (e) {
            if (!lockList[e.target.id]) {
                if ($("#note input").prop("checked")) {
                    placeCaretAtEnd(e.target)
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
        
    
        if (fl){
            connection.send(JSON.stringify(
                {type:createNode,
                 body:{
                     name:name,
                     view:textarea[0].outerHTML
                 }}))
        }
    
        textarea.click(function (e) {
            console.log("cklsa")
            if (!lockList[e.target.id]) {
                if ($("#erase input").prop("checked")) {
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
                } else if ($("#note input").prop("checked")) {
                    $(e.target).focus();
                }
            }
        })
    };
    
    
    function setHTMLF(list) {
        for (var i = 0; i < list.length; i++) {
            setNote(null, list[i].content, list[i].name, false)
        }
    }
    
    function changePosOfNote(id, x, y) {
        console.log(id,x,y)
        dr = new PlainDraggable(document.getElementById(id));
        dr.containment = { left: $("#parent-div").position().left, top: $("#parent-div").position().top, width: 5000, height: 5000 };
        dr.left = x;
        dr.top = y;
        dr.containment = { left: 0, top: 0, width: 0, height: 0 };
        dr.remove()
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
        
}

