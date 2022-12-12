
const axios = require('axios')

// fungsi ambil pesan dari API data template
export async function getMessageFromTemplate(msg:string) {
    let messages:any=[];
    try {
        const options = {
            params: { 
                msg 
            },
            headers: {
                token: process.env.API_TOKEN
            }
        }

        messages = await axios.get(process.env.API_URL+'/message/template',options); 
    } catch (error) {
        console.error(error)
    }
    return messages
}

// fungsi ambil pesan dari open AI
export async function getMessageFromOpenAi(msg:string) {
    let messages:any=[];
    try {
        const options = {
            headers: {
                Authorization: "Bearer "+process.env.OPEN_API_TOKEN
            }
        }

        const body = {
            model: "text-davinci-003",
            prompt: msg,
            max_tokens: 4000,
            temperature: 0,
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0
        }

        messages = await axios.post(process.env.OPEN_API_URL+'/completions',body,options); 
    } catch (error) {
        console.error(error)
    }
    return messages
}




export async function checkMessage(sender:string, type:string, input:string, desc:string) {
    let messages:any=[];
    try {
        const options = {
            headers: {
                token: process.env.API_TOKEN
            }
        }
        

        messages = await axios.get(process.env.API_URL+'/message/check-message',
        { sender,type,input,desc},
        options); 
        console.log(messages);        
    } catch (error) {
        console.error(error)
    }
    return messages
}

// fungsi cek pesan masuk di wa
export async function checkInbox(sock:any, chat:any) {
    const m = chat.messages[0];
    const messageContent = m.message
    // if it is not a regular text or media message
    if (!messageContent) return
    
    //apabila pesan inbox berasal dari akun sendiri maka return false
    if (m.key.fromMe) {
        console.log('relayed my own message')
        return
    }

    const sender = m.key.remoteJid
    const user = m.pushName
    const messageType = Object.keys(messageContent)[0]
    
    // apabila type pesan conversation
    if (messageType === 'conversation') {
        const text = messageContent.conversation;
        let content='';
        
        // apabila ada pesan masuk isi text info
        const messageText = text.toLowerCase();
        if ( messageText === 'info'){
            content = `sender id: ${sender}, name: ${user}`
            await sock.sendMessage(sender, { text: content });
            return
        }

        // cek pesan apakah ada di template pesan
        const checkTemplate = await getMessageFromTemplate(messageText);
        
        // apabila ada maka kirim pesan jawaban sesuai template
        if (checkTemplate.data.status==='success'){
            const messageContentReply = checkTemplate.data.data.message;
            await sock.sendMessage(sender, { text: messageContentReply });
            return
        }


        // cek data dari open AI
        const checkOpenAi = await getMessageFromOpenAi(messageText);
        
        // apabila ada maka kirim pesan jawaban sesuai template
        if (checkOpenAi.status===200){
            const messageContentReply = checkOpenAi.data.choices[0].text;
            await sock.sendMessage(sender, { text: messageContentReply });
            return
        }


    }
}