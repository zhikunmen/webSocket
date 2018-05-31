class Protocol<T> {

	public cmd: string;

	public data: T;
	
	public cmdType: CMDTYPE;
}

enum CMDTYPE{
	RECHARGE,
	NET,
	OTHER,
}