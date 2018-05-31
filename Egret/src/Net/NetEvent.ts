class NetEvent extends egret.Event {
	constructor(type: string, bubbles?: boolean, cancelable?: boolean, data?: any) {
		super(type, bubbles, cancelable, data);
	}

	public cmd: string;
	public data: any;
	public static NET: string = "NetEvent";
}