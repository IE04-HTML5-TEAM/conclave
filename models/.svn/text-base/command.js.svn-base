// mongodbへのテーブル設定
var mongo = require('mongoose');

var Schema = mongo.Schema;
 
//コマンドのテーブル定義
var Command = mongo.model('command', new Schema({
    event: String, //イベント名
    text: String,
    before:{x:Number, y:Number},
    after:{x:Number,y:Number},
    color:String,
    lineWidth:Number,
    meetingID: String, //会議のID
    loginID: String, //登録したユーザーのID
    type: String, //コマンドのタイプ（チャット用、キャンバス用、その他でわける）
    fileDir: String, //背景ファイルディレクトリ情報
    fileList: [String], //背景ファイルリスト情報
    createAt: {type: Date, default: Date.now}
    })  
);

//コマンドを登録する
//event: イベント名
//type: コマンドタイプ
//param: パラメーター
Command.create = function(event,type,param){
    var cmd = new Command();
    cmd.event = event;
    cmd.type = type;
    cmd.meetingID = param.meetingID;
    cmd.loginID = param.loginID;
    for (var attrname in param) { cmd[attrname] = param[attrname]; }
    cmd.save(function(err) {
      if (err) { console.log(err); }
    });
    return cmd;
}

//コマンドの更新
Command._update = function(param){
    Command.findByIdAndUpdate(param.id,{$set:param}, {},
        function (err) {
        if (err) { console.log(err); }
    });
} 

//コマンドの削除
Command._remove = function(param){
    Command.findByIdAndRemove(param.id,{},function(err){
        if (err) { console.log(err); }        
    })
}

module.exports = Command;