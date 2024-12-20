const { 
    default: makeWASocket, 
    useSingleFileAuthState, 
    makeInMemoryStore 
  } = require('@adiwajshing/baileys')
  const { state, saveState } = useSingleFileAuthState('./auth_info.json')
  const messageHandler = require('../events/messageHandler')
  const { loadProfiles, saveProfiles } = require('./storage')
  const pino = require('pino')
  
  // Create an in-memory store to keep track of contacts, chats, etc.
  const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
  
  async function startBot() {
    // Create the WhatsApp connection/socket
    const sock = makeWASocket({ 
      auth: state,
      // You can print QR in terminal to scan the first time.
      printQRInTerminal: true
    })
  
    // Bind the store to the socket, so it updates automatically
    store.bind(sock.ev)
  
    // Handle credential updates (for re-login without QR code next time)
    sock.ev.on('creds.update', saveState)
  
    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
      if (!messages || !messages[0]) return
      const msg = messages[0]
      await messageHandler(sock, msg)
    })
  
    // Now, fetch group participants to auto-log them:
    const groupId = '120363272799739119@g.us' // e.g. '1234567890-123456@g.us'
    const groupMeta = await sock.groupMetadata(groupId)
  
    // groupMeta.participants is an array of { id: string, admin?: string }
    // We want to store their display names if available.
    // We'll rely on `store.contacts` to find names.
    
    let profiles = loadProfiles()
  
    for (const participant of groupMeta.participants) {
      const existingUser = profiles.find(u => u.id === participant.id)
  
      // Attempt to find a display name from contacts
      // store.contacts is a dictionary keyed by user JID
      // Each contact may have { name, notify } fields.
      const contact = store.contacts[participant.id]
  
      let displayName = null
      if (contact) {
        // 'notify' is often the pushName set by the user, more likely to be their display name
        // 'name' can also be present, depending on how Baileys fetches the contact
        displayName = contact.notify || contact.name || null
      }
  
      // If user is new, add them with a name (if found)
      if (!existingUser) {
        profiles.push({
          id: participant.id,
          name: displayName,
          roles: []
        })
      } else {
        // If user already exists but we previously had no name, we can update their name now
        if (!existingUser.name && displayName) {
          existingUser.name = displayName
        }
      }
    }
  
    // Save updated profiles
    saveProfiles(profiles)
    console.log('All group participants have been logged with display names (if available) to profiles.json!')
  
    return sock
  }
  
  module.exports = startBot  