$(function(){
  var socket = new io.connect("/");
  // 接続時に接続方式表示
  socket.on("connect", function(){
    $("#userList ul").empty();
    
    //コマンドを取得
    socket.emit("getCommand",{meetingID: $(meetingID).val()})

    //参加者リストに追加
    socket.emit("addParticipant",{meetingID: $(meetingID).val()})

  });
  
  //参加者一覧の取得
  socket.on("getUserList", function(message){
    //同じ会議でのメッセージのみ表示する
    if(message.meetingID == $(meetingID).val())
    {
      $("<li>").text(message.loginID).appendTo($("#userList ul"));
    }
  });
  
  //入室者表示
  socket.on("enterUser", function(message){
    //同じ会議でのメッセージのみ表示する
    if(message.meetingID == $(meetingID).val())
    {
      $("<li class = '" + message.loginID + "' >").text(message.loginID).prependTo($("#userList ul"));
      addMessage(message.loginID + "様が入室しました。");
    }
  });
  
  //退室者ログ表示
  socket.on("exitUser", function(message){
    //同じ会議でのメッセージのみ表示する
    if(message.meetingID == $(meetingID).val())
    {
      addMessage(message.loginID + "様が退室しました。");
      $("." + message.loginID).hide();
    }
  });
  
  // 受信メッセージ表示
  socket.on("message", function(message){
    //同じ会議でのメッセージのみ表示する
    if(message.meetingID == $(meetingID).val())
    {
      addMessage(message.loginID + " : " + message.text);
    }
  });

  // メッセージエリアにメッセージを追加
  function addMessage(text){
    $("<li>").text(text).prependTo($("#messageArea ul")).css('display','none').slideToggle();    
  }

  // メッセージ送信
  $("#sendMessage").click(function(){
    socket.emit("message", {
      text: $("textarea#inputMessage").val(),
      meetingID: $(meetingID).val()
    });
    //入力フォームの文字を削除
    $("textarea#inputMessage").val("");
  });
  
  //退室時
  $("input#exit").click(function(){
    socket.emit("disconect",{ meetingID: $(meetingID).val() })
  });

  // 表示制御
  $(".blockControl").click(function(){
    $(this).hide();
    $(this).prev("span.blockControl").show();
    $(this).next("span.blockControl").show();
    $(this).parent("p.box-header").next("div").slideToggle();
  });
});
