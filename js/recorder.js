//导入3tee sdk后，定义变量，用于调用接口
var AVDEngine = ModuleBase.use(ModulesEnum.avdEngine);
var avdEngine = new AVDEngine();

//服务器uri和rest接口uri，此处使用的是3tee的测试服务器地址
//服务器地址的两种写入方式，写死或者从demo.3tee.cn/demo中获取
var serverURI = null;
var restURI = serverURI;
var accessKey = null;
var secretKey = null;
//var serverURI = "nice2meet.cn";//可以写死服务器地址
//var accessKey = "demo_access";//可以写死key
//var secretKey = "demo_secret";

function demoGetServerUrl(){//可以通过demo.3tee.cn/demo获取
	var deferred = when.defer();
	var demoUrl = protocolStr + "//demo.3tee.cn/demo/avd_get_params?apptype=record&callback=?";
	$.ajax({
		type: "get",
		url: demoUrl,
		dataType: "jsonp",
		timeout: 5000,
		success: function(data) {
			deferred.resolve(data);
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			log.info("ajax (avd/api/admin/getAccessToken) errorCode:" + XMLHttpRequest.status + ",errorMsg:" + XMLHttpRequest.statusText);
			var error = {};
			error.code = XMLHttpRequest.status;
			error.message = XMLHttpRequest.statusText;
			deferred.reject(error);
		}
	});
	return deferred.promise;
}

demoGetServerUrl().then(function(data) {
	if(data.ret == 0){
		showLog("获取demo服务器地址成功");
		serverURI = data.server_uri;
		restURI = serverURI;
		accessKey = data.access_key;
		secretKey = data.secret_key;
		doGetAccessToken();
	} else {
		alertError(data);
	}
}).otherwise(alertError);

var accessToken = null;

