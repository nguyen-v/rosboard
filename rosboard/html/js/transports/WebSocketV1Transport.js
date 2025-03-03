class WebSocketV1Transport {
    constructor({path, onOpen, onClose, onRosMsg, onTopics, onSystem}) {
      this.path = path;
      this.onOpen = onOpen ? onOpen.bind(this) : null;
      this.onClose = onClose ? onClose.bind(this) : null;
      this.onMsg = onMsg ? onMsg.bind(this) : null;
      this.onTopics = onTopics ? onTopics.bind(this) : null;
      this.onSystem = onSystem ? onSystem.bind(this) : null;
      this.ws = null;
      this.leftJoystick = { x: 0.0, y: 0.0 };
      this.rightJoystick = { x: 0.0 };
    }
  
    connect() {
      var protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
      let abspath = protocolPrefix + '//' + location.host + this.path;
  
      let that = this;
  
      this.ws = new WebSocket(abspath);
  
      this.ws.onopen = function(){
        console.log("connected");
        if(that.onOpen) that.onOpen(that);
      }
      
      this.ws.onclose = function(){
        console.log("disconnected");
        if(that.onClose) that.onClose(that);
      }
  
      this.ws.onmessage = function(wsmsg) {
        let data = [];
        try {
          // try fast native parser
          data = JSON.parse(wsmsg.data);
        } catch(e) {
          // Python may have included Infinity, -Infinity, NaN
          // fall back to a JSON5 parsers which will deal with these well but is almost 50X slower in Chrome
          data = JSON5.parse(wsmsg.data);
        }

        let wsMsgType = data[0];
  
        if(wsMsgType === WebSocketV1Transport.MSG_PING) {
          this.send(JSON.stringify([WebSocketV1Transport.MSG_PONG, {
            [WebSocketV1Transport.PONG_SEQ]: data[1][WebSocketV1Transport.PING_SEQ],
            [WebSocketV1Transport.PONG_TIME]: Date.now(),
          }]));
        }
        else if(wsMsgType === WebSocketV1Transport.MSG_MSG && that.onMsg) that.onMsg(data[1]);
        else if(wsMsgType === WebSocketV1Transport.MSG_TOPICS && that.onTopics) that.onTopics(data[1]);
        else if(wsMsgType === WebSocketV1Transport.MSG_SYSTEM && that.onSystem) that.onSystem(data[1]);
        else console.log("received unknown message: " + wsmsg.data);
        this.send(JSON.stringify([WebSocketV1Transport.JOY_MSG, {
          left: {
            x: that.leftJoystick ? that.leftJoystick.x.toFixed(3) : "0.000",
            y: that.leftJoystick ? that.leftJoystick.y.toFixed(3) : "0.000"
          },
          right: {
            x: that.rightJoystick ? that.rightJoystick.x.toFixed(3) : "0.000"
          },
          buttons: that.buttons,
        }]));
      }
    }
  
    isConnected() {
      return (this.ws && this.ws.readyState === this.ws.OPEN);
    }
  
    subscribe({topicName, maxUpdateRate = 24.0}) {
      this.ws.send(JSON.stringify([WebSocketV1Transport.MSG_SUB, {topicName: topicName, maxUpdateRate: maxUpdateRate}]));
    }

    unsubscribe({topicName}) {
      this.ws.send(JSON.stringify([WebSocketV1Transport.MSG_UNSUB, {topicName: topicName}]));
    }

    update_joy({ joystick, x, y }) {
      if (joystick === "left") {
        this.leftJoystick = { x, y };
      } else if (joystick === "right") {
        this.rightJoystick = { x };
      }
    }

  }
  
  WebSocketV1Transport.MSG_PING = "p";
  WebSocketV1Transport.MSG_PONG = "q";
  WebSocketV1Transport.MSG_MSG = "m";
  WebSocketV1Transport.MSG_TOPICS = "t";
  WebSocketV1Transport.MSG_SUB = "s";
  WebSocketV1Transport.MSG_SYSTEM = "y";
  WebSocketV1Transport.MSG_UNSUB = "u";

  WebSocketV1Transport.PING_SEQ= "s";
  WebSocketV1Transport.PONG_SEQ = "s";
  WebSocketV1Transport.PONG_TIME = "t";
  WebSocketV1Transport.JOY_MSG = "j";