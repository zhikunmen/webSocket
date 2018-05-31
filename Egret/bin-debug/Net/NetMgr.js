var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var NetMgr = (function (_super) {
    __extends(NetMgr, _super);
    function NetMgr() {
        var _this = _super.call(this) || this;
        _this.socket = new egret.WebSocket();
        /**当前服务器ip */
        _this.curServerIp = "";
        return _this;
    }
    NetMgr.Instance = function () {
        if (!this.net) {
            this.net = new NetMgr();
        }
        return this.net;
    };
    /**
     * @param serverip web服务器ip地址或者公网地址,
     * @param port   端口号
     */
    NetMgr.prototype.startSocket = function (serverip, port) {
        if (serverip == this.curServerIp && this.socket.connected) {
            return;
        }
        this.pauseSocket();
        this.socket.addEventListener(egret.ProgressEvent.SOCKET_DATA, this.socketEvent, this);
        this.socket.addEventListener(egret.Event.CONNECT, this.socketEvent, this);
        this.socket.addEventListener(egret.Event.CLOSE, this.socketEvent, this);
        this.socket.addEventListener(egret.IOErrorEvent.IO_ERROR, this.socketEvent, this);
        this.socket.connect(serverip, port);
    };
    /**
     * 停止socket连接
     */
    NetMgr.prototype.pauseSocket = function () {
        if (this.socket && this.socket.connected) {
            this.socket.close();
            this.socket.removeEventListener(egret.ProgressEvent.SOCKET_DATA, this.socketEvent, this);
            this.socket.removeEventListener(egret.Event.CONNECT, this.socketEvent, this);
            this.socket.removeEventListener(egret.Event.CLOSE, this.socketEvent, this);
            this.socket.removeEventListener(egret.IOErrorEvent.IO_ERROR, this.socketEvent, this);
            this.curServerIp = "";
        }
    };
    /**socket状态处理 */
    NetMgr.prototype.socketEvent = function (evt) {
        switch (evt.type) {
            case egret.ProgressEvent.SOCKET_DATA:
                this.getMessage();
                break;
            case egret.Event.CONNECT:
                console.error("连接成功");
                this.sendData("Net", { name: "门智坤" });
                break;
            case egret.Event.CLOSE:
                console.error("连接关闭");
                break;
            case egret.IOErrorEvent.IO_ERROR:
                console.error("连接断开");
                break;
        }
    };
    /**获取服务器数据 */
    NetMgr.prototype.getMessage = function () {
        var msg = this.socket.readUTF();
        console.log(msg);
        var protocol = JSON.parse(msg);
        try {
            var event_1 = new NetEvent(NetEvent.NET);
            event_1.cmd = protocol.cmd;
            event_1.data = protocol.data;
            this.dispatchEvent(event_1);
        }
        catch (e) {
            console.warn("网络错误" + e + "-处理错误");
        }
    };
    /**获取web服务器连接状态 */
    NetMgr.prototype.getSocketStatus = function () {
        return this.socket.connected;
    };
    /**
     * 向服务器发送消息
     */
    NetMgr.prototype.sendData = function (cmd, data) {
        if (this.socket && this.socket.connected) {
            var protocol = new Protocol();
            protocol.cmd = cmd;
            protocol.data = data;
            this.socket.writeUTF(JSON.stringify(protocol));
        }
    };
    return NetMgr;
}(egret.DisplayObject));
__reflect(NetMgr.prototype, "NetMgr");
