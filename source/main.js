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
const setTrayTitle = (title)=> {
  mb.tray.setTitle(title)
}

class ReWebSocket extends EventEmitter {
  constructor(url) {
    super()
    this.url = url
    this.websocket()
    this.reserveReconnect()
    this.intervalId = null
  }

  send(...args) {
    try{
      this.websocket().send(...args)
    } catch(e) {
      console.log('error')
      return;
    }
  }

  websocket() {
    if(!this.ws) {
      try{
        this.ws = new WebSocket(this.url);
      }
      catch(e) {
        console.log('error')
        return;
      }
      this.ws.on('message', (msg)=> {
        this.cancelReconnect()
        this.reserveReconnect()

        this.emit('message', msg)
      })
      this.ws.on('open', (...args)=> {
        console.log('open')
        this.cancelReconnect()

        this.emit('open', ...args)
      })
      this.ws.on('close', (...args)=> {
        console.log('close')
        this.reserveReconnect();

        this.emit('close', ...args)
      });
      this.ws.on('error', (...args)=> {
        console.log('error')
        this.emit('error', ...args)
      });
    }
    return this.ws
  }

  closeConnection(){
    this.ws.close(1000)
    this.ws = null
  }
  cancelReconnect() {
    if(!this.intervalId) return
    console.log('cancel reconnect')
    clearTimeout(this.intervalId)
    this.intervalId = null
  }

  reserveReconnect() {
    this.cancelReconnect()
    if(this.intervalId) return
    console.log('reserv reconnect')
    this.intervalId = setTimeout(()=>{
      console.log('reconnect')
      this.closeConnection()
      this.websocket();
    }, 1000 * 10);
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
  ipcMain.on('set_title', function(event, arg) {
    setTrayTitle(arg.toString())
  });
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
