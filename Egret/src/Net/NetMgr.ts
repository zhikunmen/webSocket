class NetMgr extends egret.DisplayObject{
	public constructor() {
		super();
	}

	private socket : egret.WebSocket = new egret.WebSocket();
	static net : NetMgr;
	/**当前服务器ip */
	private curServerIp: string = "";
	
	public static Instance(): NetMgr{
		if(!this.net){
			this.net = new NetMgr();
		}
		return this.net;
	}

	/**
	 * @param serverip web服务器ip地址或者公网地址,
	 * @param port   端口号
	 */
	public startSocket(serverip: string, port: number){
		if(serverip == this.curServerIp && this.socket.connected){
			return;
		}
		this.pauseSocket();
		this.socket.addEventListener(egret.ProgressEvent.SOCKET_DATA,this.socketEvent,this);
		this.socket.addEventListener(egret.Event.CONNECT,this.socketEvent,this);
		this.socket.addEventListener(egret.Event.CLOSE,this.socketEvent,this);
		this.socket.addEventListener(egret.IOErrorEvent.IO_ERROR,this.socketEvent,this);
		this.socket.connect(serverip,port);
	}

	/**
	 * 停止socket连接
	 */
	public pauseSocket(): void{
		if(this.socket && this.socket.connected){
			this.socket.close();
			this.socket.removeEventListener(egret.ProgressEvent.SOCKET_DATA,this.socketEvent,this);
			this.socket.removeEventListener(egret.Event.CONNECT,this.socketEvent,this);
			this.socket.removeEventListener(egret.Event.CLOSE,this.socketEvent,this);
			this.socket.removeEventListener(egret.IOErrorEvent.IO_ERROR,this.socketEvent,this);
			this.curServerIp = "";
		}
	}


	/**socket状态处理 */
	private socketEvent(evt: egret.Event){
		switch(evt.type){
			case egret.ProgressEvent.SOCKET_DATA:
				this.getMessage();
				break;
			case egret.Event.CONNECT:
				console.error("连接成功");
				this.sendData("Net",{name:"门智坤"})
				break;
			case egret.Event.CLOSE:
				console.error("连接关闭")
				break;
			case egret.IOErrorEvent.IO_ERROR:
				console.error("连接断开");
				break;
		}
	}	
	/**获取服务器数据 */
	private getMessage(): void{
		var msg = this.socket.readUTF();
		console.log(msg);
		let protocol: Protocol<any> = JSON.parse(msg);
		try{
			let event = new NetEvent(NetEvent.NET);
			event.cmd = protocol.cmd;
			event.data = protocol.data;
			this.dispatchEvent(event);	
		}catch (e){
			console.warn("网络错误" + e + "-处理错误");
		}
	}

	/**获取web服务器连接状态 */
	public getSocketStatus(): boolean{
		return this.socket.connected;
	}

	/**
	 * 向服务器发送消息
	 */

	public sendData(cmd: string, data: any): void{
		if(this.socket && this.socket.connected){
			let protocol = new Protocol<any>();
			protocol.cmd = cmd;
			protocol.data = data;
			this.socket.writeUTF(JSON.stringify(protocol));
		}

	}
}