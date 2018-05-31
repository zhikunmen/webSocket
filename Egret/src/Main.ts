//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

class Main extends eui.UILayer {


    protected createChildren(): void {
        super.createChildren();

        egret.lifecycle.addLifecycleListener((context) => {
            // custom lifecycle plugin
        })

        egret.lifecycle.onPause = () => {
            egret.ticker.pause();
        }

        egret.lifecycle.onResume = () => {
            egret.ticker.resume();
        }

        //inject the custom material parser
        //注入自定义的素材解析器
        let assetAdapter = new AssetAdapter();
        egret.registerImplementation("eui.IAssetAdapter", assetAdapter);
        egret.registerImplementation("eui.IThemeAdapter", new ThemeAdapter());


        this.runGame().catch(e => {
            console.log(e);
        })
    }

    private async runGame() {
        await this.loadResource()
        this.createGameScene();
        // const result = await RES.getResAsync("description_json",()=>{},this);
        // this.startAnimation(result);
        await platform.login();
        const userInfo = await platform.getUserInfo();
        console.log(userInfo);
        this.addEventListener(egret.Event.ENTER_FRAME,this.a.call(this,"a"),this);
    }

    private a(e): void{
        console.log(e);
    }

    private async loadResource() {
        try {
            const loadingView = new LoadingUI();
            this.stage.addChild(loadingView);
            await RES.loadConfig("resource/default.res.json", "resource/");
            await this.loadTheme();
            await RES.loadGroup("preload");
            this.stage.removeChild(loadingView);
        }
        catch (e) {
            console.error(e);
        }
    }

    private loadTheme() {
        return new Promise((resolve, reject) => {
            // load skin theme configuration file, you can manually modify the file. And replace the default skin.
            //加载皮肤主题配置文件,可以手动修改这个文件。替换默认皮肤。
            let theme = new eui.Theme("resource/default.thm.json", this.stage);
            theme.addEventListener(eui.UIEvent.COMPLETE, () => {
                resolve();
            }, this);

        })
    }

    private textfield: egret.TextField;
    /**
     * 创建场景界面
     * Create scene interface
     */
    protected createGameScene(): void {

        var obj = {};
        obj["log"] = console.log;
        obj["log"].call(console,this);

        let sky = this.createBitmapByName("bg_jpg");
        this.addChild(sky);
        let stageW = this.stage.stageWidth;
        let stageH = this.stage.stageHeight;
        sky.width = stageW;
        sky.height = stageH;

        let topMask = new egret.Shape();
        topMask.graphics.beginFill(0x000000, 0.5);
        topMask.graphics.drawRect(0, 0, stageW, 172);
        topMask.graphics.endFill();
        topMask.y = 33;
        this.addChild(topMask);

        let icon: egret.Bitmap = this.createBitmapByName("egret_icon_png");
        this.addChild(icon);
        icon.x = 26;
        icon.y = 33;

        let line = new egret.Shape();
        line.graphics.lineStyle(2, 0xffffff);
        line.graphics.moveTo(0, 0);
        line.graphics.lineTo(0, 117);
        line.graphics.endFill();
        line.x = 172;
        line.y = 61;
        this.addChild(line);


        let colorLabel = new egret.TextField();
        colorLabel.textColor = 0xffffff;
        colorLabel.width = stageW - 172;
        colorLabel.textAlign = "center";
        colorLabel.text = "Hello Egret";
        colorLabel.size = 24;
        colorLabel.x = 172;
        colorLabel.y = 80;
        this.addChild(colorLabel);

        let textfield = new egret.TextField();
        this.addChild(textfield);
        textfield.alpha = 0;
        textfield.width = stageW - 172;
        textfield.textAlign = egret.HorizontalAlign.CENTER;
        textfield.size = 24;
        textfield.textColor = 0xffffff;
        textfield.x = 172;
        textfield.y = 135;
        this.textfield = textfield;

        let button = new eui.Button();
        button.label = "Click!";
        button.horizontalCenter = 0;
        button.verticalCenter = 0;
        this.addChild(button);
        button.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onButtonClick, this);

