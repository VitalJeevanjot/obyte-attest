 // my pairing code: AhWtPQmjvIK0eA8wo0MgxDXkGInQT7WRDUdYk+nszt6s@obyte.org/bb#0000
// const async = require('async');
const conf = require('ocore/conf');
// const db = require('byteballcore/db.js');
const eventBus = require('ocore/event_bus.js');
const headlessWallet = require('headless-obyte');
const objectHash = require('ocore/object_hash.js');
const Discord = require('discord.js');
const dclient = new Discord.Client();
const config = require("./config.json");
const wallet = require('ocore/wallet.js');
const device = require('ocore/device.js');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const obyte = require('obyte'); // obyte
const http = require('http');
// Connect to mainnet official node 'wss://obyte.org/bb'
const client = new obyte.Client();
const db = low(adapter)
db.defaults({ users: [], count: 0 }).write()
dclient.login(config.token);
setInterval(() => {
  http.get(`http://obyte-attest.glitch.me`);
}, 250000);
dclient.on('ready', () => {
  console.error('Discord ready');
});

dclient.on('error', console.error);

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
        '\nNow copy this below link (with secret code) and open it in a new tab, **or** copy the pairing code'+
        ' and add the bot in obyte wallet which gets you to obyte wallet bot where you get further instructions\n',
        fields: [{
          name: "Link to open in new tab:",
          value: "obyte:AnkTC1WDP8GwbrijNIfr/XmFZ/Mli5E0loFp/pAnhwMI@obyte.org/bb#" + code
        },
        {
          name: "Pairing Code:",
          value: "AnkTC1WDP8GwbrijNIfr/XmFZ/Mli5E0loFp/pAnhwMI@obyte.org/bb#" + code
        }]
      }})
    } else {
      message.reply({embed: {
        color: 0xe8e8e8,
        title: "Your account is already registered, please follow below instructions...",
        description: 'I would like to thank for attesting your discord with obyte address,' +
        ' Now once you done, you will not be able to re attest with same discord or obyte wallet id.'+
        '\nNow copy this below link (with secret code) and open it in a new tab, **or** copy the pairing code'+
        ' and add the bot in obyte wallet which gets you to obyte wallet bot where you get further instructions\n',
        fields: [{
          name: "Link to open in new tab:",
          value: "obyte:AnkTC1WDP8GwbrijNIfr/XmFZ/Mli5E0loFp/pAnhwMI@obyte.org/bb#" + db.get('users').find({discord_id: message.author.id}).value().pass
        },
        {
          name: "Pairing Code:",
          value: "AnkTC1WDP8GwbrijNIfr/XmFZ/Mli5E0loFp/pAnhwMI@obyte.org/bb#" + db.get('users').find({discord_id: message.author.id}).value().pass
        }]
      }})
    }
  }
})
//This event handles incoming messages.
eventBus.on('text', function(from_address, text) {
  // handle signed message
  if(db.get('users').find({ device_address: from_address }).value() === undefined) {
    device.sendMessageToDevice(from_address, 'text', 'You cannot attest with this pairing secret.');
    return;
  }
  let message = text.trim().split(/ +/g);
  if(message[0] === "add") {
    console.error("ok here");
    if(db.get('users').find({ obyte_address: message[1] }).value())
    {
      console.error("now ok here");
      if(db.get('users').find({ obyte_address: message[1] }).value().attested === true) {
        console.error("now ok here....");
        device.sendMessageToDevice(from_address, 'text', 'Your account is already attested, Thank you.');
        return;
      }
    }
    console.error('Ok now here');
    client.api.getDefinition(message[1], function(err, result) {
      console.error("nn ok here");
      if(err) {
        device.sendMessageToDevice(err)
        device.sendMessageToDevice(from_address, 'text', 'The address you gave did not seems to be correct obyte address, Please try again.');
      } else {
        console.error(result);
        let codr = '0'; // to store it's pin from same device but different wallet
        db.get('users').value().forEach((item) => {
          if(item.device_address === from_address) {
            if(item.obyte_address === '0') {
              codr = item.pass
            }
          }
        })
        let addr = db.get('users').find({ pass: codr }).assign({ obyte_address: message[1] }).write()
        // console.error(passw.pass);
        let sign_message = "Your address is " + addr.obyte_address.toString();
        device.sendMessageToDevice(from_address, 'text', 'We got the address, Now please sign this message: [click me](sign-message-request:'+ sign_message +')');
    }});
    return;
  }
    let arrSignedMessageMatches = text.match(/\(signed-message:(.+?)\)/);
    if (arrSignedMessageMatches){
    	let signedMessageBase64 = arrSignedMessageMatches[1];
    	var validation = require('ocore/validation.js');
    	var signedMessageJson = Buffer(signedMessageBase64, 'base64').toString('utf8');
    	try{
    		var objSignedMessage = JSON.parse(signedMessageJson);
    	}
    	catch(e){
    		return null;
    	}
    	validation.validateSignedMessage(objSignedMessage, err => {
        let signing_addr = objSignedMessage.signed_message.split(/ +/g)[3];
        console.error(signing_addr);
        let addr = db.get('users').find({ obyte_address: signing_addr }).value()
        // console.error(passw.pass);
        let challenge = "Your address is " + addr.obyte_address.toString();
        let user_address = addr.obyte_address.toString();
    		if (err)
    			return device.sendMessageToDevice(from_address, 'text', err);
    		if (objSignedMessage.signed_message !== challenge)
    			return device.sendMessageToDevice(from_address, 'text',
    				"You signed a wrong message: "+objSignedMessage.signed_message+", expected: "+challenge);
    		if (objSignedMessage.authors[0].address !== user_address)
    			return device.sendMessageToDevice(from_address, 'text',
    				"You signed the message with a wrong address: "+objSignedMessage.authors[0].address+", expected: "+user_address);

    		// all is good, address proven, continue processing
        console.error(objSignedMessage.authors[0].address);
        let user_to_attest = db.get('users').find({ obyte_address: objSignedMessage.authors[0].address }).value()
        let shortProfile = {
          discord_id: user_to_attest.discord_id,
          passcode: user_to_attest.pass
        }
        let userId = objectHash.getBase64Hash([shortProfile])
        db.get('users').find({ obyte_address: objSignedMessage.authors[0].address }).assign({ obyte_address: objSignedMessage.authors[0].address, verified: true, user_id: userId }).write()
        let params = {
          address: user_to_attest.obyte_address,
          profile: {
            user_id: userId,
            discord_id: user_to_attest.discord_id,
            discord_name: user_to_attest.discord_tag
          }
        }

      client.post.attestation(params, config.wif, function(err, result) {
        if(err) {
          device.sendMessageToDevice(from_address, 'text', err)
        } else {
          device.sendMessageToDevice(from_address, 'text', result)
          db.get('users').find({ obyte_address: objSignedMessage.authors[0].address }).assign({ attested: true, unit_id: result }).write()
          device.sendMessageToDevice(from_address, 'text', 'Your account has been successfully attested, thank you.')
        }
        // -> J12wi3v0tSco6JJKagqJ265/jEt8Evl4Rk03YIErlpQ=
      });
    	});
    return;
    }
   else {
    device.sendMessageToDevice(from_address, 'text', 'Your command is not correct, Please try with `add <obyte_address>`');
  }
});
eventBus.on('paired', function(from_address, pairing_secret){
	var device = require('ocore/device.js');
  // console.error(from_address);
  let check_val = db.get('users').find({ pass: pairing_secret }).value()
  if(check_val !== undefined && check_val.attested !== true) {
    db.get('users').find({ pass: pairing_secret }).assign({ device_address: from_address }).write()
    device.sendMessageToDevice(from_address, 'text', 'Great upto here, Now please give your address that you want to attest with this format \n add <your_obyte_address>\n without using any special symbol for e.g. -> add ADCDDSDC21344xxx');
  } else {
    device.sendMessageToDevice(from_address, 'text', 'The pairing secret is not looking correct or already used, please try again with new one from discord dm channel by sending `!register`.');
  }
});
