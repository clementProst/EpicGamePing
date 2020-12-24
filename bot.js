const Discord = require("discord.js");
const axios = require("axios");
const client = new Discord.Client();
const schedule = require('node-schedule');
const { createCanvas, loadImage } = require('canvas');
// const date = new Date(2020, 11, 31, 16, 10, 0);
var previousGame;

const j = schedule.scheduleJob('30 0 16 * * *', function(){
    ping();
});

// const end = schedule.scheduleJob(date, function(){
//     console.log("end");
//     j.cancel();
//     end.cancel();
// });

client.login(require("./config/secrets").token);

async function ping() {
    let serveurs = client.guilds.cache.array();
    for (let serv of serveurs) {
		let bot = serv.members.cache.find(m => m.id === client.user.id);
		if (bot && bot.permissions.has([2048, 16, 268435456])) {
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
			let channel = serv.channels.cache.find(c => c.type === "text" && c.name === "epic-free");
			if (channel === undefined) {
				channel = await serv.channels.create("epic-free", {
					type: 'text',
					reason: 'je veux des jeux gratuits',
				});
			}
			axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=FR&country=FR')
			.then(async function (response) {
				let jeu = null;
				for (let freegame of response.data.data.Catalog.searchStore.elements)
				if (freegame.promotions.promotionalOffers.length) { jeu = freegame; break; }
				if (!jeu || jeu.title === previousGame) return;
				previousGame = jeu.title;
				for (let element of jeu.customAttributes) {
					if (element.key === "com.epicgames.app.productSlug") {
						jeu.url = element.value;
					}
					if (element.key === "publisherName") {
						jeu.publisher = element.value;
					}
				}
				const ctx = createCanvas(1920, 1080).getContext("2d");
				const img = await loadImage(jeu.keyImages[1].url).catch(console.error);;
				ctx.drawImage(img, 0, 0);
				let pixel = ctx.getImageData(0, 1079, 1, 1).data;
				let hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
				const exampleEmbed = new Discord.MessageEmbed()
				.setColor(hex)
				.setTitle("Nouveau jeu gratuit !")
				.setDescription("Le jeu " + jeu.title + " vient de passer gratuit sur l'Epic Games Store !")
				.setURL("https://www.epicgames.com/store/fr/product/" + jeu.url )
				.setAuthor(jeu.publisher)
				.setTimestamp()
				.setImage(jeu.keyImages[1].url)
				.setFooter("@TopMage");

				if (channel && serv.systemChannel) channel.send("<@&"+role.id+">",{embed:exampleEmbed}).catch(console.error);
			}).catch(console.error);
		}
    }
}

client.on('ready', () => {
    if (previousGame === undefined) {
        axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=FR&country=FR')
            .then(async (res) => {
                let jeu = null;
                for (let freegame of res.data.data.Catalog.searchStore.elements)
                if (freegame.promotions.promotionalOffers.length) { jeu = freegame; break; }
                previousGame = jeu.title;
            }).catch(console.error);
    }
})

function componentToHex(c) {
	return c.toString(16).length == 1 ? "0" + c.toString(16) : c.toString(16);
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