        var panel = new egret.DisplayObjectContainer();
        this.addChild(panel);
        var panelb = new egret.DisplayObjectContainer();
        var c = new eui.Label();
        c.text = "c";
        panelb.addChild(c);
        panel.addChild(panelb);
        c.addEventListener("c", () => {
            console.error("c");
        }, this);
        setTimeout(() => { c.dispatchEventWith("c", true); }, 1000);
        // this.showProxy();
        // this.showDefinePeoperty();
        // this.studyPromise();
        // this.studyGenerator();
        this.showAsync();
    }

    public showProxy(): void{
        var person = {
            name: "门智坤"
        }
        var obj = new Proxy(person,{
            get: function(target, property){
                console.log(property);
                if(property in target){
                    console.error(target[property]);
                }else{
                    throw new ReferenceError("property erro " + property.toString());
                }
            }
        })
        obj.name;
        obj["sex"];
    }

    public showDefinePeoperty(): void{
        var a = new Object();
        // Object.defineProperty(a,"data",{
        //     get : function(){
        //         return 2;
        //     },
        //     set : function(value){
        //         console.error("ni yao fuzhi le" + value);
        //     }
        // })
        Object.defineProperty(a, "data", ()=>{
            return 222;
        })
        a["data"] = 1;
        console.log(a["data"]);
    }


    public studyPromise(): void{
        var promise = new Promise((resolve,reject)=>{
            console.log("开始学习promise");
            setTimeout(function() {
                console.log("学习");
                reject ("成功")
            }, 1000);
        })
        promise.then((data)=>{
            console.error(data);
        })
    }


    public showAsync(): void{
        this.timeout().then((data)=>{
            console.warn(data);
        }).catch(e=>{
            console.error(e + "ddd");
        })
    }

    private async timeout(){
        // var a = await RES.getResByUrl("http://image.mj.ucjoy.com:8888/img/65a6f00c15278e971f48c6d3.jpg",(data)=>{
        //     console.error(data);
        //     // return data;
        // },this,RES.ResourceItem.TYPE_IMAGE);
        return await  Promise.reject("111") ;
    }

    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    private createBitmapByName(name: string): egret.Bitmap {
        let result = new egret.Bitmap();
        let texture: egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }
    /**
     * 描述文件加载成功，开始播放动画
     * Description file loading is successful, start to play the animation
     */
    private startAnimation(result: Array<any>): void {
        let parser = new egret.HtmlTextParser();

        let textflowArr = result.map(text => parser.parse(text));
        let textfield = this.textfield;
        let count = -1;
        let change = () => {
            count++;
            if (count >= textflowArr.length) {
                count = 0;
            }
            let textFlow = textflowArr[count];

            // 切换描述内容
            // Switch to described content
            textfield.textFlow = textFlow;
            let tw = egret.Tween.get(textfield);
            tw.to({ "alpha": 1 }, 200);
            tw.wait(2000);
            tw.to({ "alpha": 0 }, 200);
            tw.call(change, this);
        };

        change();
    }

    /**
     * 点击按钮
     * Click the button
     */
    private onButtonClick(e: egret.TouchEvent) {
        this.testConnection();
        // let mgr = new NetMgr();
        // mgr.startSocket("127.0.9.1",3010);
    }

    public pomelo = new PomeloForEgret.Pomelo();

    public testConnection(): void {

        var host = "127.0.9.1";
        var port = "3010";
        this.pomelo.on(PomeloForEgret.Pomelo.EVENT_IO_ERROR, function (event) {
            //错误处理
            console.error("error", event);
        });
        this.pomelo.on(PomeloForEgret.Pomelo.EVENT_CLOSE, function (event) {
            //关闭处理
            console.error("close", event);
        });
        this.pomelo.on(PomeloForEgret.Pomelo.EVENT_HEART_BEAT_TIMEOUT, function (event) {
            //心跳timeout
            console.error("heart beat timeout", event);
        });
        this.pomelo.on(PomeloForEgret.Pomelo.EVENT_KICK, function (event) {
            //踢出
            console.error("kick", event);
        });

        var pomelo = this.pomelo;
        this.pomelo.init({
            host: host,
            port: port
        }, function () {
            //连接成功执行函数
            pomelo.request("connector.entryHandler.entry", "hello world", function (result) {
                //消息回调
                console.log("request", result);
            });

            pomelo.request("connector.entryHandler.publish", "haha", function (result) {
                //消息回调
                console.log("request", result);
            });

            pomelo.request("connector.entryHandler.subscribe", "hello world", function (result) {
                //消息回调
                console.log("request", result);
            });
            pomelo.request("connector.entryHandler.menzhikun","nihao",function(result){
                // console.log("menzhikun", result)
                console.error(result.name);
            });
        });

    }
}
