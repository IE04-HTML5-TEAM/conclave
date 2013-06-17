var socket = io.connect("/");
var localStream;
var pcs={}; //PeerConnectionを参加ごとにいれる
// var servers = null;
var servers = {iceServers:[{url:'stun:stun.l.google.com:19302'}]};

//ストリミーングを開始する
function startStreaming(){
	try{
  getUserMedia({audio:true, video:true},
                gotStream, function() {});
	}
	catch(err){
		alert("Sorry,ブラウザが未対応です");
	}
}

function disableStartBugtton(){
		$("#startStreaming").attr("disabled",true);	
}

//自分用の小さいvideoタグの追加
function addMiniVideo(stream){
	$("#paticipants").append(
    $("<li class='videoLine'>").append(
    	$("<video autoplay class='mini'>")
    .attr("src",window.webkitURL.createObjectURL(stream))))
}

//相手用のvideoタグの追加
function addVideo(stream,user){
	$("#paticipants").append(
    $("<li class='videoLine'>").text(user).append(
    	$("<video autoplay>")
    .attr("src",window.webkitURL.createObjectURL(stream))))	
}

function gotStream(stream){
  localStream = stream;
  addMiniVideo(stream);
  socket.emit("setPeerConnections",
  	{meetingID: $(meetingID).val()})
  disableStartBugtton();
}
function errorStram(err){
	console.log(err);
}

socket.on("createPeerConnection",function(event){
	//自分以外に対してコネクションを作る
	if(event.loginID!=$(loginID).val()){
		var target = event.loginID;
		var from =  $(loginID).val();
		pcs[target] = createPeerConnection(target,from);
	  pcs[target].createOffer(function(desc){
				pcs[target].setLocalDescription(desc);
				socket.emit("offerStream",{
				target: target,
				from: from,
				meetingID: $(meetingID).val(),
				desc: desc})	  	
	  });		
	}
})

function createPeerConnection(target,from){
  var pc = new RTCPeerConnection(servers);
  pc.onicecandidate = function(event){
  		if(event.candidate){
		socket.emit("sendCandidate",{
			meetingID: $(meetingID).val(),
			candidate: event.candidate,
			target: target,
			from: from
		})
	}}
  pc.onaddstream = function(e){
		addVideo(e.stream,target);
  } 
  pc.addStream(localStream);	
  return pc
}

//ストリーミングのオファー受信
socket.on("offerStream",function(event){
	if(!localStream) return;
	if(event.target != $(loginID).val()) return;
	var target = event.from;
	var from = event.target;
	pc = createPeerConnection(target,from);
	pcs[target] = pc;
  pc.setRemoteDescription(new RTCSessionDescription(event.desc));
  pc.createAnswer(function(desc){
		pc.setLocalDescription(desc);
		socket.emit("answerStream",{
		meetingID: $(meetingID).val(),
		desc: desc,
		from: from,
		target: target
		})
  });
})

//オファーに対するアンサー受信
socket.on("answerStream",function(event){
	if(event.target != $(loginID).val()) return;
	var target = event.from;
	pcs[target].setRemoteDescription(new RTCSessionDescription(event.desc));
})

//candidateの交換
socket.on("sendCandidate",function(event){
	var target = event.target;
	var from = event.from;
	if(target != $(loginID).val()) return;
	if(pcs[from]){
		pcs[from].addIceCandidate(new RTCIceCandidate(event.candidate));
	}
})
