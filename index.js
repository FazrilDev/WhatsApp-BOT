
const split = "|"
const prefix = "$"

const moment = require("moment-timezone");
const { WAConnection, MessageType, GroupSettingChange } = require('@adiwajshing/baileys')
const qrcod = require('qrcode-terminal')
const fs = require('fs')
const { getBuffer, getGroupAdmins, getRandom } = require('./lib/functions')
const axios = require('axios')
const fetch = require('node-fetch')

const fetchJson = async (url, options) => new Promise(async (resolve, reject) => {
    fetch(url, options)
        .then(response => response.json())
        .then(json => {
            // console.log(json)
            resolve(json)
        })
        .catch((err) => {
            reject(err)
        })
})

async function start(){
    const client = new WAConnection()
    
    client.on('qr', qr => {
    	qrcod.generate(qr, {small: true})
    	console.log(`[${moment().tz("Asia/Jakarta").format("HH:mm:ss")}] Scan barcode!`)
    })
    
    client.on('credentials-updated', () =>
    {
       console.log(`credentials updated!`)
       const authInfo = client.base64EncodedAuthInfo()
       fs.writeFileSync('./session.json', JSON.stringify(authInfo, null, '\t'))
    })
    fs.existsSync('./session.json') && client.loadAuthInfo('./session.json')
    client.connect()

    client.on('chat-update', async (toll) => {
    	try{
    		if(!toll.hasNewMessage) return
    		toll = toll.messages.all()[0]
    		if(!toll.message) return
    		if (toll.key && toll.key.remoteJid == 'status@broadcast') return
    		if (toll.key.fromMe) return
    		// log const
    		const from = toll.key.remoteJid
    		const isGroup = from.endsWith('@g.us')
    		const sender = isGroup ? toll.participant : toll.key.remoteJid
            const groupMetadata = isGroup ? await client.groupMetadata(from) : ''
            const groupName = isGroup ? groupMetadata.subject : ''
            const groupMembers = isGroup ? groupMetadata.participants : ''
            // ensd
    		const { text, extendedText, contact, location, liveLocation, image, video, sticker, document, audio, product } = MessageType
            const type = Object.keys(toll.message)[0]
    	    body = (type === 'conversation' && toll.message.conversation.startsWith(prefix)) ? toll.message.conversation : (type == 'imageMessage') && toll.message.imageMessage.caption.startsWith(prefix) ? toll.message.imageMessage.caption : (type == 'videoMessage') && toll.message.videoMessage.caption.startsWith(prefix) ? toll.message.videoMessage.caption : (type == 'extendedTextMessage') && toll.message.extendedTextMessage.text.startsWith(prefix) ? toll.message.extendedTextMessage.text : ''
    	    const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
    	    const args = body.trim().split(/ +/).slice(1)
    		const isCmd = body.startsWith(prefix)
    		const reply = (teks) => {
    			client.sendMessage(from, teks, text, {quoted:toll})
    		}
    		const replyImage = (buff) => {
    			client.sendMessage(from, buff, image, {quoted:toll})
    		}
    		const mentions = (teks, memberr, id) => {
				(id == null || id == undefined || id == false) ? client.sendMessage(from, teks.trim(), extendedText, {contextInfo: {"mentionedJid": memberr}}) : client.sendMessage(from, teks.trim(), extendedText, {quoted: toll, contextInfo: {"mentionedJid": memberr}})
			}
			const content = JSON.stringify(toll.message)
			const isMedia = (type === 'imageMessage' || type === 'videoMessage')
			const isQuotedImage = type === 'extendedTextMessage' && content.includes('imageMessage')
			const groupAdmins = isGroup ? getGroupAdmins(groupMembers) : ''
			const isGroupAdmins = groupAdmins.includes(sender) || false
            const plit = body.slice(7).split(split)
            // log
            if(!isGroup && isCmd) console.log(`» ${command} from ${sender.split('@')[0]}`)
            if(isGroup && isCmd) console.log(`» ${command} from ${sender.split('@')[0]} in ${groupName}`)
            // end
    		switch(command){
    			case 'Halo':
    				client.sendMessage(from, 'hello', text, {quoted: toll})
    				reply("hello")
    				buff = await getBuffer(`https://images.app.goo.gl/LiccBukrmFYm52eq6`)
    				client.sendMessage(from, buff, image, {quoted: toll, caption: `Hello`})
    			break
    		}
    	} catch (e) {
    		console.log(`Error: ${e}`)
    	}
    })
}

start()