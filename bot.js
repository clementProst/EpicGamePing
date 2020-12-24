const Discord = require("discord.js");
const axios = require("axios");
const client = new Discord.Client();
const schedule = require('node-schedule');

// var date = new Date(2020, 11, 31, 16, 30, 0);

const j = schedule.scheduleJob('30 0 17 * * *', function(){
  ping();
});

// const end = schedule.scheduleJob(date, function(){
// 	console.log("end");
//   j.cancel();
//   end.cancel();
// });

client.login(require("./config/secrets").token);

async function ping() {
  let serveurs = client.guilds.cache.array();
  for (let serv of serveurs) {
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
    axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=FR&country=FR')
      .then(function (response) {
        let jeu = response.data.data.Catalog.searchStore.elements[0].title === "Mystery Game" ? response.data.data.Catalog.searchStore.elements[1] : response.data.data.Catalog.searchStore.elements[0];
        for (let element of jeu.customAttributes) {
          if (element.key === "com.epicgames.app.productSlug") {
            jeu.url = element.value;
          }
          if (element.key === "publisherName") {
            jeu.publisher = element.value;
          }
        }
        const exampleEmbed = new Discord.MessageEmbed()
        .setColor('#1E8FD0')
        .setTitle("Nouveau jeu gratuit !")
        .setDescription("Le jeu " + jeu.title + " vient de passer gratuit sur l'Epic Games Store !")
        .setURL("https://www.epicgames.com/store/fr/product/" + jeu.url )
        .setAuthor(jeu.publisher)
        .setTimestamp()
        .setImage(jeu.keyImages[1].url)
        .setFooter("@TopMage");

        if(serv.systemChannel) serv.systemChannel.send("<@&"+role.id+">",{embed:exampleEmbed}).catch(console.error);
      })
      .catch(console.error)
  }
}
