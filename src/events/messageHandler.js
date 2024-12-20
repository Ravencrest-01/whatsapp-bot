const commands = require('../commands')

module.exports = async (sock, msg) => {
    // Extract text from message
    // WhatsApp messages can have the text in different places:
    // - msg.message.conversation (normal text messages)
    // - msg.message.extendedTextMessage?.text (replies/forwarded messages)
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''

    //Prefix for commands
    const prefix = '!'

    // Check if the message start with the prefix
    if(!text.startsWith(prefix)) {
        // not a command, so we can just return
        return
    }

    // Remove the prefix and split the text into command and arguments
    const args = text.slice(prefix.lenght).trim().split(/\s+/)
    const commandName = args.shift().toLowerCase()

    // check if we have a command with this name
    const command = commands[commandName]

    if(!command){
        // if no command is found with this name, send an error message back.
        await sock.sendMessage(msg.key.remoteJid, {text: "Unknown Command."})
        return
    }

    // Execute the command function which typically has the signature: (sock, msg, args) => {...}
    try{
        await command(sock, msg, args)
    } catch (err){
        console.error('Error executing command:', err)
        await sock.sendMessage(msg.key.remoteJid, { text: "There was an error executing that command"})
    }
}