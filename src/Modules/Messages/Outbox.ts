const axios = require('axios')

// fungsi untuk mendapatkan data dari chat API
export async function getOutbox () {
    let messages=[];
    try {
        const options = {
            headers: {
                token: process.env.API_TOKEN
            }
        }

        messages = await axios.get(process.env.API_URL+'/message/outbox', options);
        
    } catch (error) {
        console.error(error);
    }

    return messages;
}

//fungsi untuk mendapatkan update status Data API menjadi sudah terkirim atau sebaliknya 
export async function updateStatus (id: number, status:number) {
    let messages=[];
    try {
        const options = {
            headers: {
                token: process.env.API_TOKEN
            }
        }
        messages = await axios.put(process.env.API_URL+'/message/status-update/'+id,{status},options);
    } catch (error) {
        console.error(error);
    }

    return messages;
}

// fungsi cek data notifikas dari chat API
export async function checkOutBox(sock:any) {
    let next:boolean = true;

    // cek data dari API 
    const messages:any = await getOutbox();  

    // apabila data ditemukan atau status success
    if (messages.data.status=='success'){
        for (let i = 0; i < messages.data.data.length; i++) {
            const el = messages.data.data[i];
            let sender = el.sender;
            
            // cek apakah tujuan adalah group wa atau chat personal
            if (el.is_group === 0 && !el.sender.includes("@g.us")) {

                // apabila bukan group cek apakah nomer telpon terdaftar di whatsapp
                const exists = await sock.onWhatsApp(el.sender)
                if (!exists) {
                    console.log (`${el.sender} not exists on WhatsApp`)
                    updateStatus(el.id,2)
                    next = false
                }else{
                    sender = el.sender+'@s.whatsapp.net'
                }
            }
            console.log({sender});
            

            // apabila chat id adalah group atau nomer telpon terdaftar whatsapp
            if (next===true){

                // apabila type pesan notifikasi adalah pesan text
                if (el.type==='text'){
                    const content =el.content 
    
                    const sent = await sock.sendMessage(sender, { text: content })
                    console.log(`text message sent succesfully sent to ${sender}`)
                    updateStatus(el.id,2)
                }

                // apabila type pesan notifikasi adalah pesan gambar
                else if (el.type==='image'){

                    const sent = await sock.sendMessage(sender, {
                        image: { url: el.media },
                        caption: el.content
                    })
                    console.log(`image message sent succesfully to ${sender}`)
                    updateStatus(el.id,2)
                }

                // apabila type pesan notifikasi adalah pesan file atau dokumen
                else if (el.type==='document'){
                    
                    const options = JSON.parse(el.options);                   
                    const sent = await sock.sendMessage(sender, {
                        document: { url: el.media },
                        fileName: options.filename,
                        mimetype: options.mimetype
                    })
                    console.log(`image message sent succesfully to ${sender}`)
                    updateStatus(el.id,2)
                }
            }
        }
    }else{
        console.log(`check outbox: no message found`);
    }
    
    

    setTimeout(() => checkOutBox(sock), 5000)
}