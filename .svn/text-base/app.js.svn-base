//モジュールの読み込み
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , socketIO = require("socket.io")
  , fs = require("fs")
  , mongo = require('mongoose')
  , Command = require('./models/command')
  , connect = require("express/node_modules/connect")
  , expressLayouts = require('express-ejs-layouts');

//DBに接続
mongo.connect('mongodb://localhost/meeting');

var ExpressSession = express.session.Session
  , sessionStore = new express.session.MemoryStore();

var app = express()
app.configure(function(){
  app.set('port', process.env.PORT || 8000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(expressLayouts)
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(express.bodyParser({ keepExtensions: true }));
  app.use(express.cookieParser('your secret here'));
  app.use(express.session({
    key : 'sid',    //cookieにexpressのsessionIDを保存する際のキーを設定
    store : sessionStore
  }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

// 環境定義：開発環境（development）, リリース環境（production）
app.configure('development', function(){
   app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Routings (routes/index.jsのどのメソッドを呼び出すかを定義）
// login画面以外はPOSTを想定中
app.get('/', routes.login);
app.post('/entranceLogin', routes.entranceLogin);
app.get('/entrance', routes.entrance);
app.get('/newMeeting', routes.newMeeting);
app.get('/closedMeetings', routes.closedMeetings);
app.get('/availableMeetings', routes.availableMeetings);
app.post('/createMeeting',routes.createMeeting);
app.get('/main/:meetingID', routes.main);


//サーバーの作成
var server = http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
 
// socket.IOを用いたリアルタイムWebを実装します。
var io = socketIO.listen(server);

//socket.ioのコネクション認証時にexpressのセッションIDを元にログイン済みか確認する
io.set('authorization', function (handshakeData, callback) {
  if(handshakeData.headers.cookie) {
    //cookie取得
    var cookie =require('cookie').parse(decodeURIComponent(handshakeData.headers.cookie));
    
    //cookie中の署名済みの値を元に戻す
    cookie = connect.utils.parseSignedCookies(cookie, 'your secret here');
    
    //cookieからexpressのセッションIDを取得する
    var sessionID = cookie['sid'];
    
    // セッションデータをストレージから取得 
    sessionStore.get(sessionID, function(err, session) {
      if (err) {
        //セッションが取得失敗
        console.dir(err);
        callback(err.message, false);
        
      } else if (!session) {
        //セッションがない
        console.log('session not found');
        callback('session not found', false);
        
      } else {
        //セッション取得成功
        console.log("authorization success");
        
        // socket.ioからもセッションを参照できるようにする
        handshakeData.cookie = cookie;
        handshakeData.sessionID = sessionID;
        handshakeData.sessionStore = sessionStore;
        handshakeData.session = new ExpressSession(handshakeData, session);
        callback(null, true);
      }
    });
  } else {
    //cookieが見つからなかった時
    return callback('cookie not found', false);
  }
});

//チャット接続時
io.sockets.on("connection", function (socket) {

  //チャット切断時
  socket.on("disconect",function(event){
    
    //退室者情報を設定
    var userData = {
      meetingID : event.meetingID,
      loginID : socket.handshake.session.loginid,
      type: "userList"
    };
    
    //参加者一覧の検索条件
    var loginListQuery = {
      meetingID: event.meetingID,
      type : "userList",
    };
    
    //退室者情報を取得
    console.log('【部屋情報】：' + userData.meetingID);
    console.log('【退室者】：' + userData.loginID);
    Command.find(userData, function(err, queryResult) {
      for (var key in queryResult) {
        console.log('【ID】：' + queryResult[key]._id);
        Command._remove(queryResult[key]);
        socket.broadcast.emit("exitUser", queryResult[key]);
      }
    });
    
    //参加者一覧を取得
    console.log('-----【参加者一覧ログデータ】------');
    Command.find(loginListQuery, function(err, queryResult) {
      for (var key in queryResult) {
        console.log('【ID】：' + queryResult[key]._id);
        console.log('【event】：' + queryResult[key].event);
        console.log('【参加者名】：' + queryResult[key].loginID);
      }
    });
    
  });
  
  socket.on("addParticipant",function(event){
    //会議の参加人数
    var loginCount = 1;
    
    //参加者情報を設定
    var userData = {
      meetingID : event.meetingID,
      loginID : socket.handshake.session.loginid
    };
    
    //参加者確認用検索条件
    var loginCheckQuery = {
      meetingID: event.meetingID,
      type : "userList",
      loginID :userData.loginID
    };
    
    //参加者一覧にいない場合のみ参加者登録
    Command.find(loginCheckQuery, function(err, queryResult) {
      if(queryResult == "") {
        console.log('-----【参加者データ】------');
        console.log('【部屋情報】：' + userData.meetingID);
        console.log('【参加者】：' + userData.loginID);
        Command.create("getUserList","userList",userData);
        socket.emit("enterUser", userData);
        socket.broadcast.emit("enterUser", userData);
      }
    });
  })

  //ストリームのコネクション整備
  socket.on("setPeerConnections",function(event){
    Command.find({meetingID: event.meetingID,type:"userList"},function(err,users){
      for(var key in users){
        socket.emit("createPeerConnection",users[key]);
      }
    })
  })
  //ストリームの追加
  socket.on("offerStream",function(event){
    console.log(event);
    socket.broadcast.emit("offerStream",event)
  })
  socket.on("answerStream",function(event){
    console.log(event);
    socket.broadcast.emit("answerStream",event)
  })
  socket.on("sendCandidate",function(event){
    console.log(event);
    socket.broadcast.emit("sendCandidate",event)
  })

  //コマンドの再生
  socket.on("getCommand",function(event){
    //DBに保存されているチャットログを表示
    Command.find({meetingID: event.meetingID},function(err, messages) {
      for (var key in messages) {
        socket.emit(messages[key].event, messages[key]);
      }
    });
  })
  
  //チャット
  socket.on('message', function(message){
    // クライアントからのメッセージをコンソールに出力
    console.log('【メッセージ】' + message.text);
      
    //セッションのloginidをメッセージに追加
    message.loginID = socket.handshake.session.loginid;
    console.log('【LOGIN ID】' + message.loginID);
    
    //DBに保存
    Command.create("message","chat",message);
    
    // 送信元へメッセージ送信
    socket.emit('message', message);
    // 送信元以外の全てのクライアントへメッセージ送信
    socket.broadcast.emit('message', message);
  });

  //チャット:システムメッセージ表示用(DB保存しない)
  socket.on('messageSys', function(message){
    // クライアントからのメッセージをコンソールに出力
    console.log('【メッセージ】' + message.text);
    //セッションのloginidをメッセージに追加
    message.loginID = socket.handshake.session.loginid;
    // 送信元へメッセージ送信
    socket.emit('message', message);
    // 送信元以外の全てのクライアントへメッセージ送信
    socket.broadcast.emit('message', message);
  });

  // 描画情報がクライアントから渡されたら、接続中の他ユーザーへ
  // broadcastで描画情報を送ります。
  socket.on("draw", function (data) {
    console.log(data);
    var cmd = Command.create("draw","canvas",data);
    socket.emit("draw", cmd);
    socket.broadcast.emit("draw", data);
  });
  socket.on("erase", function (data) {
    console.log(data);
    Command.create("erase","canvas",data);
    socket.emit("erase", data);
    socket.broadcast.emit("erase", data);
  });
  socket.on("createMemo", function (data) {
    console.log(data);
    var cmd = Command.create("createMemo","memo",data)
    socket.emit("createMemo", cmd);
    socket.emit("selectMemo",cmd);
    socket.broadcast.emit("createMemo", cmd);
  });
  socket.on("removeMemo",function(data){
    console.log(data);
    socket.emit("removeMemo",data)
    socket.broadcast.emit("removeMemo",data)
    Command._remove(data)
  })
  socket.on("memoMove",function(data){
    console.log(data);
    socket.broadcast.emit("memoMove",data);
  })
  socket.on("memoMoved",function(data){
    console.log(data);
    Command._update(data);
  })
  socket.on("changeText",function(data){
    console.log(data);
    socket.broadcast.emit("changeText",data)
    Command._update(data)
  })

  // 背景変更イベント
  socket.on("uploadCompleted",function(data){
    // コンバート先ディレクトリを作成
    var fs = require("fs");
    var path = require("path");
    var fullPath = path.join(__dirname, data.filePath);
    // コンバート先ディレクトリを新規作成
    var cnvDirPath = fullPath + '_CNVED';
    if (!path.existsSync(cnvDirPath)) fs.mkdirSync(cnvDirPath, 0777);
    // コンバート先ファイル名フォーマット
    var cnvFileNm = path.normalize(cnvDirPath + '/%03d.jpeg');
    // コマンド実行
    var spawn = require('child_process').spawn;
    var cp = spawn('convert', ['-density', '72x72', '-geometry', 'x640', fullPath, '-quality', '92', cnvFileNm]);
    // 変換後ファイル置き場の相対パス
    data.fileDir = cnvDirPath.replace(path.normalize(__dirname + '/public'),"");
    data.fileDir = data.fileDir.split("\\").join("/");

    cp.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
    })
    cp.stderr.on('data', function(data) {
        console.log('stderr: ' + data);
        data.fileDir = "";
        socket.emit("changeBgImage", data);
        socket.broadcast.emit("changeBgImage", data);
    })
    cp.on('exit', function(code) {
        if (code !== 0) {
            console.log('child_process exit code: ' + code);
        }
        console.log('child_process exited.');
        data.fileList = fs.readdirSync(cnvDirPath);
        if (data.fileList && data.fileList.length > 1) data.fileList.sort();
        data.isPlayback = false;
        socket.emit("changeBgImage", data);
        socket.broadcast.emit("changeBgImage", data);
        Command.create("changeBgImage","bgImage",data);
    })
  })
});

/*
 * 背景アップロード
 */
app.post('/upload', function (req, res) {
    // 仮のファイル置き場
    var tmpPath = req.files.uploadFile.path;
    // 会議ごとのファイル置き場
    var meetingPath = './public/files/' + req.body.meetingID;
    // 実際のファイル置き場
    var targetPath = meetingPath + '/' + req.files.uploadFile.name;
    // 会議ごとのファイル置き場を作成
    if (!path.existsSync(meetingPath)) {
        fs.mkdirSync(meetingPath, 0777);
    }
    // ファイルを仮の場所から移します
    fs.rename(tmpPath, targetPath, function (err) {
        if (err) throw err;
        // 仮ファイルを削除します
        fs.unlink(tmpPath, function () {
            if (err) throw err
        });
    });
    res.send(targetPath);
});

