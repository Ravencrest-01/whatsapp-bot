// index.js is basically used to load the .env variables and start the bot and if there are any errors in starting the bot this shows the error.
// This loads the configurations from the .env file I have
require('dotenv').config()

// Importing the function that'll start the bot bailey from the "lib" directory
const startBot = require('./lib/baileys')

// Starting the bot and checking if the promise is fullfilled or not to catch the errors that can happen during the start of the bot
startBot()
    .then(() => {
        console.log("The bot has started successfully")
    })
    .catch(err => {
        console.log("Failed to start the bot", err)
    })
