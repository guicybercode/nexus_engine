(function() {
  "use strict";

  var Socket = function(endpoint, opts) {
    this.endpoint = endpoint;
    this.opts = opts || {};
    this.conn = null;
    this.channels = [];
    this.sendBuffer = [];
    this.ref = 0;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.reconnectAfterMs = 500;
    this.maxReconnectAfterMs = 30000;
    this.heartbeatIntervalMs = 30000;
    this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    };
    this.messageBuffer = [];
    this.binaryType = "arraybuffer";
    this.skipHeartbeat = false;
    this.heartbeatTimeoutMs = 10000;
    this.reconnectTimer = null;
    this.reconnectAfterMs = 500;
    this.maxReconnectAfterMs = 30000;
    this.heartbeatIntervalMs = 30000;
    this.heartbeatTimeoutMs = 10000;
    this.skipHeartbeat = false;
    this.binaryType = "arraybuffer";
    this.messageBuffer = [];
    this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    };
    this.ref = 0;
    this.sendBuffer = [];
    this.channels = [];
    this.conn = null;
    this.opts = opts || {};
    this.endpoint = endpoint;
  };

  Socket.prototype.connect = function() {
    var self = this;
    var ws = new WebSocket(this.endpoint);
    this.conn = ws;
    ws.binaryType = this.binaryType;
    ws.onopen = function() {
      self.flushSendBuffer();
      self.reconnectAfterMs = 500;
      if (!self.skipHeartbeat) {
        self.startHeartbeat();
      }
      self.stateChangeCallbacks.open.forEach(function(callback) {
        callback();
      });
    };
    ws.onclose = function(event) {
      self.stopHeartbeat();
      self.stateChangeCallbacks.close.forEach(function(callback) {
        callback(event);
      });
      if (!self.closeWasClean) {
        self.reconnectTimer = setTimeout(function() {
          self.connect();
        }, self.reconnectAfterMs);
        self.reconnectAfterMs = Math.min(self.reconnectAfterMs * 2, self.maxReconnectAfterMs);
      }
    };
    ws.onerror = function(error) {
      self.stateChangeCallbacks.error.forEach(function(callback) {
        callback(error);
      });
    };
    ws.onmessage = function(event) {
      self.decode(event.data, function(payload) {
        self.messageBuffer.push(payload);
        self.stateChangeCallbacks.message.forEach(function(callback) {
          callback(payload);
        });
      });
    };
  };

  Socket.prototype.disconnect = function(callback) {
    this.closeWasClean = true;
    if (this.conn) {
      this.conn.onclose = function() {};
      this.conn.close();
      this.conn = null;
    }
    if (callback) {
      callback();
    }
  };

  Socket.prototype.onOpen = function(callback) {
    this.stateChangeCallbacks.open.push(callback);
  };

  Socket.prototype.onClose = function(callback) {
    this.stateChangeCallbacks.close.push(callback);
  };

  Socket.prototype.onError = function(callback) {
    this.stateChangeCallbacks.error.push(callback);
  };

  Socket.prototype.onMessage = function(callback) {
    this.stateChangeCallbacks.message.push(callback);
  };

  Socket.prototype.channel = function(topic, chanParams) {
    var chan = new Channel(topic, chanParams, this);
    this.channels.push(chan);
    return chan;
  };

  Socket.prototype.remove = function(channel) {
    this.channels = this.channels.filter(function(c) {
      return c.joinRef() !== channel.joinRef();
    });
  };

  Socket.prototype.startHeartbeat = function() {
    var self = this;
    if (this.heartbeatTimer) {
      return;
    }
    this.heartbeatTimer = setInterval(function() {
      self.sendHeartbeat();
    }, this.heartbeatIntervalMs);
  };

  Socket.prototype.stopHeartbeat = function() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  };

  Socket.prototype.sendHeartbeat = function() {
    var self = this;
    if (this.conn && this.conn.readyState === WebSocket.OPEN) {
      this.push({topic: "phoenix", event: "heartbeat", payload: {}, ref: null});
    }
  };

  Socket.prototype.flushSendBuffer = function() {
    if (this.conn && this.conn.readyState === WebSocket.OPEN && this.sendBuffer.length > 0) {
      this.sendBuffer.forEach(function(message) {
        self.conn.send(message);
      });
      this.sendBuffer = [];
    }
  };

  Socket.prototype.push = function(data) {
    var self = this;
    var callback = function() {
      self.conn.send(JSON.stringify(data));
    };
    if (this.conn && this.conn.readyState === WebSocket.OPEN) {
      callback();
    } else {
      this.sendBuffer.push(callback);
    }
  };

  Socket.prototype.makeRef = function() {
    var newRef = this.ref + 1;
    if (newRef === this.ref) {
      this.ref = 0;
    } else {
      this.ref = newRef;
    }
    return this.ref.toString();
  };

  Socket.prototype.decode = function(rawPayload, callback) {
    if (rawPayload.constructor === ArrayBuffer) {
      callback(JSON.parse(new TextDecoder().decode(rawPayload)));
    } else {
      callback(JSON.parse(rawPayload));
    }
  };

  var Channel = function(topic, params, socket) {
    this.state = "closed";
    this.topic = topic;
    this.params = params || {};
    this.socket = socket;
    this.bindings = [];
    this.timeout = this.socket.timeout || 10000;
    this.joinedOnce = false;
    this.joinRef = null;
    this.pushBuffer = [];
    this.rejoinTimer = null;
    this.stateChangeCallbacks = {
      join: [],
      leave: [],
      error: [],
      close: []
    };
  };

  Channel.prototype.join = function(timeout) {
    if (this.joinedOnce) {
      throw "tried to join multiple times. 'join' can only be called a single time per channel instance";
    } else {
      this.timeout = timeout || this.timeout;
      this.joinedOnce = true;
      this.rejoin();
      return this;
    }
  };

  Channel.prototype.onClose = function(callback) {
    this.stateChangeCallbacks.close.push(callback);
  };

  Channel.prototype.onError = function(callback) {
    this.stateChangeCallbacks.error.push(callback);
  };

  Channel.prototype.on = function(event, callback) {
    this.bindings.push({event: event, callback: callback});
  };

  Channel.prototype.off = function(event) {
    this.bindings = this.bindings.filter(function(binding) {
      return binding.event !== event;
    });
  };

  Channel.prototype.trigger = function(event, payload, ref) {
    this.bindings.filter(function(binding) {
      return binding.event === event;
    }).forEach(function(binding) {
      binding.callback(payload, ref);
    });
  };

  Channel.prototype.push = function(event, payload, timeout) {
    var self = this;
    if (!this.joinedOnce) {
      throw "tried to push '" + event + "' to '" + this.topic + "' before joining. Use channel.join() before pushing events";
    }
    var pushTimeout = timeout || this.timeout;
    var ref = this.socket.makeRef();
    var message = {
      topic: this.topic,
      event: event,
      payload: payload || {},
      ref: ref
    };
    this.pushBuffer.push(message);
    this.socket.push(message);
    var timer = setTimeout(function() {
      self.trigger("timeout", {});
    }, pushTimeout);
    var receivedReply = false;
    this.on(this.socket.replyEventName(ref), function(payload, status) {
      clearTimeout(timer);
      receivedReply = true;
      self.trigger(event + ":reply", payload, status);
    });
    return {
      receive: function(status, callback) {
        if (receivedReply) {
          return;
        }
        self.on(self.socket.replyEventName(ref), function(payload, receivedStatus) {
          if (status === receivedStatus) {
            callback(payload);
          }
        });
      }
    };
  };

  Channel.prototype.leave = function(timeout) {
    var self = this;
    this.timeout = timeout || this.timeout;
    this.state = "leaving";
    var onClose = function() {
      self.socket.remove(self);
      self.stateChangeCallbacks.close.forEach(function(callback) {
        callback();
      });
    };
    var leavePush = this.push("phx_leave", {});
    leavePush.receive("ok", function() {
      onClose();
    }).receive("timeout", function() {
      onClose();
    });
    return this;
  };

  Channel.prototype.rejoin = function(timeout) {
    var self = this;
    if (this.socket.conn && this.socket.conn.readyState !== WebSocket.OPEN) {
      return;
    }
    this.timeout = timeout || this.timeout;
    this.state = "joining";
    this.joinRef = this.socket.makeRef();
    var rejoinPush = this.push("phx_join", this.params);
    rejoinPush.receive("ok", function() {
      self.state = "joined";
      self.rejoinTimer = null;
      self.pushBuffer.forEach(function(message) {
        self.socket.push(message);
      });
      self.pushBuffer = [];
      self.stateChangeCallbacks.join.forEach(function(callback) {
        callback();
      });
    }).receive("timeout", function() {
      if (self.socket.conn && self.socket.conn.readyState === WebSocket.OPEN) {
        self.state = "errored";
        self.rejoinTimer = setTimeout(function() {
          self.rejoin();
        }, self.socket.reconnectAfterMs);
      }
    });
  };

  Channel.prototype.joinRef = function() {
    return this.joinRef;
  };

  Socket.prototype.replyEventName = function(ref) {
    return "chan_reply_" + ref;
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Socket;
  } else {
    window.Socket = Socket;
  }
})();

