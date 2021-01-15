const Discord = require("discord.js");
const axios = require("axios");
const bot = new Discord.Client();
const schedule = require('node-schedule');
const { createCanvas, loadImage } = require('canvas');
const secrets = require('./config/secrets');
const fs = require('fs');
var previousGame;

const j = schedule.scheduleJob('30 0 16 * * *', function(){
    ping(false, null);
});

bot.login(secrets.token);

async function ping(override, servid) {
	let response = await axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=FR&country=FR').catch(console.error);
	let jeu;
	for (let freegame of response.data.data.Catalog.searchStore.elements)
		if (freegame.promotions.promotionalOffers && freegame.promotions.promotionalOffers.length) { jeu = freegame; break; }
	if ((!jeu || jeu.title === previousGame) && !override) return;
	previousGame = jeu.title;
	for (let element of jeu.customAttributes) {
		if (element.key === "com.epicgames.app.productSlug")
			jeu.url = element.value;
		if (element.key === "publisherName")
			jeu.publisher = element.value;
	}
	// Couleur du embed
	const ctx = createCanvas(1920, 1080).getContext("2d");
	const img = await loadImage(jeu.keyImages[1].url).catch(console.error);;
	ctx.drawImage(img, 0, 0);
	let pixel = ctx.getImageData(0, 1079, 1, 1).data;
	let hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
	const embed = new Discord.MessageEmbed()
		.setColor(hex)
		.setTitle("Nouveau jeu gratuit !")
		.setDescription("Le jeu " + jeu.title + " vient de passer gratuit sur l'Epic Games Store !")
		.setURL("https://www.epicgames.com/store/fr/product/" + jeu.url )
		.setAuthor(jeu.publisher)
		.setTimestamp()
		.setImage(jeu.keyImages[1].url)
		.setFooter("@TopMage");
    let serveurs = bot.guilds.cache.array();
    for (let serv of serveurs) {
		let member = serv.members.cache.find(m => m.id === bot.user.id);
		if (member && member.permissions.has([2048, 16, 268435456])) {
			// Role
			let role = serv.roles.cache.find(r => r.name === "Juifs");
			if (role === undefined) {
				role = await serv.roles.create({
					data: {
						name: 'Juifs',
						color: 'YELLOW',
						mentionable: true
					},
					reason: 'je veux des jeux gratuits',
				});
			}
			fs.readFile('data/channels.json', 'utf8', (err, data) => {
				if (err) throw err;
				let json = JSON.parse(data);
				if (json === {}) return;
				let channel = serv.systemChannel;
				if (json[serv.id]) channel = serv.channels.cache.get(json[serv.id]);
				if (!override || (override && serv.id === servid))
					channel.send("<@&"+role.id+">", embed).catch(console.error);
			});
		}
    }
}

bot.on('ready', () => {
    if (previousGame === undefined) {
        axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=FR&country=FR')
            .then(async (res) => {
                let jeu = null;
                for (let freegame of res.data.data.Catalog.searchStore.elements)
                if (freegame.promotions.promotionalOffers.length) { jeu = freegame; break; }
                previousGame = jeu.title;
				console.log("Previous game : " + previousGame);
            }).catch(console.error);
    }
})

bot.on('message', msg => {
	if (!msg.guild || !msg.content.startsWith(secrets.prefix)) return;

	let rawCommand = msg.content;
    let fullCommand = rawCommand.substr(secrets.prefix.length);
    let splitCommand = fullCommand.split(' ');
    splitCommand = splitCommand.filter(function(e){return e});
    let primaryCommand = splitCommand[0];

    if (!msg.member.permissions.has(8) && msg.author.id !== secrets.owner) { msg.reply("seul un administrateur peut utiliser cette commande.").catch(console.error); return; }

	switch (primaryCommand) {
		case "channel":
			let channel = msg.mentions.channels.first();
			if (!channel || (channel && channel.type !== "text")) { msg.reply("le salon est invalide.").catch(console.error); return; }
			fs.readFile('data/channels.json', 'utf8', (err, data) => {
		        if (err) throw err;
		        if (data === "") data = "{}";
		        let json = JSON.parse(data);
		        json[msg.guild.id] = channel.id;
		        fs.writeFile('data/channels.json', JSON.stringify(json), (err) => {
		            if (err) throw err;
		            msg.reply("les annonces se feront désormais dans le salon <#" + channel.id + "> !").catch(console.error);
		        });
		    });
			break;
		case "ping":
			ping(true, msg.guild.id);
			break;
	}
})

function componentToHex(c) {
	return c.toString(16).length == 1 ? "0" + c.toString(16) : c.toString(16);
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
