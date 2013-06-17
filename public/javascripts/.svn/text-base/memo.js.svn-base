window.addEventListener("load", function () {  
  // サーバーサイドのsocket.IOに接続する
  var socket = io.connect("/");

  // 付箋を作成する
  socket.on("createMemo",function(command) {
      $('<div class="memo"></div>')
        .appendTo('.canvas')
        .prepend("<button type='button' class='close' style='float:right'>&times;</button>")
        .prepend("<div class='memoText'></div>")
        .attr("id",command._id)
        .css({top: $('.canvas').offset().top + command.after.y ,
          left:$('.canvas').offset().left + command.after.x})
        .draggable({
          containment : "parent"
          ,drag:function(event,ui){
            socket.emit("memoMove",{
            id: command._id
            ,after: {x: ui.position.left - $('.canvas').offset().left,
             y: ui.position.top - $('.canvas').offset().top}
            })
          }
          ,stop:function(event,ui){
            socket.emit("memoMoved",{
            id: command._id
            ,after: {x: ui.position.left - $('.canvas').offset().left,
             y: ui.position.top - $('.canvas').offset().top}
            })
          }
        })
        .dblclick(function() {
          $(this).children("div").wrapInner('<textarea></textarea>')
            .find('textarea')
            .focus()
            .select()
            .html(disconvertText($(this).find("textarea").html()))
            .blur(function() {
              $(this).parent().html(convertText($(this).val()));
            })
            .change(function(){
              // $(this).parent().css({width: "100"})
              socket.emit("changeText",{
                id: command._id
                ,text: convertText($(this).val())
              })
            })
        })
        .find("div")
        .html(command.text)
        .parent().find("button")
        .click(function(){
          socket.emit("removeMemo",{id:$(this).parent().attr("id")})
        })
    });

  // 付箋の位置を移動させる
  socket.on("memoMove",function(data){
    $("#" + data.id).css({
      top: $('.canvas').offset().top + data.after.y ,
      left:$('.canvas').offset().left + data.after.x
    })
  })

  //付箋の文字を変更する
  socket.on("changeText",function(data){
    $("#" + data.id).html(data.text);
  })
  socket.on("selectMemo",function(command){
    $("#" + command._id).dblclick();    
  })

  //付箋の削除
  socket.on("removeMemo",function(data){
    $("#" + data.id).remove();
  })


}, false);

//改行が入った文章を<br>に変換する
function convertText(text){
  text = text.split("<").join("&lt;");
  text = text.split(">").join("&gt;");
  //改行を改行タグに置き換える
  text = text.split("\n").join("<br>");
  return text
}
//<br>の入った文章を改行に変換する
function disconvertText(text){
  //改行を改行タグに置き換える
  if(text){
    text = text.split("<br>").join("\n");
  }
  return text
}