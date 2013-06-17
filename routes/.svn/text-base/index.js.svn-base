//会議モデルの読み込み
var Meeting = require('../models/meeting');

/*
 * login.ejs
 */
exports.login = function(req, res){
  res.render('login', { title: ''});
};
/*
 * entrance.ejs
 */
exports.entranceLogin = function (req, res) {
    // ポストされたログインIDを取得
    req.session.loginid = req.body.loginid;
    res.redirect('/entrance');
};

exports.entrance = function (req, res) {
    useSessionFilter(req,res);
    var loginid = getLoginId(req);
    // エントランス画面を表示する。
    res.render('entrance', { title: 'メニュー画面', loginid: loginid });
};
/*
 * newMeeting.ejs
 */
exports.newMeeting = function(req, res){
    useSessionFilter(req,res);
    var loginid = getLoginId(req);
    // エントランス画面を表示する。
    res.render('newMeeting', { title: '会議作成画面', loginid: loginid });
};

//開催中の会議室の一覧
exports.availableMeetings = function(req,res){
    Meeting.find({closed: false},function(err, meetings) {
        res.render('searchMeeting', { title: '会議選択画面', loginid: getLoginId(req), 
            displayText: '開催中の', meetings: meetings});
    })
}

//既に終了した会議室の一覧
exports.closedMeetings = function(req,res){
    Meeting.find({closed: true},function(err, meetings) {
        res.render('searchMeeting', { title: '会議選択画面', loginid: getLoginId(req), 
            displayText: '既に終了した', meetings: meetings});
    })
}

exports.createMeeting= function(req,res){
    //会議を作成してDBに保存
    var meeting = Meeting.create(req.body.meetingName)
    res.redirect('/main/' + meeting.id);
}

/*
 * main.ejs
 */
exports.main = function(req, res){
    useSessionFilter(req,res);
    // セッションからログインIDを取得
    // ※（WebStrage利用前のコードです。ログインIDの格納先は、WebStrageを計画しています）
    var loginid = getLoginId(req);
    Meeting.findById(req.params.meetingID,function(err,meeting){
        if(meeting){var name = meeting.name}
        res.render('main', { title: '会議画面', meetingName: name, loginid: loginid,
        meetingID: req.params.meetingID,
        layout:"whiteboardLayout"});
    })
};

/*
* ログインIDを取得。
* ※ログインIDの格納先がWebStrageになる場合はここを変更か
*/
function getLoginId(req) {
    // セッションからログインIDを取得
    var loginid;
    if (req.session.loginid) {
        return req.session.loginid;
    } else {
        return;
    }
}

//未ログインの場合にログイン画面へ飛ばす
function useSessionFilter(req,res){
    var loginid = getLoginId(req);
    if(!loginid){
        res.redirect('/')
    }
}