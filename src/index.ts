import * as dotenv from 'dotenv'

import { Boom } from '@hapi/boom'
import P from 'pino'
import makeWASocket, { AnyMessageContent, delay, DisconnectReason, makeInMemoryStore, useMultiFileAuthState } from '@adiwajshing/baileys'

dotenv.config();



async function connectToWhatsApp () {
	const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
	
	// can be written out to a file & read from it
	const store = makeInMemoryStore({})
	// can be read from a file
	store.readFromFile('./baileys_store.json')
	// saves the state to a file every 10s
	setInterval(() => {
		store.writeToFile('./baileys_store.json')
	}, 10_000)
    
	const sock = makeWASocket({
		logger: P({ level: 'error' }),
		printQRInTerminal: true,
		auth: state,
	})

	// will listen from this socket
	// the store can listen from a new socket once the current socket outlives its lifetime
	store.bind(sock.ev)

	sock.ev.on('messages.upsert', async m => {        
		const msg = m.messages[0]
        console.log(JSON.stringify(m))
        
		// if(!msg.key.fromMe && m.type === 'notify') {			
		// 	await sock.sendMessage(msg.key.remoteJid, { text: 'Hello there!' })
		// }
        
	})

	sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })


    sock.ev.on ('creds.update', saveCreds);

    return sock
}

connectToWhatsApp().catch((err) => console.log(`encountered error: ${err}`))