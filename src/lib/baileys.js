// Have to implement logic on line 51 to display the names for user

const { default: makeWASocket, useSingleFileAuthState } = require('@adiwajshing/baileys')
const { state, saveState } = useSingleFileAuthState('./auth_info.json')
const messageHandler = require('../events/messageHandler')
const { loadProfiles, saveProfiles } = require('./storage')


async function startBot() {
    const sock = makeWASocket({ auth:state })

    // Saving updated credentials whenever they are updated
    sock.ev.on('creds.update', saveState)

    // Listen to the new incomming messages or updates in the messages.
    // 'message.upsert' is triggered when there are new messages or edited messages.
    sock.ev.on('message.upsert', async({messages}) => {
        // check for the messages
        if(!messages || !messages[0]) return
        const msg = messages[0]

        // Pass the message and socket to the central 'messageHandler' it'll, parse the message, check if its a command or not, excecute the command
        await messageHandler(sock, msg)
    })

    // For fetching the participants and their numbers for the particular group
    const groupId = '120363272799739119@g.us'

    // fetch metadata about group. (its name, participants etc.)
    const groupMeta = await sock.groupMetadata(groupId)

    // groupMeta.participants is an array of objects. Each participant has at least an 'id' their phone number in whatsapp JID form.
    // we map over each participant to create a simplified structure for storing in profiles
    const participants = groupMeta.participants.map(p => {
        return {
            id: p.id,
            // we start with the empty role. we can add roles later via commands
            roles: []
        }
    })

    // Load the current profiles from the storage (profiles.json)
    let profiles = loadProfiles()

    // For each participant in the group: Check if they are already in profiles. If not, add them with empty roles. This will help in not overwriting the existing user.
    participants.forEach(newUser => {
        const existingUser = profiles.find(u => u.id === newUser.id)
        if(!existingUser){
            profiles.push({
                id: newUser.id,
                name: null, //Implementing Logic to display the name will have to do soon
                roles: [] //start with no roles for existing user
            })
        }
        // if user aleardy exists in profiles, do nothing and preserving the data.
    })

    // save the updated profiles back to the profiles.json file.
    saveProfiles(profiles)
    console.log("All the group members have been logged to profiles.json!")

    // return the socket connection
    return sock
}

module.exports = startBot