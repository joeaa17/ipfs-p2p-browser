import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { webRTCStar } from '@libp2p/webrtc-star'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { bootstrap } from '@libp2p/bootstrap'

document.addEventListener('DOMContentLoaded', async () => {
  
  let peerC = []
  let dialC = []
  let connectedC = []
  let disconnectedC = []
  
  const wrtcStar = webRTCStar()

  // Create our libp2p node
  const libp2p = await createLibp2p({
    addresses: {
      // Add the signaling server address, along with our PeerId to our multiaddrs list
      // libp2p will automatically attempt to dial to the signaling server so that it can
      // receive inbound connections from other peers
      listen: [
        '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
        '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
      ]
    },
    transports: [
      webSockets(),
      wrtcStar.transport
    ],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    peerDiscovery: [
      wrtcStar.discovery,
      bootstrap({
        list: [
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
        ]
      })
    ]
  })

  // UI elements
  const status = document.getElementById('status')
  const output = document.getElementById('output')

  output.innerHTML = ''

  function log (txt, clas = 'log') {
    console.info(txt)
    output.innerHTML = `<p class='${clas}'> ${txt}</br> </p>` + output.innerHTML
  }

  // Listen for new peers
  libp2p.addEventListener('peer:discovery', (evt) => {
    const peer = evt.detail
    log(`Found peer ${peer.id.toString()}`, 'peer')

    peerC.push(peer)
    document.getElementById('peers').innerText = `${peerC.length}`

    // dial them when we discover them
    libp2p.dial(evt.detail.id).catch(err => {
      log(`Could not dial ${evt.detail.id} :` + err, 'dial')

      dialC.push(err)
      document.getElementById('dial').innerText = `${dialC.length}`

    })
  })

  // Listen for new connections to peers
  libp2p.connectionManager.addEventListener('peer:connect', (evt) => {
    const connection = evt.detail
    log(`Connected to ${connection.remotePeer.toString()}`, 'connected')
    document.getElementById('connected').innerText = `${connectedC.length}`

    connectedC.push(connection)
  })

  // Listen for peers disconnecting
  libp2p.connectionManager.addEventListener('peer:disconnect', (evt) => {
    const connection = evt.detail
    log(`Disconnected from ${connection.remotePeer.toString()}`, 'disconnected')
    disconnectedC.push(connection)
    document.getElementById('disconnected').innerText = `${disconnectedC.length}`
  })

  status.innerText = 'libp2p started!'
  document.getElementById('user-id').innerText = `${libp2p.peerId.toString()}`
  // log(`libp2p id is ${libp2p.peerId.toString()}`)

  // Export libp2p to the window so you can play with the API
  window.libp2p = libp2p

  let count = 0
  let segment = [];
  let myChart = null
  let myChartLine = null
  let myChartTime = null
  let peerPrevious = 0
  let peerPreviousArray = []
  let dialPrevious = 0
  let dialPreviousArray = []
  let connectedPrevious = 0
  let connectedPreviousArray = []
  let disconnectedPrevious = 0
  let disconnectedPreviousArray = []
      
  function loopGraph () {
    setTimeout(() => {
      const peerC = document.getElementById('peers').innerText
      const dialC = document.getElementById('dial').innerText
      const connectedC = document.getElementById('connected').innerText
      const disconnectedC = document.getElementById('disconnected').innerText

      const data = {
        labels: ['Peers', 'Dial', 'Connected', 'Disconnected'],
        datasets: [{
          label: 'Libp2p',
          data: [peerC, dialC, connectedC, disconnectedC],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],

          borderWidth: 1
        }]
      }

      const config = {
        type: 'bar',
        data,
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }

      if (myChart) {
        myChart.config = config
        myChart.update()
      }
      else {
        myChart = new Chart(
          document.getElementById('chartBar'),
          config
        )
      }

      // chartLine
      const dataLine = {
        labels: ['Peers', 'Dial', 'Connected', 'Disconnected'],
        datasets: [{
          label: 'Libp2p',
          data: [peerC - peerPrevious, dialC - dialPrevious, connectedC - connectedPrevious, disconnectedC - disconnectedPrevious],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],

          borderWidth: 1
        }]

      }

      const configLine = {
        type: 'line',
        data: dataLine,
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }

      if (myChartLine) {
        myChartLine.config = configLine
        myChartLine.update()
      }
      else {
        myChartLine = new Chart(
          document.getElementById('chartLine'),
          configLine
        )
      }

      peerPrevious = peerC
      dialPrevious = dialC
      connectedPrevious = connectedC
      disconnectedPrevious = disconnectedC

      peerPreviousArray.push(peerC)
      dialPreviousArray.push(dialC)
      connectedPreviousArray.push(connectedC)
      disconnectedPreviousArray.push(disconnectedC)

      // chartTime
      const dataTime = {
        labels: segment,
        datasets: [{
          label: 'peers',
          data: peerPreviousArray,
          backgroundColor: [
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.2)'

          ],
          borderColor: [
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.2)'
          ],

          borderWidth: 1
        },
        {
          label: 'dial',
          data: dialPreviousArray,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],

          borderWidth: 1
        },
        {
          label: 'connected',
          data: connectedPreviousArray,
          backgroundColor: [
            'rgba(75, 192, 192, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(75, 192, 192, 0.2)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(75, 192, 192, 1)'
          ],

          borderWidth: 1
        },
        {
          label: 'disconnected',
          data: disconnectedPreviousArray,
          backgroundColor: [
            'rgba(54, 162, 235, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(54, 162, 235, 0.2)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(54, 162, 235, 0.2)'
          ],

          borderWidth: 1
        }]
      }

      const configTime = {
        type: 'line',
        data: dataTime,
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }

      if (myChartTime) {
        myChartTime.config = configTime
        myChartTime.update()
      }
      else {
        myChartTime = new Chart(
          document.getElementById('chartTime'),
          configTime
        )
      }

      segment.push(++count)

      loopGraph()
    }, 4000)
  }
    loopGraph()

})