//首先获取accessToken
function getAccessToken() {
	var deferred = when.defer();
	var protocolStr = document.location.protocol;
	var getUrl = "mcuServerURI=" + serverURI + "&accessKey=" + accessKey + "&secretKey=" + secretKey;
	var accessTokenUrl = protocolStr + "//" + restURI + "/avd/api/admin/getAccessToken?callback=?&" + getUrl;
	$.ajax({
		type: "get",
		url: accessTokenUrl,
		dataType: "jsonp",
		timeout: 5000,
		success: function(retObject) {
			var ret = retObject.result;
			if (ret == 0) {
				var retData = retObject.data;
				var accessToken = retData.accessToken;
				deferred.resolve(accessToken);
			} else {
				var error = {};
				error.code = ret;
				error.message = retObject.err;
				deferred.reject(error);
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			log.info("ajax (avd/api/admin/getAccessToken) errorCode:" + XMLHttpRequest.status + ",errorMsg:" + XMLHttpRequest.statusText);
			var error = {};
			error.code = XMLHttpRequest.status;
			error.message = XMLHttpRequest.statusText;
			deferred.reject(error);
		}
	});

	return deferred.promise;
};

function doGetAccessToken(){
	getAccessToken().then(function(_accessToken) {
		showLog("生成访问令牌成功");
		accessToken = _accessToken;
	}).otherwise(alertError);
}

//各个接口输入项显示,根据点击选显示接口的输入参数
var btnClickName = "";
function showCreateRecord(){
	$("#createRecordParaDiv").show();
	$("#recordIdDiv").hide();
	$("#findRecordsParaDiv").hide();
	$("#sureBtnDiv").show();
	btnClickName= "create";
	$("#inputHead").text("创建录制接口输入参数");
	$("#resultShow").html(syntaxHighlight(" "));
	$("#outputHead").text("JSON格式输出");
}

function showRecordId(clickName){
	$("#createRecordParaDiv").hide();
	$("#recordIdDiv").show();
	$("#findRecordsParaDiv").hide();
	$("#sureBtnDiv").show();
	btnClickName = clickName;
	if(clickName == 'stop'){
		$("#inputHead").text("停止录制接口输入参数");
	} else if(clickName == 'get'){
		$("#inputHead").text("获取录制接口输入参数");
	} else if(clickName == 'delete'){
		$("#inputHead").text("删除录制接口输入参数");
	}
	$("#resultShow").html(syntaxHighlight(" "));
	$("#outputHead").text("JSON格式输出");
}

function showFindRecords(){
	$("#createRecordParaDiv").hide();
	$("#recordIdDiv").hide();
	$("#findRecordsParaDiv").show();
	$("#sureBtnDiv").show();
	btnClickName = "find";
	$("#inputHead").text("筛选录制接口输入参数");
	$("#resultShow").html(syntaxHighlight(" "));
	$("#outputHead").text("JSON格式输出");
}

//确认按钮，根据之前点击的选项调用各个接口
function queryEachRestApi(){
	switch(btnClickName)
	{
		case 'create':
			createRecord();
			break;
		case 'stop':
			stopRecord();
			break;
		case 'get':
			getRecord();
			break;
		case 'delete':
			deleteRecord();
			break;
		case 'find':
			findRecords();
			break;
		default:
			break;
	}
}

//创建录制
function createRecord() {
	var roomId = document.getElementById("roomId").value;
	var userId = document.getElementById("userId").value;
	var recordName = document.getElementById("recordName").value;
	var recordTag = document.getElementById("recordTag").value;
	var audioType = document.getElementById("audioType").value;
	var videoType = document.getElementById("videoType").value;
	var fileType = document.getElementById("fileType").value;
	
	var record = avdEngine.obtainRecord(restURI);

	var recordInfo = {};
	recordInfo.name = recordName;
	recordInfo.tag = recordTag;
	recordInfo.roomId = roomId;
	recordInfo.userId = userId;
	recordInfo.audioType = audioType;
	recordInfo.videoType = videoType;
	recordInfo.fileType = fileType;

	record.createUserRecord(accessToken, recordInfo).then(function(data) {
		showResult(data);
		document.getElementById("recordId").value = data.id;
	}).otherwise(alertError);
}

//停止录制
function stopRecord() {
	var recordId = document.getElementById("recordId").value;
	
	var record = avdEngine.obtainRecord(restURI);
	record.stopRecord(accessToken, recordId).then(function(data) {
		showLog("停止录制成功！");
		showResult(data);
	}).otherwise(alertError);
}

//获取录制
function getRecord() {
	var recordId = document.getElementById("recordId").value;
	
	var record = avdEngine.obtainRecord(restURI);
	record.getRecord(accessToken, recordId).then(function(data) {
		showLog("获取录制成功！");
		showResult(data);
	}).otherwise(alertError);
}

//删除录制
function deleteRecord() {
	var recordId = document.getElementById("recordId").value;
	
	var record = avdEngine.obtainRecord(restURI);
	record.deleteRecord(accessToken, recordId).then(function(data) {
		showLog("删除录制成功！");
		showResult(data);
	}).otherwise(alertError);
}

//筛选录制
function findRecords() {
	var begin = document.getElementById("begin").value;
	var count = document.getElementById("count").value;
	var fromTime = document.getElementById("fromTime").value;
	var endTime = document.getElementById("endTime").value;
	var filterRoomId = document.getElementById("filterRoomId").value;
	var filterUserId = document.getElementById("filterUserId").value;
	
	var filter = {};
	filter.fromTime = fromTime;
	filter.endTime = endTime;
	filter.roomId = filterRoomId;
	filter.userId = filterUserId;
	
	var filterStr = JSON.stringify(filter);
	
	var record = avdEngine.obtainRecord(restURI);
	
	record.findRecords(accessToken, begin, count, filterStr).then(function(data) {
		showLog("筛选录制成功！");
		showResult(data);
	}).otherwise(alertError);
}

//统一日志显示，在页面最下方显示步骤进度
function showLog(content){
	var myDate = new Date();
	var currentTime =  myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds();
	var showContent = currentTime + " " + content;
	if(content.indexOf("错误") > -1){
		showContent = "<span style='color:red'>" + showContent + "</span>";
	}
	$("#logShow").html($("#logShow").html() + showContent + "<br>");
	$("#jp-container").scrollTop( $('#jp-container')[0].scrollHeight);
}

//结果JSON显示
function showResult(data){
	$("#resultShow").html(syntaxHighlight(data));
	if(btnClickName == 'create'){
		$("#outputHead").text("创建录制接口JSON格式输出");
	} else if(btnClickName == 'stop'){
		$("#outputHead").text("停止录制接口JSON格式输出");
	} else if(btnClickName == 'get'){
		$("#outputHead").text("获取录制接口JSON格式输出");
	} else if(btnClickName == 'delete'){
		$("#outputHead").text("删除录制接口JSON格式输出");
	} else if(btnClickName == 'find'){
		$("#outputHead").text("筛选录制接口JSON格式输出");
	}
}

function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

//统一错误处理，把错误alert出来
function alertError(error){
	showLog("错误原因：" + "error code:" + error.code + "; error message:" + error.message);
}
