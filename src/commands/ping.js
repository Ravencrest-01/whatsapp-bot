module.exports = async (sock, msg, args) => {
    await sock.sendMessage(msg.key.remoteJid, { text: 'Pong!' })
}