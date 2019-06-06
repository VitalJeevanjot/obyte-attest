// my pairing code: AhWtPQmjvIK0eA8wo0MgxDXkGInQT7WRDUdYk+nszt6s@obyte.org/bb#0000
const Discord = require('discord.js');
const dclient = new Discord.Client();
const config = require("./config.json");
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const obyte = require('obyte'); // obyte
const http = require('http');
const execSync = require('child_process').execSync;
// Connect to mainnet official node 'wss://obyte.org/bb'
// Connect to mainnet official node 'wss://obyte.org/bb'
const db = low(adapter)
db.defaults({ users: [], count: 0 }).write()
dclient.login(config.token).then(() => {
 console.error("Working login of discord...")
});
dclient.on('ready', () => {
 console.error('Discord ready, Bot is working perfectly---------------');
});

dclient.on('error', console.error);
dclient.on("guildCreate", guild => {
 let defaultChannel = "";
 guild.channels.forEach((channel) => {
   if(channel.type == "text" && channel.name=="discord-attestation" && defaultChannel == "") {
     if(channel.permissionsFor(guild.me).has("SEND_MESSAGES")) {
       defaultChannel = channel;
     }
   }
 })
 //defaultChannel will be the channel object that it first finds the bot has permissions for
 defaultChannel.send("Hello, I am your discord attestation bot, DM me with this command -> `!register`")
   //Your other stuff like adding to guildArray
})
dclient.on("message", (message) => {
 if (message.author.bot) return;
// Ignore other channels
 if(message.channel.type !== "dm") return;

 // Ignore messages not starting with the prefix (in config.json)
 if (message.content.indexOf(config.prefix) !== 0) return;
 const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
 const command = args.shift().toLowerCase();
 if(command === 'register')
 {
   let code = Math.floor((Math.random() * 899999999999) + 100000000000);
   while(code === db.get('users').find({pass: code}).value()) {
     code = Math.floor((Math.random() * 899999999999) + 100000000000)
   }
    if (db.get('users').find({discord_id: message.author.id}).value() === undefined) {
     db.get('users').push({pass: code.toString(), verified: false, deleted: false, discord_id: message.author.id, discord_tag: message.author.tag, device_address: '0', obyte_address: '0', attested: false, user_id: '0', unit_id: '0'}).write();
     db.update('count', n => n + 1).write()

     message.reply({embed: {
       color: 0xe8e8e8,
       title: "Welcome...",
       description: 'I would like to thank for attesting your discord with obyte address,' +
       ' Now once you done, you will not be able to re attest with same discord or obyte wallet id.'+
       '\nNow copy this pairing code'+
       ' and add the bot in obyte wallet which gets you to obyte wallet bot where you get further instructions\n'+
       '**Pairing Code:**'
     }})
     message.reply('A4TZ2o3ZiA0nIXDspyc6nUTOGLS59fRv61x4l7RDlLDG@obyte.org/bb#' + db.get('users').find({discord_id: message.author.id}).value().pass).then(() => {
           const output = execSync('refresh', { encoding: 'utf-8' });  // the default is 'buffer'
   console.log('Output was:\n', output);
     })
   } else {
     message.reply({embed: {
       color: 0xe8e8e8,
       title: "Your account is already registered, please follow below instructions...",
       description: 'I would like to thank for attesting your discord with obyte address,' +
       ' Now once you done, you will not be able to re attest with same discord or obyte wallet id.'+
       '\nNow copy this pairing code'+
       ' and add the bot in obyte wallet which gets you to obyte wallet bot where you get further instructions\n'+
       '**Pairing Code:**'
     }})
     message.reply('A4TZ2o3ZiA0nIXDspyc6nUTOGLS59fRv61x4l7RDlLDG@obyte.org/bb#' + db.get('users').find({discord_id: message.author.id}).value().pass).then(() => {
           const output = execSync('refresh', { encoding: 'utf-8' });  // the default is 'buffer'
   console.log('Output was:\n', output);
     })
   }
 }
})
