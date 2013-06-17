window.addEventListener("load", function () {

    // サーバーサイドのsocket.IOに接続する
    var socket = io.connect("/");

    // 領域の変数を定義する
    var bgcArea = document.getElementById("bgCanvasArea");
    var bgc = document.getElementById("bgCanvas");
    var canvasArea = document.getElementById("canvasArea");
    var canvas = document.getElementById("myCanvas");

    // 背景領域サイズをCanvasへ設定
    canvas.width = canvasArea.clientWidth;
    canvas.height = canvasArea.clientHeight;

    // 背景領域位置をCanvasへ設定
    canvasArea.style.top = bgcArea.offsetTop + 'px';
    canvasArea.style.left = bgcArea.offsetLeft + 'px';

    // Canvas描画に必要な変数を定義する
    var c = canvas.getContext("2d");
    var drawing = false;
    var oldPos;
    var width = { 5: "small", 10: "middle", 20: "large"} // 線の太さとIDの関係
    var isTouch = ('ontouchstart' in window); // タッチ可能な環境か判定

    // Canvasを初期化する
    c.lineJoin = "round";
    c.lineCap = "round";

    // WebStorageロードor初期化(黒,small)
    if (!sessionStorage.getItem("color")) { sessionStorage.setItem("color", "black"); }
    if (!sessionStorage.getItem("lineWidth")) { sessionStorage.setItem("lineWidth", 5); }
    if (!sessionStorage.getItem("tool")) { sessionStorage.setItem("tool", "draw"); }

    //ツール群の初期設定
    document.getElementById(sessionStorage.getItem("color")).setAttribute("class", "selected");
    document.getElementById(width[sessionStorage.getItem("lineWidth")]).setAttribute("class", "selected");
    document.getElementById(sessionStorage.getItem("tool")).setAttribute("class", "selected");

    // Canvas上の座標を計算する為の関数たち
    function scrollX() {
        return document.documentElement.scrollLeft || document.body.scrollLeft;
    }
    function scrollY() {
        return document.documentElement.scrollTop || document.body.scrollTop;
    }
    function getPos(e) {
        var rect = e.target.getBoundingClientRect();
        var mouseX = Math.floor(e.clientX - rect.left);
        var mouseY = Math.floor(e.clientY - rect.top);
        return { x: mouseX, y: mouseY };
    }
    function getPosT(e) {
        var rect = e.target.getBoundingClientRect();
        var mouseX = Math.floor(e.touches[0].clientX - rect.left);
        var mouseY = Math.floor(e.touches[0].clientY - rect.top);
        return { x: mouseX, y: mouseY };
    }

    // 描画アクション
    function startFunction(event) {
        // ページの反応を止める
        event.preventDefault();
        console.log("canvasStart");
        var tool = sessionStorage.getItem("tool");
        oldPos = isTouch ? getPosT(event) : getPos(event);
        if (tool == "memo") {
            //メモを作成する
            socket.emit("createMemo", {
                after: oldPos,
                meetingID: $(meetingID).val()
            });
            sessionStorage.setItem("tool", "");
            shaded("tool")
        }
        else { drawing = true; }
    }
    function endFunction(event) {
        console.log("canvasEnd");
        drawing = false;
    }
    function moveFunction(event) {
        if (drawing) {
            event.preventDefault();
            var pos = isTouch ? getPosT(event) : getPos(event);
            var tool = sessionStorage.getItem("tool");
            console.log("canvasMove : x=" + pos.x + ", y=" + pos.y + ", drawing=" + drawing);
            // socket.IOサーバーに、描画の情報を送付する
            socket.emit(sessionStorage.getItem("tool"), { before: oldPos, after: pos,
                color: sessionStorage.getItem("color"),
                lineWidth: sessionStorage.getItem("lineWidth"),
                meetingID: $(meetingID).val()
            });
            oldPos = pos;
        }
    }
    function outFunction(event) {
        console.log("canvasOut");
        drawing = false;
    }

    // Canvasに対するアクションを設定
    // マウスイベント
    canvas.addEventListener("mousedown", startFunction);
    canvas.addEventListener("mousemove", moveFunction);
    canvas.addEventListener("mouseup", endFunction);
    canvas.addEventListener("mouseout", outFunction);
    // タッチイベント
    canvas.addEventListener("touchstart", startFunction);
    canvas.addEventListener("touchmove", moveFunction);
    canvas.addEventListener("touchend", endFunction);

    //スライドメニューの開閉処理
    function slideMenuToggle(nowSelect) {
        if ($(nowSelect).closest('ul').attr("class") == "slideMenu") {
            $(nowSelect).siblings('li').slideToggle('fast');
        };
    }

    //スライドメニューの初期表示:選択中のアイコンのみ表示させる
    $(".slideMenu li.selected").css("display", "block");


    // 色を選択した場合の処理
    $("#black").click(function () { highlighted("color", this); sessionStorage.setItem("color", "black"); slideMenuToggle(this); });
    $("#blue").click(function () { highlighted("color", this); sessionStorage.setItem("color", "blue"); slideMenuToggle(this); });
    $("#red").click(function () { highlighted("color", this); sessionStorage.setItem("color", "red"); slideMenuToggle(this); });
    $("#green").click(function () { highlighted("color", this); sessionStorage.setItem("color", "green"); slideMenuToggle(this); });

    // 太さを選択した場合の処理
    $("#small").click(function () { highlighted("width", this); sessionStorage.setItem("lineWidth", 5); slideMenuToggle(this); });
    $("#middle").click(function () { highlighted("width", this); sessionStorage.setItem("lineWidth", 10); slideMenuToggle(this); });
    $("#large").click(function () { highlighted("width", this); sessionStorage.setItem("lineWidth", 20); slideMenuToggle(this); });

    //ツールを選択した場合の処理
    $("#draw").click(function () { highlighted("tool", this); sessionStorage.setItem("tool", "draw"); slideMenuToggle(this); });
    $("#erase").click(function () { highlighted("tool", this); sessionStorage.setItem("tool", "erase"); slideMenuToggle(this); });
    $("#memo").click(function () { highlighted("tool", this); sessionStorage.setItem("tool", "memo"); slideMenuToggle(this); });

    // socket.IOサーバーから描画情報を受け取った場合の処理
    // 受け取った情報を元に、Canvasに描画を行う
    socket.on("draw", function (data) {
        console.log("on draw : " + data);
        c.strokeStyle = data.color;
        c.lineWidth = data.lineWidth
        c.beginPath();
        c.moveTo(data.before.x, data.before.y);
        c.lineTo(data.after.x, data.after.y);
        c.stroke();
        c.closePath();
    });

    //Canvasに線の消去を行う
    socket.on("erase", function (data) {
        console.log("on erase : " + data);
        c.save();
        c.lineWidth = data.lineWidth
        c.globalCompositeOperation = 'destination-out'; //消去モードに設定
        c.beginPath();
        c.moveTo(data.before.x, data.before.y);
        c.lineTo(data.after.x, data.after.y);
        c.stroke();
        c.closePath();
        c.restore(); //設定を元にもどす
    });

    // 背景を変更する
    socket.on("changeBgImage", function (data) {
        if (data && data.fileDir && data.fileList && data.fileList.length > 0) {
            $(bgc).empty();
            for (i = 0; i < data.fileList.length; i++) {
                $(bgc).append('<img src="' + data.fileDir + '/' + data.fileList[i] + '" style="height:640px;" >');
                $(bgc).append('<br><span>' + (i + 1) + 'ページ</span><br>');
            }
            bgc.height = 660 * data.fileList.length;
            canvas.height = 660 * data.fileList.length;
            if (!data.isPlayback && data.isPlayback == false) socket.emit("messageSys", { text: "[背景用PDF設定完了]", meetingID: $(meetingID).val() });
        } else {
            if (!data.isPlayback && data.isPlayback == false) socket.emit("messageSys", { text: "[背景用PDF設定失敗]", meetingID: $(meetingID).val() });
        }
    });


}, false);

