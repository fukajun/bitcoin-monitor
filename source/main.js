//
// MainProcess
'use strict';

import menubar from 'menubar';
import { app, ipcMain } from 'electron';
import notifier from 'node-notifier';

const request = require('request');
const mb = menubar({ icon: __dirname + '/images/read.png' });

const switchIconUnread = ()=> {
  mb.tray.setImage(__dirname + '/images/unread.png')
}
const switchIconRead = ()=> {
  mb.tray.setImage(__dirname + '/images/read.png')
}
mb.on('ready', function ready () {

  //using the ws library
  var WebSocket = require('ws');
  var w = new WebSocket("wss://api2.bitfinex.com:3000/ws");
  w.on('open', ()=> {
    w.send(JSON.stringify({
        "event": "subscribe",
        "channel": "trades",
        "pair": "BTCUSD"
    }))
    //w.send(JSON.stringify({
         //"event":"subscribe",
         //"channel":"book",
         //"pair":"BTCUSD",
         //"prec":"P0" // R0 = raw
    //}))
    //w.send(JSON.stringify({
        //"event": "subscribe",
        //"channel": "ticker",
        //"pair": "BTCUSD"
    //}))
  })
  ipcMain.on('fetch_request', function(event, arg) {
    w.onmessage = function(msg) {
      event.sender.send('fetch_response', msg);
    };
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
