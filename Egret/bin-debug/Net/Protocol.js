var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var Protocol = (function () {
    function Protocol() {
    }
    return Protocol;
}());
__reflect(Protocol.prototype, "Protocol");
var CMDTYPE;
(function (CMDTYPE) {
    CMDTYPE[CMDTYPE["RECHARGE"] = 0] = "RECHARGE";
    CMDTYPE[CMDTYPE["NET"] = 1] = "NET";
    CMDTYPE[CMDTYPE["OTHER"] = 2] = "OTHER";
})(CMDTYPE || (CMDTYPE = {}));
