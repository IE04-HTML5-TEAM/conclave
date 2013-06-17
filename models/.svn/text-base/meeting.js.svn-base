// mongodbへのテーブル設定
var mongo = require('mongoose');

var Schema = mongo.Schema;
 
var Meeting = mongo.model('meeting', new Schema({
    name: String,
    closed: {type: Boolean, default: false},
    createAt: {type: Date, default: Date.now}
    })
);

//新規作成する
Meeting.create = function(name){
    var meeting = new Meeting();
    meeting.name  =name;
    meeting.save(function(err) {
      if (err) { console.log(err); }
    });
    return meeting;
}

module.exports = Meeting;