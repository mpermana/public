import './app.scss'
import {
  Up, Down, Left, Right, Home, Confirm, Back,
  Hdmi1, Hdmi3,
  Pause,
  Play
} from './ircc'
import React, { useEffect, useState } from 'react'

const sharedKey = localStorage.getItem('sharedKey')

const headers = {
  'Content-Type': 'application/json',
  'X-Auth-PSK': sharedKey
}

// look for mac 04:5D:4B:E6:95:1D
const hostname = '192.168.0.31'

export const setActiveApp = (uri = 'localapp://webappruntime?url=http%3A%2F%2Fexample.com%2F') => ({
  "method": "setActiveApp",
  "id": 601,
  "params": [{
    uri
  }],
  "version": "1.0"
})

export const getApplicationList = {
  "method": "getApplicationList",
  "id": 60,
  "params": [],
  "version": "1.0"
}


const setPowerStatus = (status) => ({
  "method": "setPowerStatus",
  "id": 55,
  "params": [{ status }],
  "version": "1.0"
})

const getVolumeInformation = {
  "method": "getVolumeInformation",
  "id": 33,
  "params": [],
  "version": "1.0"
}

const setAudioVolume = (volume = 10) => ({
  "method": "setAudioVolume",
  "id": 98,
  "params": [{
    volume,
    "ui": "on",
    "target": "speaker"
  }],
  "version": "1.2"
})



const getPowerStatus = { "method": "getPowerStatus", "params": [], "id": 50, "version": "1.0" }

const post = (path, request) => {
  return fetch(`http://${hostname}/sony/${path}`,
    {
      'method': 'POST',
      'body': JSON.stringify(request),
      'headers': headers
    }
  ).then(response => response.json().then(data => data.result && data.result[0]))
}


const setVolume = (targetVolume) => {
}

const postIRCC = (IRCCCode) => {
  const headers = {
    'Content-Type': 'text/xml; charset=UTF-8',
    'X-Auth-PSK': sharedKey,
    'SOAPACTION': '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"'
  }
  const body = `
    <s:Envelope
      xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"
      s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
      <s:Body>
          <u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">
              <IRCCCode>${IRCCCode}</IRCCCode>
          </u:X_SendIRCC>
      </s:Body>
    </s:Envelope>  
  `
  return fetch(`http://${hostname}/sony/ircc`,
    {
      'method': 'POST',
      body,
      headers
    }
  ).then(response => response.body)
}

const launchApp = (uri) => {
  return () => {
    post('appControl', setActiveApp(uri))
  }
}

function App() {
  const [powerStatus, setStatePowerStatus] = useState()
  const [applicationList, setStateApplicationList] = useState([])

  useEffect(() => {
    post('appControl', getApplicationList).then(applicationList => {
      setStateApplicationList(applicationList || [])
    })
  }, [powerStatus]);
  const favorites = [
    'Crunchyroll',
    'Netflix',
    'Prime Video',
    'VLC',
    'YouTube'
  ]
  const favoriteApplicationList = applicationList.filter(
    application => favorites.indexOf(application.title) != -1
  )
  return (
    <div className="container">
      <div>{hostname}</div>
      <center>
        <div className="App">
          <button className="remote" style={{ 'background': 'green' }} onClick={() => post('system', setPowerStatus(true))}>On</button>
          <button className="remote" style={{ 'background': 'red' }} onClick={() => post('system', setPowerStatus(false))}>Off</button>
          <button className="remote" style={{ 'background': 'purple' }} onClick={() => postIRCC(Hdmi3)}>PS4</button>
          <button className="remote" style={{ 'background': 'purple' }} onClick={() => postIRCC(Hdmi1)}>Comcast</button>
        </div>
        <div>
          {favoriteApplicationList.map(({ icon, title, uri }) => (
            <div onClick={launchApp(uri)} style={{ 'display': 'inline-block', 'cursor': 'pointer' }}>
              <img src={icon} width="100" alt={title} loading="lazy" />
            </div>
          ))}
        </div>
        <div>
          <button className="remote" onClick={() => post('audio', setAudioVolume("-1"))}>-</button>
          <button className="remote" onClick={() => post('audio', setAudioVolume("+1"))}>+</button><br></br>
        </div>

        <div>
          <button className="remote" onClick={() => postIRCC(Home)}>Home</button>
          <button className="remote" onClick={() => postIRCC(Back)}>Escape</button>
          <button className="remote" onClick={() => postIRCC(Confirm)}>Enter</button>

        </div>
        <div>
          <button className="remote" onClick={() => postIRCC(Up)}>↑</button>
        </div>
        <div>
          <button className="remote" onClick={() => postIRCC(Left)}>←</button>
          <button className="remote" onClick={() => postIRCC(Confirm)}>Confirm</button>
          <button className="remote" onClick={() => postIRCC(Right)}>→</button>
        </div>
        <div>
          <button className="remote" onClick={() => postIRCC(Down)}>↓</button>
        </div>
        <div>
          <button className="remote" onClick={() => postIRCC(Play)}>|></button>
          <button className="remote" onClick={() => postIRCC(Pause)}>||</button>
        </div>
      </center>
      <div>
        <button onClick={() => post('system', getPowerStatus).then(
          powerStatus => {
            setStatePowerStatus(powerStatus)
          }
        )}>Status</button>
        <div>
          {JSON.stringify(powerStatus)}
        </div>
      </div>
      <div><input onChange={event => {
        localStorage.setItem('sharedKey', event.target.value)
        headers["X-Auth-PSK"] = localStorage.getItem('sharedKey')
      }}></input></div>
    </div>
  );
}

export default App;
