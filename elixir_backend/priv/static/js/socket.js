(function() {
  "use strict";

  var VSN = "2.0.0";
  var SOCKET_STATES = {connecting: 0, open: 1, closing: 2, closed: 3};
  var CHANNEL_STATES = {closed: "closed", errored: "errored", joined: "joined", joining: "joining", leaving: "leaving"};
  var CHANNEL_EVENTS = {close: "phx_close", error: "phx_error", join: "phx_join", reply: "phx_reply", leave: "phx_leave"};

  var Push = function(channel, event, payload, timeout) {
    this.channel = channel;
    this.event = event;
    this.payload = payload || {};
    this.receivedResp = null;
    this.timeout = timeout;
    this.timeoutTimer = null;
    this.recHooks = [];
    this.sent = false;
  };

  Push.prototype.resend = function(timeout) {
    this.timeout = timeout;
    this.reset();
    this.send();
  };

  Push.prototype.send = function() {
    if (this.hasReceived("timeout")) return;
    this.startTimeout();
    this.sent = true;
    this.channel.socket.push({
      topic: this.channel.topic,
      event: this.event,
      payload: this.payload,
      ref: this.ref,
      join_ref: this.channel.joinRef()
    });
  };

  Push.prototype.receive = function(status, callback) {
    if (this.hasReceived(status)) {
      callback(this.receivedResp.response);
    }
    this.recHooks.push({status: status, callback: callback});
    return this;
  };

  Push.prototype.reset = function() {
    this.cancelRefEvent();
    this.ref = null;
    this.refEvent = null;
    this.receivedResp = null;
    this.sent = false;
  };

  Push.prototype.matchReceive = function(payload) {
    this.recHooks.filter(function(h) { return h.status === payload.status; })
      .forEach(function(h) { h.callback(payload.response); });
  };

  Push.prototype.cancelRefEvent = function() {
    if (!this.refEvent) return;
    this.channel.off(this.refEvent);
  };

  Push.prototype.cancelTimeout = function() {
    clearTimeout(this.timeoutTimer);
    this.timeoutTimer = null;
  };

  Push.prototype.startTimeout = function() {
    var self = this;
    if (this.timeoutTimer) this.cancelTimeout();
    this.ref = this.channel.socket.makeRef();
    this.refEvent = this.channel.replyEventName(this.ref);

    this.channel.on(this.refEvent, function(payload) {
      self.cancelRefEvent();
      self.cancelTimeout();
      self.receivedResp = payload;
      self.matchReceive(payload);
    });

    this.timeoutTimer = setTimeout(function() {
      self.trigger("timeout", {});
    }, this.timeout);
  };

  Push.prototype.hasReceived = function(status) {
    return this.receivedResp && this.receivedResp.status === status;
  };

  Push.prototype.trigger = function(status, response) {
    this.channel.trigger(this.refEvent, {status: status, response: response});
  };

  var Channel = function(topic, params, socket) {
    var self = this;
    this.state = CHANNEL_STATES.closed;
    this.topic = topic;
    this.params = params || {};
    this.socket = socket;
    this.bindings = [];
    this.bindingRef = 0;
    this.timeout = socket.timeout;
    this.joinedOnce = false;
    this.joinPush = new Push(this, CHANNEL_EVENTS.join, this.params, this.timeout);
    this.pushBuffer = [];
    this.rejoinTimer = null;

    this.joinPush.receive("ok", function() {
      self.state = CHANNEL_STATES.joined;
      self.rejoinTimer = null;
      self.pushBuffer.forEach(function(push) { push.send(); });
      self.pushBuffer = [];
    });

    this.joinPush.receive("error", function() {
      self.state = CHANNEL_STATES.errored;
      if (self.socket.isConnected()) {
        self.rejoinTimer = setTimeout(function() { self.rejoin(); }, 5000);
      }
    });

    this.onClose(function() {
      self.rejoinTimer = null;
      self.state = CHANNEL_STATES.closed;
      self.socket.remove(self);
    });

    this.onError(function() {
      if (self.isLeaving() || self.isClosed()) return;
      self.state = CHANNEL_STATES.errored;
      if (self.socket.isConnected()) {
        self.rejoinTimer = setTimeout(function() { self.rejoin(); }, 5000);
      }
    });

    this.on(CHANNEL_EVENTS.reply, function(payload, ref) {
      self.trigger(self.replyEventName(ref), payload);
    });
  };

  Channel.prototype.join = function(timeout) {
    if (this.joinedOnce) {
      throw new Error("tried to join multiple times");
    }
    this.timeout = timeout || this.timeout;
    this.joinedOnce = true;
    this.rejoin();
    return this.joinPush;
  };

  Channel.prototype.onClose = function(callback) {
    this.on(CHANNEL_EVENTS.close, callback);
  };

  Channel.prototype.onError = function(callback) {
    return this.on(CHANNEL_EVENTS.error, function(reason) { callback(reason); });
  };

  Channel.prototype.on = function(event, callback) {
    var ref = this.bindingRef++;
    this.bindings.push({event: event, ref: ref, callback: callback});
    return ref;
  };

  Channel.prototype.off = function(event, ref) {
    this.bindings = this.bindings.filter(function(bind) {
      return !(bind.event === event && (typeof ref === "undefined" || ref === bind.ref));
    });
  };

  Channel.prototype.push = function(event, payload, timeout) {
    if (!this.joinedOnce) {
      throw new Error("tried to push '" + event + "' before joining");
    }
    var pushEvent = new Push(this, event, payload, timeout || this.timeout);
    if (this.canPush()) {
      pushEvent.send();
    } else {
      pushEvent.startTimeout();
      this.pushBuffer.push(pushEvent);
    }
    return pushEvent;
  };

  Channel.prototype.leave = function(timeout) {
    var self = this;
    this.state = CHANNEL_STATES.leaving;
    var onClose = function() {
      self.trigger(CHANNEL_EVENTS.close, "leave");
    };
    var leavePush = new Push(this, CHANNEL_EVENTS.leave, {}, timeout || this.timeout);
    leavePush.receive("ok", onClose).receive("timeout", onClose);
    leavePush.send();
    if (!this.canPush()) onClose();
    return leavePush;
  };

  Channel.prototype.trigger = function(event, payload, ref) {
    var handledPayload = this.onMessage(event, payload, ref);
    this.bindings.filter(function(bind) { return bind.event === event; })
      .forEach(function(bind) { bind.callback(handledPayload, ref); });
  };

  Channel.prototype.onMessage = function(event, payload, ref) { return payload; };

  Channel.prototype.isMember = function(topic, event, payload, joinRef) {
    if (this.topic !== topic) return false;
    if (joinRef && joinRef !== this.joinRef()) {
      return false;
    }
    return true;
  };

  Channel.prototype.joinRef = function() { return this.joinPush.ref; };
  Channel.prototype.rejoin = function(timeout) {
    if (this.isLeaving()) return;
    this.socket.leaveOpenTopic(this.topic);
    this.state = CHANNEL_STATES.joining;
    this.joinPush.resend(timeout || this.timeout);
  };
  Channel.prototype.replyEventName = function(ref) { return "chan_reply_" + ref; };
  Channel.prototype.isClosed = function() { return this.state === CHANNEL_STATES.closed; };
  Channel.prototype.isErrored = function() { return this.state === CHANNEL_STATES.errored; };
  Channel.prototype.isJoined = function() { return this.state === CHANNEL_STATES.joined; };
  Channel.prototype.isJoining = function() { return this.state === CHANNEL_STATES.joining; };
  Channel.prototype.isLeaving = function() { return this.state === CHANNEL_STATES.leaving; };
  Channel.prototype.canPush = function() { return this.socket.isConnected() && this.isJoined(); };

  var Socket = function(endPoint, opts) {
    var self = this;
    opts = opts || {};
    this.stateChangeCallbacks = {open: [], close: [], error: [], message: []};
    this.channels = [];
    this.sendBuffer = [];
    this.ref = 0;
    this.timeout = opts.timeout || 10000;
    this.transport = opts.transport || WebSocket;
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs || 30000;
    this.reconnectAfterMs = opts.reconnectAfterMs || function(tries) {
      return [1000, 2000, 5000, 10000][tries - 1] || 10000;
    };
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.pendingHeartbeatRef = null;
    this.endPoint = "";
    this.conn = null;

    var protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.endPoint = protocol + "//" + window.location.host + endPoint + "/websocket?vsn=" + VSN;
  };

  Socket.prototype.connect = function() {
    var self = this;
    if (this.conn) return;

    this.conn = new this.transport(this.endPoint);
    this.conn.onopen = function() { self.onConnOpen(); };
    this.conn.onerror = function(error) { self.onConnError(error); };
    this.conn.onmessage = function(event) { self.onConnMessage(event); };
    this.conn.onclose = function(event) { self.onConnClose(event); };
  };

  Socket.prototype.disconnect = function(callback, code, reason) {
    if (this.conn) {
      this.conn.onclose = function() {};
      if (code) { this.conn.close(code, reason || ""); } else { this.conn.close(); }
      this.conn = null;
    }
    if (callback) callback();
  };

  Socket.prototype.onOpen = function(callback) { this.stateChangeCallbacks.open.push(callback); };
  Socket.prototype.onClose = function(callback) { this.stateChangeCallbacks.close.push(callback); };
  Socket.prototype.onError = function(callback) { this.stateChangeCallbacks.error.push(callback); };
  Socket.prototype.onMessage = function(callback) { this.stateChangeCallbacks.message.push(callback); };

  Socket.prototype.onConnOpen = function() {
    var self = this;
    this.flushSendBuffer();
    this.reconnectTimer = null;
    this.resetHeartbeat();
    this.stateChangeCallbacks.open.forEach(function(callback) { callback(); });
  };

  Socket.prototype.resetHeartbeat = function() {
    var self = this;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(function() { self.sendHeartbeat(); }, this.heartbeatIntervalMs);
  };

  Socket.prototype.sendHeartbeat = function() {
    if (!this.isConnected()) return;
    if (this.pendingHeartbeatRef) {
      this.pendingHeartbeatRef = null;
      this.conn.close(1000, "hearbeat timeout");
      return;
    }
    this.pendingHeartbeatRef = this.makeRef();
    this.push({topic: "phoenix", event: "heartbeat", payload: {}, ref: this.pendingHeartbeatRef});
  };

  Socket.prototype.flushSendBuffer = function() {
    if (this.isConnected() && this.sendBuffer.length > 0) {
      this.sendBuffer.forEach(function(callback) { callback(); });
      this.sendBuffer = [];
    }
  };

  Socket.prototype.onConnClose = function(event) {
    var self = this;
    this.stateChangeCallbacks.close.forEach(function(callback) { callback(event); });
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(function() {
        self.reconnectTimer = null;
        self.connect();
      }, this.reconnectAfterMs(1));
    }
  };

  Socket.prototype.onConnError = function(error) {
    this.stateChangeCallbacks.error.forEach(function(callback) { callback(error); });
  };

  Socket.prototype.onConnMessage = function(rawMessage) {
    var self = this;
    this.decode(rawMessage.data, function(msg) {
      var topic = msg.topic;
      var event = msg.event;
      var payload = msg.payload;
      var ref = msg.ref;
      var joinRef = msg.join_ref;

      if (ref && ref === self.pendingHeartbeatRef) {
        self.pendingHeartbeatRef = null;
      }

      self.channels.filter(function(channel) {
        return channel.isMember(topic, event, payload, joinRef);
      }).forEach(function(channel) {
        channel.trigger(event, payload, ref);
      });

      self.stateChangeCallbacks.message.forEach(function(callback) { callback(msg); });
    });
  };

  Socket.prototype.decode = function(rawPayload, callback) {
    var parsed = JSON.parse(rawPayload);
    // Phoenix V2 sends arrays: [join_ref, ref, topic, event, payload]
    if (Array.isArray(parsed)) {
      callback({
        join_ref: parsed[0],
        ref: parsed[1],
        topic: parsed[2],
        event: parsed[3],
        payload: parsed[4]
      });
    } else {
      callback(parsed);
    }
  };

  Socket.prototype.encode = function(msg, callback) {
    callback(JSON.stringify([msg.join_ref, msg.ref, msg.topic, msg.event, msg.payload]));
  };

  Socket.prototype.push = function(data) {
    var self = this;
    var callback = function() {
      self.encode(data, function(result) {
        self.conn.send(result);
      });
    };
    if (this.isConnected()) {
      callback();
    } else {
      this.sendBuffer.push(callback);
    }
  };

  Socket.prototype.makeRef = function() {
    var newRef = this.ref + 1;
    this.ref = (newRef === this.ref) ? 0 : newRef;
    return this.ref.toString();
  };

  Socket.prototype.channel = function(topic, chanParams) {
    var chan = new Channel(topic, chanParams, this);
    this.channels.push(chan);
    return chan;
  };

  Socket.prototype.remove = function(channel) {
    this.channels = this.channels.filter(function(c) { return c.joinRef() !== channel.joinRef(); });
  };

  Socket.prototype.leaveOpenTopic = function(topic) {
    var dupChannel = this.channels.find(function(c) { return c.topic === topic && (c.isJoined() || c.isJoining()); });
    if (dupChannel) dupChannel.leave();
  };

  Socket.prototype.isConnected = function() {
    return this.conn && this.conn.readyState === SOCKET_STATES.open;
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {Socket: Socket, Channel: Channel};
  } else {
    window.Socket = Socket;
  }
})();
