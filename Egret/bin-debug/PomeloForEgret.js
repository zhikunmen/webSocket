var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
/**
 * Created by govo on 15/8/14.
 *
 * Pomelo Client for Egret, with protobuf support, with js ws client version 0.0.5
 * Github: https://github.com/govo/PomeloForEgret.git
 *
 * Thanks to:
 * D-Deo @ https://github.com/D-Deo/pomelo-flash-tcp.git
 * and yicaoyimu @ http://bbs.egret.com/forum.php?mod=viewthread&tid=2538&highlight=pomelo
 */
var PomeloForEgret;
(function (PomeloForEgret) {
    var Pomelo = (function () {
        function Pomelo() {
            this.JS_WS_CLIENT_TYPE = 'js-websocket';
            this.JS_WS_CLIENT_VERSION = '0.0.5';
            this.RES_OK = 200;
            this.RES_FAIL = 500;
            this.RES_OLD_CLIENT = 501;
            this.socket = null;
            this.callbacks = {};
            this.handlers = {};
            // Map from request id to route
            this.routeMap = {};
            this.heartbeatInterval = 0;
            this.heartbeatTimeout = 0;
            this.nextHeartbeatTimeout = 0;
            this.gapThreshold = 100;
            this.heartbeatId = null;
            this.heartbeatTimeoutId = null;
            this.handshakeCallback = null;
            this.initCallback = null;
            this._callbacks = {};
            this.reqId = 0;
            if (!console.group) {
                console.group = console.log;
                console.groupEnd = function () { console.log("----"); };
                console.info = console.log;
                console.warn = console.log;
                console.error = console.log;
            }
            this._message = new Message();
            this._package = new Package();
            this.socket = null;
            this.callbacks = {};
            this.handlers = {};
            // Map from request id to route
            this.routeMap = {};
            this.heartbeatInterval = 0;
            this.heartbeatTimeout = 0;
            this.nextHeartbeatTimeout = 0;
            this.gapThreshold = 100;
            this.heartbeatId = null;
            this.heartbeatTimeoutId = null;
            this.handshakeCallback = null;
            this.handshakeBuffer = {
                'sys': {
                    type: this.JS_WS_CLIENT_TYPE,
                    version: this.JS_WS_CLIENT_VERSION
                },
                'user': {}
            };
            this.initCallback = null;
            this.reqId = 0;
            this.handlers[Package.TYPE_HANDSHAKE] = this.handshake;
            this.handlers[Package.TYPE_HEARTBEAT] = this.heartbeat;
            this.handlers[Package.TYPE_DATA] = this.onData;
            this.handlers[Package.TYPE_KICK] = this.onKick;
        }
        Pomelo.prototype.init = function (params, cb) {
            console.log("init", params);
            this.initCallback = cb;
            var host = params.host;
            var port = params.port;
            //
            //var url = 'ws://' + host;
            //if(port) {
            //    url +=  ':' + port;
            //}
            this.handshakeBuffer.user = params.user;
            this.handshakeCallback = params.handshakeCallback;
            this.initWebSocket(host, port, cb);
        };
        Pomelo.prototype.initWebSocket = function (host, port, cb) {
            console.log("[Pomelo] connect to:", host, port);
            this.socket = new egret.WebSocket();
            this.socket.type = egret.WebSocket.TYPE_BINARY;
            this.socket.addEventListener(egret.Event.CONNECT, this.onConnect, this);
            this.socket.addEventListener(egret.Event.CLOSE, this.onClose, this);
            this.socket.addEventListener(egret.IOErrorEvent.IO_ERROR, this.onIOError, this);
            this.socket.addEventListener(egret.ProgressEvent.SOCKET_DATA, this.onMessage, this);
            this.socket.connect(host, port);
        };
        Pomelo.prototype.on = function (event, fn) {
            (this._callbacks[event] = this._callbacks[event] || []).push(fn);
        };
        Pomelo.prototype.request = function (route, msg, cb) {
            if (arguments.length === 2 && typeof msg === 'function') {
                cb = msg;
                msg = {};
            }
            else {
                msg = msg || {};
            }
            route = route || msg.route;
            if (!route) {
                return;
            }
            this.reqId++;
            if (this.reqId > 127) {
                this.reqId = 1;
            }
            var reqId = this.reqId;
            if (Pomelo.DEBUG) {
                console.group("REQUEST:");
                console.info("Route:", route);
                console.log("Id:", reqId);
                console.log("Param:", msg);
                console.groupEnd();
            }
            this.sendMessage(reqId, route, msg);
            this.callbacks[reqId] = cb;
            this.routeMap[reqId] = route;
        };
        Pomelo.prototype.notify = function (route, msg) {
            this.sendMessage(0, route, msg);
        };
        Pomelo.prototype.onMessage = function (event) {
            var byte = new egret.ByteArray();
            this.socket.readBytes(byte);
            this.processPackage(this._package.decode(byte));
        };
        Pomelo.prototype.sendMessage = function (reqId, route, msg) {
            var byte;
            byte = this._message.encode(reqId, route, msg);
            byte = this._package.encode(Package.TYPE_DATA, byte);
            this.send(byte);
        };
        Pomelo.prototype.onConnect = function (e) {
            console.log("[Pomelo] connect success", e);
            this.socket.writeBytes(this._package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(this.handshakeBuffer))));
            this.socket.flush();
        };
        Pomelo.prototype.onClose = function (e) {
            console.error("[Pomelo] connect close:", e);
            this.emit(Pomelo.EVENT_CLOSE, e);
        };
        Pomelo.prototype.onIOError = function (e) {
            this.emit(Pomelo.EVENT_IO_ERROR, e);
            console.error('socket error: ', e);
        };
        Pomelo.prototype.onKick = function (event) {
            this.emit(Pomelo.EVENT_KICK, event);
        };
        Pomelo.prototype.onData = function (data) {
            //probuff decode
            var msg = this._message.decode(data);
            if (msg.id > 0) {
                msg.route = this.routeMap[msg.id];
                delete this.routeMap[msg.id];
                if (!msg.route) {
                    return;
                }
            }
            //msg.body = this.deCompose(msg);
            this.processMessage(msg);
        };
        Pomelo.prototype.processMessage = function (msg) {
            if (!msg.id) {
                // server push message
                if (Pomelo.DEBUG) {
                    console.group("EVENT:");
                    console.info("Route:", msg.route);
                    console.info("Msg:", msg.body);
                    console.groupEnd();
                }
                this.emit(msg.route, msg.body);
                return;
            }
            if (Pomelo.DEBUG) {
                console.group("RESPONSE:");
                console.info("Id:", msg.id);
                console.info("Msg:", msg.body);
                console.groupEnd();
            }
            //if have a id then find the callback function with the request
            var cb = this.callbacks[msg.id];
            delete this.callbacks[msg.id];
            if (typeof cb !== 'function') {
                return;
            }
            if (msg.body && msg.body.code == 500) {
                var obj = { "code": 500, "desc": "服务器内部错误", "key": "INTERNAL_ERROR" };
                msg.body.error = obj;
            }
            cb(msg.body);
            return;
        };
        Pomelo.prototype.heartbeat = function (data) {
            if (!this.heartbeatInterval) {
                // no heartbeat
                return;
            }
            var obj = this._package.encode(Package.TYPE_HEARTBEAT);
            if (this.heartbeatTimeoutId) {
                egret.clearTimeout(this.heartbeatTimeoutId);
                this.heartbeatTimeoutId = null;
            }
            if (this.heartbeatId) {
                // already in a heartbeat interval
                return;
            }
            var self = this;
            self.heartbeatId = egret.setTimeout(function () {
                self.heartbeatId = null;
                self.send(obj);
                self.nextHeartbeatTimeout = Date.now() + self.heartbeatTimeout;
                self.heartbeatTimeoutId = egret.setTimeout(self.heartbeatTimeoutCb.bind(self, data), self, self.heartbeatTimeout);
            }, self, self.heartbeatInterval);
        };
        Pomelo.prototype.heartbeatTimeoutCb = function (data) {
            var gap = this.nextHeartbeatTimeout - Date.now();
            if (gap > this.gapThreshold) {
                this.heartbeatTimeoutId = egret.setTimeout(this.heartbeatTimeoutCb, this, gap);
            }
            else {
                console.error('server heartbeat timeout', data);
                this.emit(Pomelo.EVENT_HEART_BEAT_TIMEOUT, data);
                this._disconnect();
            }
        };
        Pomelo.prototype.off = function (event, fn) {
            this.removeAllListeners(event, fn);
        };
        Pomelo.prototype.removeAllListeners = function (event, fn) {
            // all
            if (0 == arguments.length) {
                this._callbacks = {};
                return;
            }
            // specific event
            var callbacks = this._callbacks[event];
            if (!callbacks) {
                return;
            }
            // remove all handlers
            if (event && !fn) {
                delete this._callbacks[event];
                return;
            }
            // remove specific handler
            var i = this.index(callbacks, fn._off || fn);
            if (~i) {
                callbacks.splice(i, 1);
            }
            return;
        };
        Pomelo.prototype.index = function (arr, obj) {
            if ([].indexOf) {
                return arr.indexOf(obj);
            }
            for (var i = 0; i < arr.length; ++i) {
                if (arr[i] === obj)
                    return i;
            }
            return -1;
        };
        Pomelo.prototype.disconnect = function () {
            this._disconnect();
        };
        Pomelo.prototype._disconnect = function () {
            console.warn("[Pomelo] client disconnect ...");
            if (this.socket && this.socket.connected)
                this.socket.close();
            this.socket = null;
            if (this.heartbeatId) {
                egret.clearTimeout(this.heartbeatId);
                this.heartbeatId = null;
            }
            if (this.heartbeatTimeoutId) {
                egret.clearTimeout(this.heartbeatTimeoutId);
                this.heartbeatTimeoutId = null;
            }
        };
        Pomelo.prototype.processPackage = function (msg) {
            this.handlers[msg.type].apply(this, [msg.body]);
        };
        Pomelo.prototype.handshake = function (resData) {
            var data = JSON.parse(Protocol.strdecode(resData));
            if (data.code === this.RES_OLD_CLIENT) {
                this.emit(Pomelo.EVENT_IO_ERROR, 'client version not fullfill');
                return;
            }
            if (data.code !== this.RES_OK) {
                this.emit(Pomelo.EVENT_IO_ERROR, 'handshake fail');
                return;
            }
            this.handshakeInit(data);
            var obj = this._package.encode(Package.TYPE_HANDSHAKE_ACK);
            this.send(obj);
            if (this.initCallback) {
                this.initCallback(data);
                this.initCallback = null;
            }
        };
        Pomelo.prototype.handshakeInit = function (data) {
            if (data.sys) {
                Routedic.init(data.sys.dict);
                Protobuf.init(data.sys.protos);
            }
            if (data.sys && data.sys.heartbeat) {
                this.heartbeatInterval = data.sys.heartbeat * 1000; // heartbeat interval
                this.heartbeatTimeout = this.heartbeatInterval * 2; // max heartbeat timeout
            }
            else {
                this.heartbeatInterval = 0;
                this.heartbeatTimeout = 0;
            }
            if (typeof this.handshakeCallback === 'function') {
                this.handshakeCallback(data.user);
            }
        };
        Pomelo.prototype.send = function (byte) {
            if (this.socket && this.socket.connected) {
                this.socket.writeBytes(byte);
                this.socket.flush();
            }
        };
        //private deCompose(msg){
        //    return JSON.parse(Protocol.strdecode(msg.body));
        //}
        Pomelo.prototype.emit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var params = [].slice.call(arguments, 1);
            var callbacks = this._callbacks[event];
            if (callbacks) {
                callbacks = callbacks.slice(0);
                for (var i = 0, len = callbacks.length; i < len; ++i) {
                    callbacks[i].apply(this, params);
                }
            }
            return this;
        };
        return Pomelo;
    }());
    Pomelo.DEBUG = true;
    Pomelo.EVENT_IO_ERROR = "io-error";
    Pomelo.EVENT_CLOSE = "close";
    Pomelo.EVENT_KICK = "onKick";
    Pomelo.EVENT_HEART_BEAT_TIMEOUT = 'heartbeat timeout';
    PomeloForEgret.Pomelo = Pomelo;
    __reflect(Pomelo.prototype, "PomeloForEgret.Pomelo");
    var Package = (function () {
        function Package() {
        }
        Package.prototype.encode = function (type, body) {
            var length = body ? body.length : 0;
            var buffer = new egret.ByteArray();
            buffer.writeByte(type & 0xff);
            buffer.writeByte((length >> 16) & 0xff);
            buffer.writeByte((length >> 8) & 0xff);
            buffer.writeByte(length & 0xff);
            if (body)
                buffer.writeBytes(body, 0, body.length);
            return buffer;
        };
        Package.prototype.decode = function (buffer) {
            var type = buffer.readUnsignedByte();
            var len = (buffer.readUnsignedByte() << 16 | buffer.readUnsignedByte() << 8 | buffer.readUnsignedByte()) >>> 0;
            var body;
            if (buffer.bytesAvailable >= len) {
                body = new egret.ByteArray();
                if (len)
                    buffer.readBytes(body, 0, len);
            }
            else {
                console.log("[Package] no enough length for current type:", type);
            }
            return { type: type, body: body, length: len };
        };
        return Package;
    }());
    Package.TYPE_HANDSHAKE = 1;
    Package.TYPE_HANDSHAKE_ACK = 2;
    Package.TYPE_HEARTBEAT = 3;
    Package.TYPE_DATA = 4;
    Package.TYPE_KICK = 5;
    __reflect(Package.prototype, "Package", ["IPackage"]);
    var Message = (function () {
        function Message() {
        }
        Message.prototype.encode = function (id, route, msg) {
            var buffer = new egret.ByteArray();
            var type = id ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;
            var byte = Protobuf.encode(route, msg) || Protocol.strencode(JSON.stringify(msg));
            var rot = Routedic.getID(route) || route;
            buffer.writeByte((type << 1) | ((typeof (rot) == "string") ? 0 : 1));
            if (id) {
                // 7.x
                do {
                    var tmp = id % 128;
                    var next = Math.floor(id / 128);
                    if (next != 0) {
                        tmp = tmp + 128;
                    }
                    buffer.writeByte(tmp);
                    id = next;
                } while (id != 0);
            }
            if (rot) {
                if (typeof rot == "string") {
                    buffer.writeByte(rot.length & 0xff);
                    buffer.writeUTFBytes(rot);
                }
                else {
                    buffer.writeByte((rot >> 8) & 0xff);
                    buffer.writeByte(rot & 0xff);
                }
            }
            if (byte) {
                buffer.writeBytes(byte);
            }
            return buffer;
        };
        Message.prototype.decode = function (buffer) {
            // parse flag
            var flag = buffer.readUnsignedByte();
            var compressRoute = flag & Message.MSG_COMPRESS_ROUTE_MASK;
            var type = (flag >> 1) & Message.MSG_TYPE_MASK;
            var route;
            // parse id
            var id = 0;
            if (type === Message.TYPE_REQUEST || type === Message.TYPE_RESPONSE) {
                // 7.x
                var i = 0;
                do {
                    var m = buffer.readUnsignedByte();
                    id = id + ((m & 0x7f) * Math.pow(2, (7 * i)));
                    i++;
                } while (m >= 128);
            }
            // parse route
            if (type === Message.TYPE_REQUEST || type === Message.TYPE_NOTIFY || type === Message.TYPE_PUSH) {
                if (compressRoute) {
                    route = buffer.readUnsignedShort();
                }
                else {
                    var routeLen = buffer.readUnsignedByte();
                    route = routeLen ? buffer.readUTFBytes(routeLen) : "";
                }
            }
            //else if (type === Message.TYPE_RESPONSE)
            //{
            //    route = Pomelo.requests[id].route;
            //}
            //
            if (!id && !(typeof (route) == "string")) {
                route = Routedic.getName(route);
            }
            var body = Protobuf.decode(route, buffer) || JSON.parse(Protocol.strdecode(buffer));
            return { id: id, type: type, route: route, body: body };
        };
        return Message;
    }());
    Message.MSG_FLAG_BYTES = 1;
    Message.MSG_ROUTE_CODE_BYTES = 2;
    Message.MSG_ID_MAX_BYTES = 5;
    Message.MSG_ROUTE_LEN_BYTES = 1;
    Message.MSG_ROUTE_CODE_MAX = 0xffff;
    Message.MSG_COMPRESS_ROUTE_MASK = 0x1;
    Message.MSG_TYPE_MASK = 0x7;
    Message.TYPE_REQUEST = 0;
    Message.TYPE_NOTIFY = 1;
    Message.TYPE_RESPONSE = 2;
    Message.TYPE_PUSH = 3;
    __reflect(Message.prototype, "Message", ["IMessage"]);
    var Protocol = (function () {
        function Protocol() {
        }
        Protocol.strencode = function (str) {
            var buffer = new egret.ByteArray();
            buffer.length = str.length;
            buffer.writeUTFBytes(str);
            return buffer;
        };
        Protocol.strdecode = function (byte) {
            return byte.readUTFBytes(byte.bytesAvailable);
        };
        return Protocol;
    }());
    __reflect(Protocol.prototype, "Protocol");
    var Protobuf = (function () {
        function Protobuf() {
        }
        Protobuf.init = function (protos) {
            this._clients = protos && protos.client || {};
            this._servers = protos && protos.server || {};
        };
        Protobuf.encode = function (route, msg) {
            var protos = this._clients[route];
            if (!protos)
                return null;
            return this.encodeProtos(protos, msg);
        };
        Protobuf.decode = function (route, buffer) {
            var protos = this._servers[route];
            if (!protos)
                return null;
            return this.decodeProtos(protos, buffer);
        };
        Protobuf.encodeProtos = function (protos, msg) {
            var buffer = new egret.ByteArray();
            for (var name in msg) {
                if (protos[name]) {
                    var proto = protos[name];
                    switch (proto.option) {
                        case "optional":
                        case "required":
                            buffer.writeBytes(this.encodeTag(proto.type, proto.tag));
                            this.encodeProp(msg[name], proto.type, protos, buffer);
                            break;
                        case "repeated":
                            if (!!msg[name] && msg[name].length > 0) {
                                this.encodeArray(msg[name], proto, protos, buffer);
                            }
                            break;
                    }
                }
            }
            return buffer;
        };
        Protobuf.decodeProtos = function (protos, buffer) {
            var msg = {};
            while (buffer.bytesAvailable) {
                var head = this.getHead(buffer);
                var name = protos.__tags[head.tag];
                switch (protos[name].option) {
                    case "optional":
                    case "required":
                        msg[name] = this.decodeProp(protos[name].type, protos, buffer);
                        break;
                    case "repeated":
                        if (!msg[name]) {
                            msg[name] = [];
                        }
                        this.decodeArray(msg[name], protos[name].type, protos, buffer);
                        break;
                }
            }
            return msg;
        };
        Protobuf.encodeTag = function (type, tag) {
            var value = this.TYPES[type] != undefined ? this.TYPES[type] : 2;
            return this.encodeUInt32((tag << 3) | value);
        };
        Protobuf.getHead = function (buffer) {
            var tag = this.decodeUInt32(buffer);
            return { type: tag & 0x7, tag: tag >> 3 };
        };
        Protobuf.encodeProp = function (value, type, protos, buffer) {
            switch (type) {
                case 'uInt32':
                    buffer.writeBytes(this.encodeUInt32(value));
                    break;
                case 'int32':
                case 'sInt32':
                    buffer.writeBytes(this.encodeSInt32(value));
                    break;
                case 'float':
                    //Float32Array
                    var floats = new egret.ByteArray();
                    floats.endian = egret.Endian.LITTLE_ENDIAN;
                    floats.writeFloat(value);
                    buffer.writeBytes(floats);
                    break;
                case 'double':
                    var doubles = new egret.ByteArray();
                    doubles.endian = egret.Endian.LITTLE_ENDIAN;
                    doubles.writeDouble(value);
                    buffer.writeBytes(doubles);
                    break;
                case 'string':
                    buffer.writeBytes(this.encodeUInt32(value.length));
                    buffer.writeUTFBytes(value);
                    break;
                default:
                    var proto = protos.__messages[type] || this._clients["message " + type];
                    if (!!proto) {
                        var buf = this.encodeProtos(proto, value);
                        buffer.writeBytes(this.encodeUInt32(buf.length));
                        buffer.writeBytes(buf);
                    }
                    break;
            }
        };
        Protobuf.decodeProp = function (type, protos, buffer) {
            switch (type) {
                case 'uInt32':
                    return this.decodeUInt32(buffer);
                case 'int32':
                case 'sInt32':
                    return this.decodeSInt32(buffer);
                case 'float':
                    var floats = new egret.ByteArray();
                    buffer.readBytes(floats, 0, 4);
                    floats.endian = egret.Endian.LITTLE_ENDIAN;
                    var float = buffer.readFloat();
                    return floats.readFloat();
                case 'double':
                    var doubles = new egret.ByteArray();
                    buffer.readBytes(doubles, 0, 8);
                    doubles.endian = egret.Endian.LITTLE_ENDIAN;
                    return doubles.readDouble();
                case 'string':
                    var length = this.decodeUInt32(buffer);
                    return buffer.readUTFBytes(length);
                default:
                    var proto = protos && (protos.__messages[type] || this._servers["message " + type]);
                    if (proto) {
                        var len = this.decodeUInt32(buffer);
                        if (len) {
                            var buf = new egret.ByteArray();
                            buffer.readBytes(buf, 0, len);
                        }
                        return len ? Protobuf.decodeProtos(proto, buf) : false;
                    }
                    break;
            }
        };
        Protobuf.isSimpleType = function (type) {
            return (type === 'uInt32' ||
                type === 'sInt32' ||
                type === 'int32' ||
                type === 'uInt64' ||
                type === 'sInt64' ||
                type === 'float' ||
                type === 'double');
        };
        Protobuf.encodeArray = function (array, proto, protos, buffer) {
            var isSimpleType = this.isSimpleType;
            if (isSimpleType(proto.type)) {
                buffer.writeBytes(this.encodeTag(proto.type, proto.tag));
                buffer.writeBytes(this.encodeUInt32(array.length));
                var encodeProp = this.encodeProp;
                for (var i = 0; i < array.length; i++) {
                    encodeProp(array[i], proto.type, protos, buffer);
                }
            }
            else {
                var encodeTag = this.encodeTag;
                for (var j = 0; j < array.length; j++) {
                    buffer.writeBytes(encodeTag(proto.type, proto.tag));
                    this.encodeProp(array[j], proto.type, protos, buffer);
                }
            }
        };
        Protobuf.decodeArray = function (array, type, protos, buffer) {
            var isSimpleType = this.isSimpleType;
            var decodeProp = this.decodeProp;
            if (isSimpleType(type)) {
                var length = this.decodeUInt32(buffer);
                for (var i = 0; i < length; i++) {
                    array.push(decodeProp(type, protos, buffer));
                }
            }
            else {
                array.push(decodeProp(type, protos, buffer));
            }
        };
        Protobuf.encodeUInt32 = function (n) {
            var result = new egret.ByteArray();
            do {
                var tmp = n % 128;
                var next = Math.floor(n / 128);
                if (next !== 0) {
                    tmp = tmp + 128;
                }
                result.writeByte(tmp);
                n = next;
            } while (n !== 0);
            return result;
        };
        Protobuf.decodeUInt32 = function (buffer) {
            var n = 0;
            for (var i = 0; i < buffer.length; i++) {
                var m = buffer.readUnsignedByte();
                n = n + ((m & 0x7f) * Math.pow(2, (7 * i)));
                if (m < 128) {
                    return n;
                }
            }
            return n;
        };
        Protobuf.encodeSInt32 = function (n) {
            n = n < 0 ? (Math.abs(n) * 2 - 1) : n * 2;
            return this.encodeUInt32(n);
        };
        Protobuf.decodeSInt32 = function (buffer) {
            var n = this.decodeUInt32(buffer);
            var flag = ((n % 2) === 1) ? -1 : 1;
            n = ((n % 2 + n) / 2) * flag;
            return n;
        };
        return Protobuf;
    }());
    Protobuf.TYPES = {
        uInt32: 0,
        sInt32: 0,
        int32: 0,
        double: 1,
        string: 2,
        message: 2,
        float: 5
    };
    Protobuf._clients = {};
    Protobuf._servers = {};
    __reflect(Protobuf.prototype, "Protobuf");
    var Routedic = (function () {
        function Routedic() {
        }
        Routedic.init = function (dict) {
            this._names = dict || {};
            var _names = this._names;
            var _ids = this._ids;
            for (var name in _names) {
                _ids[_names[name]] = name;
            }
        };
        Routedic.getID = function (name) {
            return this._names[name];
        };
        Routedic.getName = function (id) {
            return this._ids[id];
        };
        return Routedic;
    }());
    Routedic._ids = {};
    Routedic._names = {};
    __reflect(Routedic.prototype, "Routedic");
})(PomeloForEgret || (PomeloForEgret = {}));
