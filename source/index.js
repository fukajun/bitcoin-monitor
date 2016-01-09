//
// Renderer

import React from 'react';
import ReactDom from 'react-dom';
import { ipcRenderer } from 'electron';
import moment from 'moment';

const FETCH_INTERVAL = 10000

class MessageList extends React.Component {
  render() {
    let list = this.props.list.map((msg)=> {
      let created_at = moment(new Date(msg[2] * 1000)).format('MM/DD HH:mm:ss');
      return (
        <li className='msg_list-item' key={msg[1]}>
          <div className='msg_list-item_title'>
            <div className='msg_list-item-user'> {msg[3]} : {msg[4]} </div>
            <div className='msg_list-item-time'>{created_at}</div>
          </div>
        </li>
      );
    });

    return (
      <ol className='msg_list'>
        {list}
      </ol>
    )
  }
}

class Header extends React.Component {
  render() {
    return (
      <div className='app_bar'>
        <h1 className='app_bar-title'> coincheck chat </h1>
        <a className='app_bar-quit_button' onClick={this.props.onClickQuit}><i className="flaticon-powerbuttons"></i></a>
        <span className='app_bar-time'>{this.props.updated}</span>
      </div>
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      body: [],
      updatedAt: ''
    };

    let recentlyId = 0
    ipcRenderer.on('fetch_response', (event, arg)=> {
      let data = JSON.parse(arg);
      if(data.length != 5) {
        return;
      }
      let list = this.state.body.slice()
      list.unshift(data)
      if(list.length > 50) {
        list.length = 50
      }
      ipcRenderer.send('set_title', data[3])
      this.setState({body: list})
      this.notify(data[3], data[4]);
      ipcRenderer.send('mark_unread');
    });

    ipcRenderer.send('fetch_request');
  }

  quit() {
    ipcRenderer.send('quit');
  }

  notify(title, message) {
    ipcRenderer.send('notify', title, message);
  }

  render() {
    return (
      <div>
        <Header updated={this.state.updatedAt} onClickQuit={this.quit} />
        <MessageList list={this.state.body}/>
      </div>
    )
  }
}

document.addEventListener("DOMContentLoaded", ()=> {
  ReactDom.render(<App />, document.getElementById('app'))
})