// 選択したツールボックスを強調表示
function highlighted(type, nowSelect){
  shaded(type);
  nowSelect.setAttribute("class", "selected");
}

function shaded(type){
    if(document.querySelector("#" + type + " li.selected")){
        document.querySelector("#" + type + " li.selected").removeAttribute("class");   
    }
}

$(document).ready(function () {
    var bgcArea = document.getElementById("bgCanvasArea");
    var bgc = document.getElementById("bgCanvas");
    var canvasArea = document.getElementById("canvasArea");
    var canvas = document.getElementById("myCanvas");

    // キャンバスと背景のスクロールを同期する。
    $("#canvasArea").scroll(function () {
        $("#bgCanvasArea").scrollTop($("#canvasArea").scrollTop());
    });

    // イベントをキャンセルするハンドラです.
    var cancelEvent = function (event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    // ドラッグドロップからの入力
    var droppable = $("#droppable");

    // dragenter, dragover イベントのデフォルト処理をキャンセルします.
    droppable.bind("dragenter", cancelEvent);
    droppable.bind("dragover", cancelEvent);

    // ドロップ時のイベントハンドラを設定します.
    var handleDroppedFile = function (event) {
        // ファイルは複数ドロップされる可能性がありますが, ここでは 1 つ目のファイルを扱います.
        document.getElementById("fileToUpload").files[0] = event.originalEvent.dataTransfer.files[0];
        fileSelected();
        // デフォルトの処理をキャンセルします.
        cancelEvent(event);
        return false;
    }
    // ドロップ時のイベントハンドラを設定します.
    droppable.bind("drop", handleDroppedFile);

    var bgcDrop = document.getElementById("droppable");
    $('#uploadDoc').click(function () {
        bgc.style.display = "none";
        canvasArea.style.display = "none";
        bgcDrop.style.display = "block";
        bgcDrop.style.zIndex = 99;
    });
    $('#uploadSubmit').click(function () {
        uploadFile();
        bgcDrop.style.display = "none";
        bgcDrop.style.zIndex = 1;
        bgc.style.display = "block";
        canvasArea.style.display = "block";
    });
    $('#uploadCancel').click(function () {
        bgcDrop.style.display = "none";
        bgcDrop.style.zIndex = 1;
        bgc.style.display = "block";
        canvasArea.style.display = "block";
    });
    $("#fileToUpload").change(function () {
        $("#mask_file_01").val($("#fileToUpload").val());
    });
    $("#mask_file_01").click(function () {
        $("#fileToUpload").click();
    });
});

// ファイル選択時の処理
function fileSelected() {
    var file = document.getElementById('fileToUpload').files[0];
    if (file) {
        var fileSize = 0;
        if (file.size > 1024 * 1024)
            fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
        else
            fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';

        document.getElementById('fileName').innerHTML = 'ファイル名　　: ' + file.name;
        document.getElementById('fileSize').innerHTML = 'ファイルサイズ: ' + fileSize;
        document.getElementById('fileType').innerHTML = 'ファイルタイプ: ' + file.type;
    }
}
// ファイル転送処理
function uploadFile() {
    var fd = new FormData();
    fd.append("meetingID", $(meetingID).val());
    fd.append("uploadFile", document.getElementById('fileToUpload').files[0]);
    var xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", uploadProgress, false);
    xhr.addEventListener("load", uploadComplete, false);
    xhr.addEventListener("error", uploadFailed, false);
    xhr.addEventListener("abort", uploadCanceled, false);
    xhr.open("POST", "/upload");
    xhr.send(fd);
}
// アップロードプログレスの処理
function uploadProgress(evt) {
    if (evt.lengthComputable) {
        var percentComplete = Math.round(evt.loaded * 100 / evt.total);
        document.getElementById('progressNumber').innerHTML = percentComplete.toString() + '%';
    }
    else {
        document.getElementById('progressNumber').innerHTML = '計測不能';
    }
}
// アップロード完了時の処理
function uploadComplete(evt) {
    /* サーバーレスポンスを表示 */
    var socket = io.connect("/");
    if (evt.target.responseText != "") {
        // サーバーサイドのsocket.IOに接続する
        socket.emit("uploadCompleted", {
            filePath: evt.target.responseText,
            meetingID: $(meetingID).val()
        });
    }
    socket.emit("messageSys", {text: "[背景用PDFを変更中]",meetingID: $(meetingID).val()});
}
// アップロード失敗時の処理
function uploadFailed(evt) {
    alert("アップロードに失敗しました。");
}
// アップロードキャンセル時の処理
function uploadCanceled(evt) {
    alert("アップロードがをキャンセルしました。");
}
