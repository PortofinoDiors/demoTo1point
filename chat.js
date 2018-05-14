//A demo for web development, front-end js part.
$(function () {


    var penWeight = 1;
    var penColor = 'black';
    var btn = document.getElementsByTagName('button');
    var isEraser = false;

    var canvas = document.getElementById('canvas');
    // canvas.getElementById('canvas').setAttribute("width","10%");
    // canvas.getElementById('canvas').setAttribute("height","10%");
    var cvs = canvas.getContext('2d');
    var username = $('#username').val();
    var btn_clear = document.getElementById('clear_canvas');
    var btn_erase = document.getElementById('erase');
    var total = 0;
    var isMySelf = 0;
    var isStart = 0;
    // Correctly decide between ws:// and wss://

    // var ws_path = "/chat/stream/";
    // console.log("Connecting to " + ws_path);

    // var webSocketBridge = new channels.WebSocketBridge();
    // webSocketBridge.connect(ws_path);

    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    var ws_path = ws_scheme + '://' + window.location.host + "/chat/stream/";
    console.log("Connecting to " + ws_path);
    var webSocketBridge = new ReconnectingWebSocket(ws_path);

    //webSocketBridge.connect(ws_path);
    // Handle incoming messages
    webSocketBridge.onmessage = function(message) {
        var data = JSON.parse(message.data);
        // Decode the JSON
        console.log("Got websocket message", data);
        // Handle errors
        if (data.error) {
            alert(data.error);
            return;
        }
        // Handle joining
        if (data.join) {
            console.log("Joining room " + data.join);
            // var roomdiv = $(
            //         "<div class='room' id='room-" + data.join + "'>" +
            //         "<h2>" + data.title + "</h2>" +
            //         "<div class='messages'></div>" +
            //         "<form><input><button>Send</button></form>" +
            //         "</div>"
            // );
            // Hook up send button to send a message
            $('#send_button').click(function () {
                var isplayer = $('#isplayer').val();
                console.log(isplayer);
                if(isplayer == 'yes') {
                    webSocketBridge.send(JSON.stringify({
                        "command": "send",
                        "room": data.join,
                        "message": $('#text').val()
                    }));
                    //roomdiv.find("input").val("");
                    $('#text').val("");
                    console.log($('#text').val());
                    return false;
                }
            });

            canvas.onmouseenter = function(){

                canvas.onmousedown = function(e){

                    var curuser = $('#username').val();
                    var drawinguser = $('#drawinguser').val();
                    //console.log("1: " + curuser + "2: " + drawinguser);
                    if(curuser == drawinguser)
                    {
                        if(isStart == 0) {
                            isStart = 1;
                            penWeight = 1;
                            penColor = 'black';
                            isEraser = false;
                        }
                        var start_x = e.clientX - canvas.offsetLeft + document.body.scrollLeft;
                        var start_y = e.clientY - canvas.offsetTop + document.body.scrollTop;
                        webSocketBridge.send(JSON.stringify({
                            "command": "send",
                            "room": data.join,
                            "message": "graphstart",
                            "start_x": e.clientX - canvas.offsetLeft,
                            "start_y": e.clientY - canvas.offsetTop,
                        }));
                        if(isEraser === false || isEraser == true){
                            if(isEraser === true) {
                                canvas.globalCompositeOperation="destination-over";
                            }
                            cvs.beginPath();
                            cvs.moveTo(start_x, start_y);

                            cvs.lineCap = 'round';
                            cvs.lineJoin="round";
                            cvs.strokeStyle = penColor;
                            cvs.lineWidth = penWeight;

                            cvs.lineTo(start_x, start_y);
                            cvs.stroke();
                        }

                        canvas.onmousemove = function(e){
                            var move_x = e.clientX - canvas.offsetLeft + document.body.scrollLeft;
                            var move_y = e.clientY - canvas.offsetTop + document.body.scrollTop;
                            //console.log('send' + 'move_x: ' + move_x + 'move_y: ' + move_y);
                            webSocketBridge.send(JSON.stringify({
                                "command": "send",
                                "room": data.join,
                                "message": "graphmove",
                                "move_x": e.clientX - canvas.offsetLeft,
                                "move_y": e.clientY - canvas.offsetTop,
                            }));
                            if(isEraser === false || isEraser === true){
                                if(isEraser === true) {
                                    canvas.globalCompositeOperation="destination-over";
                                }
                                cvs.lineTo(move_x, move_y);
                                cvs.stroke();
                            }
                        }
                        canvas.onmouseup = function(e){
                            webSocketBridge.send(JSON.stringify({
                                "command": "send",
                                "room": data.join,
                                "message": "graphwait",
                            }));
                            canvas.onmousemove = null;
                            canvas.onmouseup = null;
                        }
                    }
                }
            }

            canvas.onmouseleave = function(){
                webSocketBridge.send(JSON.stringify({
                    "command": "send",
                    "room": data.join,
                    "message": "graphend",
                }));
                canvas.onmousemove = null;
                canvas.onmouseup = null;
                canvas.onmousedown = null;
            }

            btn_clear.onclick = function(){
                var curuser = $('#username').val();
                var drawinguser = $('#drawinguser').val();
                if(curuser == drawinguser) {
                    webSocketBridge.send(JSON.stringify({
                        "command": "send",
                        "room": data.join,
                        "message": "clear",
                    }));
                    var tempWidth = canvas.width;
                    canvas.width = canvas.height;
                    canvas.width = tempWidth;
                }
            }

            btn_erase.onclick = function(){
                var curuser = $('#username').val();
                var drawinguser = $('#drawinguser').val();
                if(curuser == drawinguser) {
                    webSocketBridge.send(JSON.stringify({
                        "command": "send",
                        "room": data.join,
                        "message": "erase",
                        "isEraser": isEraser,
                    }));
                    if(isEraser === false) {
                        isEraser = true;
                        penWeight = 20;
                        penColor = 'white';
                        //canvas.globalCompositeOperation = 'source-over';
                    } else {
                        isEraser = false;
                        penWeight = 1;
                        penColor = 'black';
                    }
                }
            }
            // $("#chats").append(roomdiv);
            // Handle leaving
        } else if (data.leave) {
            console.log("Leaving room " + data.leave);
            $("#room-" + data.leave).remove();
            // Handle getting a message
        } else if (data.message || data.msg_type == 4) {
            // var msgdiv = $("#room-" + data.room + " .messages");
            var msgdiv = $("#display_message");
            var ok_msg = "";
            // msg types are defined in chat/settings.py
            // Only for demo purposes is hardcoded, in production scenarios, consider call a service.
            switch (data.msg_type) {
                case 0:
                    // Message
                    var answer = data.message;
                    var question = $('#question').val();
                    var user1 = data.username;
                    var user2 = $('#drawinguser').val();
                    console.log("user1" + user1 + "user2" + user2);
                    if(answer != question || user1 == user2)
                    {
                        ok_msg = "<div class='message'>" +
                                "<span class='username'>" + data.username + ": " + "</span>" +
                                "<span class='body'>" + data.message + "</span>" +
                                "</div>";
                        console.log(data.message);
                    }
                    else
                    {
                        var points = parseInt($('#points').val(), 10);
                        ok_msg = "<div class='message'>" +
                                "<span class='username'>" + data.username + ": " + "</span>" +
                                "<span class='body'>" + "+" + points + "points" + "</span>" +
                                "</div>";

                        var curuser = $('#username').val();
                        if(curuser == data.username)
                        {
                            $.ajax({
                                url: '/score_update/',
                                contentType : "application/json; charset=utf-8",
                                type: 'post',
                                data: JSON.stringify({'username': data.username, 'score': points}),
                                datatype: 'json',
                                success: function (data) {
                                }
                            })
                        }
                        points = points - 1;
                        $('#points').val(points);
                        console.log(data.message);
                    }
                    break;
                case 1:
                    // Warning / Advice messages
                    ok_msg = "<div class='contextual-message text-warning'>" + data.message +
                            "</div>";
                    break;
                case 2:
                    // Alert / Danger messages
                    ok_msg = "<div class='contextual-message text-danger'>" + data.message +
                            "</div>";
                    break;
                case 3:
                    // "Muted" messages
                    ok_msg = "<div class='contextual-message text-muted'>" + data.message +
                            "</div>";
                    break;
                case 4:
                    // User joined room
                    ok_msg = "<div class='contextual-message text-muted'>" + data.username +
                            " joined the room!" +
                            "</div>";
                    var playernum = parseInt($('#playernum').val(), 10);
                    var curuser = $('#username').val();
                    console.log("username: " + curuser + "data: " + data.username);
                    if(curuser == data.username)
                    {
                        isMySelf = 1;
                    }
                    $('#playernum').val(playernum + 1);
                    console.log('num:' + $('#playernum').val());
                    break;
                case 5:
                    // User left room
                    ok_msg = "<div class='contextual-message text-muted'>" + data.username +
                            " left the room!" +
                            "</div>";
                    break;
                default:
                    console.log("Unsupported message type!");
                    return;
            }
            msgdiv.append(ok_msg);

            msgdiv.scrollTop(msgdiv.prop("scrollHeight"));
        } else if(data.start_x && username != data.username) {
            var start_x = data.start_x + document.body.scrollLeft;
            var start_y = data.start_y + document.body.scrollTop;

            if(isEraser === false || isEraser === true) {
                if(isEraser === true) {
                    canvas.globalCompositeOperation="destination-over";
                }
                cvs.beginPath();
                cvs.moveTo(start_x, start_y);

                cvs.lineCap = 'round';
                cvs.lineJoin="round";
                cvs.strokeStyle = penColor;
                cvs.lineWidth = penWeight;

                cvs.lineTo(start_x, start_y);
                cvs.stroke();
            }
        } else if(data.move_x && username != data.username) {
            var move_x = data.move_x + document.body.scrollLeft;
            var move_y = data.move_y + document.body.scrollTop;
            //console.log('receive' + 'move_x: ' + move_x + 'move_y: ' + move_y);

            if(isEraser === false || isEraser === true){
                if(isEraser === true) {
                    canvas.globalCompositeOperation="destination-over";
                }
                cvs.lineTo(move_x, move_y);
                cvs.stroke();
            }
        } else if(data.wait && username != data.username) {
            cvs.closePath();
        } else if(data.clear && username != data.username) {
            var tempWidth = canvas.width;
            canvas.width = canvas.height;
            canvas.width = tempWidth;
        } else if(data.erase && username != data.username) {
            if(data.isEraser === true) {
                isEraser = false;
                penWeight = 1;
                penColor = 'black';
            } else {
                isEraser = true;
                penWeight = 20;
                penColor = 'white';
                //canvas.globalCompositeOperation = 'source-over';
            }
        } else {
            console.log("Cannot handle message!");
        }
    };

    // Says if we joined a room or not by if there's a div for it
    inRoom = function (roomId) {
        return $("#room-" + roomId).length > 0;
    };

    var flag = 0;

    // Room join/leave
    $("#joinroom").click(function () {
        roomId = 1;
        // Join room
        if(flag === 0) {
            webSocketBridge.send(JSON.stringify({
                "command": "join",
                "room": roomId
            }));
            flag = 1;
            $.ajax({
                url: '/join_room/',
                type: 'post',
                datatype: 'json',
                success: function (data) {
                    $('#drawinguser').val(data['drawinguser']);
                    $('#question').val(data['question']);
                    $('#isplayer').val(data['isplayer']);
                    console.log("success" + $('#isplayer').val());
                    // console.log(data['drawinguser']);
                    if(isMySelf == 0)
                    {
                        console.log("num1 from backend: " + data['playernum']);
                        $('#playernum').val(parseInt(data['playernum'], 10) - 1);
                    }
                    else
                    {
                        console.log("num2 from backend: " + data['playernum']);
                        $('#playernum').val(parseInt(data['playernum'], 10));
                    }
                    // console.log(data['question']);
                }
            })

        } 
        // else {
        //     webSocketBridge.send({
        //         "command": "leave",
        //         "room": roomId
        //     });
        //     flag = 0;
        // }
    });

    // Helpful debugging
    webSocketBridge.onopen = function () {
        console.log("Connected to chat socket");
    };
    webSocketBridge.onclose = function () {
        console.log("Disconnected from chat socket");
    }
});