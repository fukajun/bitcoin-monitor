//
// MainProcess
'use strict';

import menubar from 'menubar';
import { app, ipcMain } from 'electron';
import notifier from 'node-notifier';
import { EventEmitter } from 'events';

const request = require('request');
const mb = menubar({ icon: __dirname + '/images/read.png' });
var WebSocket = require('ws');

const switchIconUnread = ()=> {
  mb.tray.setImage(__dirname + '/images/unread.png')
}
const switchIconRead = ()=> {
  mb.tray.setImage(__dirname + '/images/read.png')
}

class ReWebSocket extends EventEmitter {
  constructor(url) {
    super()
    this.url = url
    this.websocket()
  }
  send(...args) {
    this.websocket().send(...args)
  }
  websocket() {
    if(!this.ws) {
      this.ws = new WebSocket(this.url);
      this.ws.on('message', (msg)=> {
        this.emit('message', msg)
      })
      this.ws.on('close', (...args)=> {
        this.emit('close', ...args)
        setTimeout(()=>{this.websocket()}, 1000);
      });
      this.ws.on('open', (...args)=> {
        this.emit('open', ...args)
      })
    }
    return this.ws
  }
}

mb.on('ready', function ready () {

  let w = new ReWebSocket("wss://api2.bitfinex.com:3000/ws")
  w.on('open', ()=> {
    w.send(JSON.stringify({
        "event": "subscribe",
        "channel": "trades",
        "pair": "BTCUSD"
    }))
  })
  ipcMain.on('fetch_request', function(event, arg) {
    w.on('message', (msg)=> {
      event.sender.send('fetch_response', msg);
    });
  });

  ipcMain.on('notify', (event, title, message)=> {
    notifier.notify({
      title: title,
      icon: __dirname + '/images/notify_icon.png',
      message: message
    })
  });

  ipcMain.on('mark_unread', (event, arg)=> {
    switchIconUnread();
  });

  ipcMain.on('quit', (event, arg)=> {
    app.quit();
  });

  notifier.on('click', (event, arg)=> {
    mb.showWindow();
  });

  mb.on('show', ()=> {
    setTimeout(()=> {
      switchIconRead();
    }, 1000);
  })

  mb.on('hide', ()=> {
    switchIconRead();
  })

  mb.showWindow();
  mb.hideWindow();
  switchIconUnread();
})
