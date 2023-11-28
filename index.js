const Discord = require("discord.js");
const {Client, Attachment} = require("discord.js");
require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs");
const mysql = require("mysql");

const bot = new Client();

// Discord bot list API stuff.
const DBL = require("dblapi.js");
const dbl = new DBL(process.env.DBL_API, bot);

// Bot prefix.
const prefix = "&";

// Bot invite link.
const bot_invite = "https://discordapp.com/oauth2/authorize?client_id=721463800976506942&scope=bot&permissions=2146958839";

// Server invite link.
const server_invite = "https://discord.gg/gTQgTzF";

// Patreon link.
const patreon = "https://www.patreon.com/electronite";

// Discord bot list link.
const bot_list = "https://top.gg/bot/721463800976506942";

// Embed colour.
const embed_colour = "3E95DB";

// Initialises an array to store channels.
var channels = [];

// Extracts icon and emoji data from "icons.json".
var icon_data_raw = fs.readFileSync("icons.json");
var icon_data = JSON.parse(icon_data_raw);

// Sets up a connection to the database.
var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE
});

// Connects to the database and extracts channel data.
con.connect(err => {
    if(err) throw err;
    console.log("Connected to database!");
    con.query("SELECT id, home, time, scheduled FROM channels", function(err, result){
        if(err) throw err;
        for(i = 0; i < Object.size(result); i++){
            channels[(result[i].id)] = {
                home: result[i].home,
                time: result[i].time,
                scheduled: result[i].scheduled
            };
        };
        console.log("The current list of channels is:\n", channels);
    });
});

// Functions.
{
    // A function that counts the number of properties in an object.
    Object.size = function(object){
        var size = 0, key;
        for (key in object){
            if (object.hasOwnProperty(key)) size++;
        };
        return size;
    };

    // A function that converts OpenWeatherMap icons to Discord emojis.
    function icon_to_emoji(icon_code){
        for (var i = 0; i < icon_data.length; i++){
            if (icon_data[i].icon == icon_code){
                return icon_data[i].emoji;
                break;
            };
        };
    };

    // A function that converts Unix time to hh:mm.
    function unix_to_minutes(timestamp){

        // Multiplies by 1000 so that the argument is in milliseconds, not seconds.
        var date = new Date(timestamp * 1000);

        // Obtains the hours part from the timestamp.
        var hours = "0" + date.getHours();

        // Obtains the minute part from the timestamp.
        var minutes = "0" + date.getMinutes();

        // Displays time in hh:mm format.
        var time = hours.substr(-2) + ":" + minutes.substr(-2);

        return time
    };

    // A function that converts Unix time to dd/mm.
    function unix_to_date(timestamp){
        var date = new Date(timestamp * 1000)
        var day = "0" + date.getDate();
        var month = "0" + (date.getMonth() + 1);
        return day.substr(-2) + "/" + month.substr(-2);
    };

    // A function that displays the current time as hh:mm:ss:(ms)(ms)(ms).
    function time_ms(){

        // Obtains today's date as an object in numbers.
        var date = new Date();

        // Obtains the hour.
        var hours = "0" + date.getHours();

        // Obtains the minute.
        var minutes = "0" + date.getMinutes();

        // Obtains the second.
        var seconds = "0" + date.getSeconds();

        // Obtains the millisecond.
        var milliseconds = "00" + date.getMilliseconds();

        // Displays time in hh:mm:ss format.
        var time = hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2) + ":" + milliseconds.substr(-3);

        return time
    };

    // A function that converts hhmm into milliseconds.
    function minutes_to_ms(hhmm){
        var hh = hhmm.substr(0,2);
        var mm = hhmm.substr(2,4);
        if(isNaN(Number(hh)) || isNaN(Number(mm))){
            return "error"
        }
        else{
            var ms = Number(hh) * 3600000 + Number(mm) * 60000;
            return ms
        }
    };

    // A function that returns today's date as words.
    function date_today(){

        // Collects today's date as an object in numbers.
        var date = new Date();

        // Adds suffix to day of the month.
        var day_of_month = date.getDate();
        switch(day_of_month % 10){
            case 1:
                day_of_month = day_of_month.toString() + "st";
                break;      
            case 2:
                day_of_month = day_of_month.toString() + "nd";
                break;
            case 3:
                day_of_month = day_of_month.toString() + "rd";
                break;
            default:
                day_of_month = day_of_month.toString() + "th";
        };

        // Converts day of the week into words.
        var day_of_week = new Array();
        day_of_week[0] = "Sunday";
        day_of_week[1] = "Monday";
        day_of_week[2] = "Tuesday";
        day_of_week[3] = "Wednesday";
        day_of_week[4] = "Thursday";
        day_of_week[5] = "Friday";
        day_of_week[6] = "Saturday";
        var day_of_week_words = day_of_week[date.getDay()];

        // Converts month into words.
        var month = new Array();
        month[0] = "January";
        month[1] = "February";
        month[2] = "March";
        month[3] = "April";
        month[4] = "May";
        month[5] = "June";
        month[6] = "July";
        month[7] = "August";
        month[8] = "September";
        month[9] = "October";
        month[10] = "November";
        month[11] = "December";
        var month_words = month[date.getMonth()];

        // Converts year number into current year.
        var year = date.getFullYear();

        // Returns the date in words.
        return date_words = day_of_week_words + " " + day_of_month + " " + month_words + " " + year;
    };

    // A function that replaces each space in a string with a hyphen.
    function space_to_hyphen(string){
        var string_replaced = string.replace(/ /g, "-");
        return string_replaced
    };

    // A function that removes the section of a string before and including the first space.
    function space_after(string){
        var space_position = string.search(" ");
        var string_removed = string.substring(space_position + 1);
        return string_removed;
    };
}

bot.on("ready", () => {

    // Tells the console that the bot is online.
    console.log("This bot is online.");

    // Sets the activity of the bot.
    bot.user.setActivity("with Hodaka.", {type: "PLAYING"});

    // Removes any channels that the bot is no longer in from the database.
    con.query("SELECT id FROM channels", function(err, result){
        if(err) throw err;
        result.forEach(element => {
            if(!bot.channels.cache.get(element.id)){
                con.query("DELETE FROM channels WHERE id = " + `${element.id}`, function(err, result){
                    if(err) throw err;
                });
                console.log("Deleted a channel.");
            };
        });
    });

    // Executes a function periodically.
    setInterval(function(){

        // Pings the database connection periodically.
        con.ping(reconnect = true);

        // Displays the time on the console periodically.
        console.log("The current time is " + time_ms() + ".");

        // Stores all the channels that are ready to be messaged.
        var scheduled_channels = [];
        for(key in channels){

            // Check if the channel has enabled the scheduled message.
            if(channels[key].scheduled == 1){

                // Checks if the current time is around the scheduled time.
                if(Date.now() % 86400000 >= minutes_to_ms(channels[key].time) && Date.now() % 86400000 <= minutes_to_ms(channels[key].time) + 30000){
                    
                    // Checks if the bot is still in the channel.
                    if(!bot.channels.cache.get(key)){
                        con.query("DELETE FROM channels WHERE id = " + `${key}`)
                        console.log("Deleted a channel.");
                    }
                    else{
                        scheduled_channels.push(key);
                    };
                };
            };
        };

        // Sends the scheduled message to the ready channels.
        scheduled_channels.forEach(element => {

            // Pauses between each message since the LocationIQ API only allows a maximum of 2 calls per second.
            setTimeout(function(){
                try{
                    // Geocodes the location (converts into latitude and longitude) using the LocationIQ API.
                    fetch("https://eu1.locationiq.com/v1/search.php?key=" + process.env.LIQ_KEY + "&q=" + space_to_hyphen(channels[element].home) + "&format=json")
                    .then(response => {
                        return response.json();
                    })
                    .then(parsed_location => {

                        // Extracts home latitude and longitude.
                        var latitude = parsed_location[0].lat;
                        var longitude = parsed_location[0].lon;
    
                        // Collects weather data using the OpenWeatherMap API.
                        fetch("http://api.openweathermap.org/data/2.5/onecall?lat=" + latitude + "&lon=" + longitude + "&appid=" + process.env.OWM_KEY)
                        .then(response => {
                            return response.json();
                        })
                        .then(parsed_weather => {
    
                            // Creates the embed.
                            const forecast_embed = new Discord.MessageEmbed()
                                .setColor(embed_colour)
                                .setTitle(parsed_location[0].display_name);
                            
                            // Adds a field for each hour.
                            for(i = 0; i < 12; i++){
                                forecast_embed.addField(`${unix_to_minutes(parsed_weather.hourly[i].dt)}`, `${icon_to_emoji(parsed_weather.hourly[i].weather[0].icon)}` + " `" + `${Math.round(parsed_weather.hourly[i].temp - 273.15)}` + " °C`", true)
                            };
    
                            // Sends the scheduled message and the embed.
                            console.log("Good morning!");
                            bot.channels.cache.get(element).send("```Today's date is " + `${date_today()}` + " and the forecast for " + `${channels[element].home}` + " is:```");
                            bot.channels.cache.get(element).send(forecast_embed);
                        });
                    });
                }
                catch(error){
                    console.error(error);
                };
            }, scheduled_channels.indexOf(element) * 1000)
        });
    }, 30000);
});

bot.on("message", message => {

    // Ignores its own messages.
    if(message.author.bot) return;

    // Says "Nani?" when someone says "hina".
    if(message.content.toLowerCase() == "hina"){
        message.channel.send("```Nani?```");
    };

    // Stores command arguments as an array.
    let args = message.content.substring(prefix.length).split(" ");

    // Only reads commands that start with the correct prefix.
    if(message.content.startsWith(prefix)){

        // If the channel is new, adds the channel to the database.
        if(!channels[message.channel.id]){
            con.query("INSERT INTO channels (id, scheduled) VALUES (" + `${message.channel.id}` + ", 0)", function (err, result){
                if(err) throw err;
                console.log("New channel added.")
                channels[message.channel.id] = {
                    scheduled: 0
                };
            });
        }

        // Reads the command.
        switch(args[0]){

            case "help":
                const help_embed = new Discord.MessageEmbed()
                    .setColor(embed_colour)
                    .setTitle("Help")
                    .setDescription("I'm Hina, a bot made by `electronite`. I can collect weather data for any location and post the forecast every morning.")
                    .setThumbnail("https://i.imgur.com/cx07LHz.jpg")
                    .addField("Commands", "Type " + "`" + prefix + "commands` for a list of commands.")
                    .addField("Invite", "Click [here](" + bot_invite + ") to add Hina to your server.")
                    .addField("Support", "Click [here](" + server_invite + ") to join the official Hina support server.")
                    .addField("Patreon", "Click [here](" + patreon + ") to support the development of Hina.")
                    .addField("Vote", "Click [here](" + bot_list + ") to vote for Hina every 12 hours.")
                    .setImage("https://i.imgur.com/WuqTM48.png");
                message.channel.send(help_embed);
                break;

            case "commands":
                const commands_embed = new Discord.MessageEmbed()
                    .setColor(embed_colour)
                    .setTitle("Commands")
                    .setDescription("Type `hina` for a response!")
                    .setThumbnail("https://i.imgur.com/cx07LHz.jpg")
                    .addField("`" + prefix + "help`", "Displays information about Hina.")
                    .addField("`" + prefix + "commands`", "Displays a list of commands.")
                    .addField("`" + prefix + "weather <location>`", "Displays the current weather at the specified location. If no location is specified, displays the current weather at home.")
                    .addField("`" + prefix + "hourly <location>`", "Displays the 12-hour forecast at the specified location. If no location is specified, displays the 12-hour forecast at home.")
                    .addField("`" + prefix + "daily <location>`", "Displays the 7-day forecast at the specified location. If no location is specified, displays the 7-day forecast at home.")
                    .addField("`" + prefix + "home <location>`", "Sets the location of home. If no location is specified, displays the current home.")
                    .addField("`" + prefix + "time <hhmm>`", "Sets the time of the scheduled message (UTC). If no time is specified, displays the current scheduled time.")
                    .addField("`" + prefix + "schedule`", "Toggles the scheduled message.")
                message.channel.send(commands_embed);
                break;

            case "weather":

                // If a location is not specified, returns home weather.
                if(!args[1]){

                    // Collects channel data from the database.
                    con.query("SELECT * FROM channels WHERE id = " + `${message.channel.id}`, function(err, result){
                        if(err) throw err;

                        // If a home does not exist, notifies the channel.
                        if(!result[0].home){
                            message.channel.send("```No home has been set!```");
                        }

                        // If a home exists, returns home weather.
                        else{
                            try{

                                // Geocodes home using the LocationIQ API.
                                fetch("https://eu1.locationiq.com/v1/search.php?key=" + process.env.LIQ_KEY + "&q=" + space_to_hyphen(channels[message.channel.id].home) + "&format=json")
                                .then(response => {
                                    return response.json();
                                })
                                .then(parsed_location => {
                                    
                                    // Extracts latitude and longitude.
                                    var latitude = parsed_location[0].lat;
                                    var longitude = parsed_location[0].lon;

                                    // Collects weather data using the OpenWeatherMap API.
                                    fetch("http://api.openweathermap.org/data/2.5/onecall?lat=" + latitude + "&lon=" + longitude + "&appid=" + process.env.OWM_KEY)
                                    .then(response => {
                                        return response.json();
                                    })
                                    .then(parsed_weather => {

                                        // Creates the embed.
                                        const weather_embed = new Discord.MessageEmbed()
                                            .setColor(embed_colour)
                                            .setTitle(parsed_location[0].display_name)
                                            .setThumbnail("http://openweathermap.org/img/wn/" + parsed_weather.current.weather[0].icon + "@2x.png")
                                            .addFields(
                                                {name: "Weather", value: "`" + `${parsed_weather.current.weather[0].main}` + " (" + `${parsed_weather.current.weather[0].description}` + ")`"},
                                                {name: "Temperature", value: "`" + `${Math.round(parsed_weather.current.temp - 273.15)}` + " °C (feels like " + `${Math.round(parsed_weather.current.feels_like - 273.15)}` + " °C)`"},
                                                {name: "Wind speed", value: "`" + `${parsed_weather.current.wind_speed}` + " m/s`"},
                                                {name: "Humidity", value: "`" + `${parsed_weather.current.humidity}` + "%`"}
                                            );
                                        message.channel.send(weather_embed);
                                    });
                                });
                            }
                            catch(error){
                                console.error(error);
                            };
                        };
                    });
                }

                // If a location is specified, returns weather at that location.
                else{

                    // Accepts multi-worded locations.
                    let location = space_after(message.content);

                    try{

                        // Geocodes the location using the LocationIQ API.
                        fetch("https://eu1.locationiq.com/v1/search.php?key=" + process.env.LIQ_KEY + "&q=" + space_to_hyphen(location) + "&format=json")
                        .then(response => {
                            return response.json();
                        })
                        .then(parsed_location => {

                            // If the location can be found, returns weather at that location.
                            if(!parsed_location.error){

                                // Extracts latitude and longitude.
                                var latitude = parsed_location[0].lat;
                                var longitude = parsed_location[0].lon;

                                // Collects weather data using the OpenWeatherMap API.
                                fetch("http://api.openweathermap.org/data/2.5/onecall?lat=" + latitude + "&lon=" + longitude + "&appid=" + process.env.OWM_KEY)
                                .then(response => {
                                    return response.json();
                                })
                                .then(parsed_weather => {

                                    // Creates the embed.
                                    const weather_embed = new Discord.MessageEmbed()
                                        .setColor(embed_colour)
                                        .setTitle(parsed_location[0].display_name)
                                        .setThumbnail("http://openweathermap.org/img/wn/" + parsed_weather.current.weather[0].icon + "@2x.png")
                                        .addFields(
                                            {name: "Weather", value: "`" + `${parsed_weather.current.weather[0].main}` + " (" + `${parsed_weather.current.weather[0].description}` + ")`"},
                                            {name: "Temperature", value: "`" + `${Math.round(parsed_weather.current.temp - 273.15)}` + " °C (feels like " + `${Math.round(parsed_weather.current.feels_like - 273.15)}` + " °C)`"},
                                            {name: "Wind speed", value: "`" + `${parsed_weather.current.wind_speed}` + " m/s`"},
                                            {name: "Humidity", value: "`" + `${parsed_weather.current.humidity}` + "%`"}
                                        );
                                    message.channel.send(weather_embed)
                                });
                            }

                            // If the location cannot be found, notifies the channel.
                            else{
                                message.channel.send("```" + location + " is not a valid location!```")
                            };
                        });
                    }
                    catch(error){
                        console.error(error);
                    };
                };
                break;

            case "hourly":

                // If a location is not specified, returns home weather.
                if(!args[1]){

                    // Collects channel data from the database.
                    con.query("SELECT * FROM channels WHERE id = " + `${message.channel.id}`, function(err, result){
                        if(err) throw err;

                        // If a home does not exist, notifies the channel.
                        if(!result[0].home){
                            message.channel.send("```No home has been set!```");
                        }

                        // If a home exists, returns home weather.
                        else{
                            try{

                                // Geocodes the location using the LocationIQ API.
                                fetch("https://eu1.locationiq.com/v1/search.php?key=" + process.env.LIQ_KEY + "&q=" + space_to_hyphen(channels[message.channel.id].home) + "&format=json")
                                .then(response => {
                                    return response.json();
                                })
                                .then(parsed_location => {
                                    
                                    // Extracts latitude and longitude.
                                    var latitude = parsed_location[0].lat;
                                    var longitude = parsed_location[0].lon;
        
                                    // Collects weather data using the OpenWeatherMap API.
                                    fetch("http://api.openweathermap.org/data/2.5/onecall?lat=" + latitude + "&lon=" + longitude + "&appid=" + process.env.OWM_KEY)
                                    .then(response => {
                                        return response.json();
                                    })
                                    .then(parsed_weather => {
        
                                        // Creates the embed.
                                        const forecast_embed = new Discord.MessageEmbed()
                                            .setColor(embed_colour)
                                            .setTitle(parsed_location[0].display_name);
                                        
                                        // Adds a field for each hour.
                                        for(i = 0; i < 12; i++){
                                            forecast_embed.addField(`${unix_to_minutes(parsed_weather.hourly[i].dt)}`, `${icon_to_emoji(parsed_weather.hourly[i].weather[0].icon)}` + " `" + `${Math.round(parsed_weather.hourly[i].temp - 273.15)}` + " °C`", true)
                                        };
                                        message.channel.send(forecast_embed)
                                    });
                                });
                            }
                            catch(error){
                                console.error(error);
                            };
                        };
                    });
                }

                // If location is specified, returns weather for that location.
                else{
                    
                    // Accepts multi-worded locations.
                    let location = space_after(message.content);

                    try{

                        // Geocodes the location using the LocationIQ API.
                        fetch("https://eu1.locationiq.com/v1/search.php?key=" + process.env.LIQ_KEY + "&q=" + space_to_hyphen(location) + "&format=json")
                        .then(response => {
                            return response.json();
                        })
                        .then(parsed_location => {

                            // If the location can be found, returns weather for that location.
                            if(!parsed_location.error){

                                // Extracts latitude and longitude.
                                var latitude = parsed_location[0].lat;
                                var longitude = parsed_location[0].lon;

                                // Collects weather data using the OpenWeatherMap API.
                                fetch("http://api.openweathermap.org/data/2.5/onecall?lat=" + latitude + "&lon=" + longitude + "&appid=" + process.env.OWM_KEY)
                                .then(response => {
                                    return response.json();
                                })
                                .then(parsed_weather => {

                                    // Creates the embed.
                                    const forecast_embed = new Discord.MessageEmbed()
                                        .setColor(embed_colour)
                                        .setTitle(parsed_location[0].display_name);

                                    // Adds a field for each hour.
                                    for(i = 0; i < 12; i++){
                                        forecast_embed.addField(`${unix_to_minutes(parsed_weather.hourly[i].dt)}`, `${icon_to_emoji(parsed_weather.hourly[i].weather[0].icon)}` + " `" + `${Math.round(parsed_weather.hourly[i].temp - 273.15)}` + " °C`", true)
                                    };
                                    message.channel.send(forecast_embed)
                                });
                            }

                            // If the location cannot be found, notifies the channel.
                            else{
                                message.channel.send("```" + location + " is not a valid location!```")
                            };
                        });
                    }
                    catch(error){
                        console.error(error);
                    };
                };
                break;

            case "daily":

                // If a location is not specified, returns home weather.
                if(!args[1]){

                    // Collects channel data from the database.
                    con.query("SELECT * FROM channels WHERE id = " + `${message.channel.id}`, function(err, result){
                        if(err) throw err;

                        // If a home does not exist, notifies the channel.
                        if(!result[0].home){
                            message.channel.send("```No home has been set!```");
                        }

                        // If a home exists, returns home data.
                        else{
                            try{

                                // Geocodes the location using the LocationIQ API.
                                fetch("https://eu1.locationiq.com/v1/search.php?key=" + process.env.LIQ_KEY + "&q=" + space_to_hyphen(channels[message.channel.id].home) + "&format=json")
                                .then(response => {
                                    return response.json();
                                })
                                .then(parsed_location => {
                                    
                                    // Extracts latitude and longitude.
                                    var latitude = parsed_location[0].lat;
                                    var longitude = parsed_location[0].lon;
        
                                    // Collects weather data using the OpenWeatherMap API.
                                    fetch("http://api.openweathermap.org/data/2.5/onecall?lat=" + latitude + "&lon=" + longitude + "&appid=" + process.env.OWM_KEY)
                                    .then(response => {
                                        return response.json();
                                    })
                                    .then(parsed_weather => {
        
                                        // Creates the embed.
                                        const forecast_embed = new Discord.MessageEmbed()
                                            .setColor(embed_colour)
                                            .setTitle(parsed_location[0].display_name);
                                        
                                        // Adds a field for each hour.
                                        for(i = 0; i < 7; i++){
                                            forecast_embed.addField(`${unix_to_date(parsed_weather.daily[i].dt)}`, `${icon_to_emoji(parsed_weather.daily[i].weather[0].icon)}` + " `" + `${Math.round(parsed_weather.daily[i].temp.day - 273.15)}` + " °C`", true)
                                        };
                                        message.channel.send(forecast_embed)
                                    });
                                });
                            }
                            catch(error){
                                console.error(error);
                            };
                        };
                    });
                }

                // If a location is specified, returns weather for that location.
                else{
                    
                    // Accepts multi-worded locations.
                    let location = space_after(message.content);

                    try{

                        // Geocodes the location using the LocationIQ API.
                        fetch("https://eu1.locationiq.com/v1/search.php?key=" + process.env.LIQ_KEY + "&q=" + space_to_hyphen(location) + "&format=json")
                        .then(response => {
                            return response.json();
                        })
                        .then(parsed_location => {

                            // If the location can be found, returns weather for that location.
                            if(!parsed_location.error){

                                // Extracts latitude and longitude.
                                var latitude = parsed_location[0].lat;
                                var longitude = parsed_location[0].lon;

                                // Collects weather data using the OpenWeatherMap API.
                                fetch("http://api.openweathermap.org/data/2.5/onecall?lat=" + latitude + "&lon=" + longitude + "&appid=" + process.env.OWM_KEY)
                                .then(response => {
                                    return response.json();
                                })
                                .then(parsed_weather => {

                                    // Creates the embed.
                                    const forecast_embed = new Discord.MessageEmbed()
                                        .setColor(embed_colour)
                                        .setTitle(parsed_location[0].display_name);

                                    // Adds a field for each hour.
                                    for(i = 0; i < 7; i++){
                                        forecast_embed.addField(`${unix_to_date(parsed_weather.daily[i].dt)}`, `${icon_to_emoji(parsed_weather.daily[i].weather[0].icon)}` + " `" + `${Math.round(parsed_weather.daily[i].temp.day - 273.15)}` + " °C`", true)
                                    };
                                    message.channel.send(forecast_embed)
                                });
                            }
                            
                            // If the location cannot be found, notifies the channel.
                            else{
                                message.channel.send("```" + location + " is not a valid location!```")
                            };
                        });
                    }
                    catch(error){
                        console.error(error);
                    };
                };
                break;

            case "home":

                // If no argument is specified, looks up the home in the database.
                if(!args[1]){
                    con.query("SELECT * FROM channels WHERE id = " + `${message.channel.id}`, function(err, result){
                        if(err) throw err;

                        // If a home does not exist, notifies the channel.
                        if(!result[0].home){
                            message.channel.send("```No home has been set.```")
                        }

                        // If a home exists, collects the home from the database and displays it to the channel.
                        else{
                            channels[message.channel.id] = {
                                home: result[0].home,
                                time: result[0].time,
                                scheduled: result[0].scheduled
                            };
                            message.channel.send("```The current home location of this channel is " + `${channels[message.channel.id].home}` + ".```")
                        };
                    });
                }

                // If an argument is specified, updates the home.
                else{

                    // Accepts multi-worded locations.
                    let location = space_after(message.content);

                    try{

                        // Geocodes the location using the LocationIQ API.
                        fetch("https://eu1.locationiq.com/v1/search.php?key=" + process.env.LIQ_KEY + "&q=" + space_to_hyphen(location) + "&format=json")
                        .then(response => {
                            return response.json();
                        })
                        .then(parsed_location => {

                            // If the location can be found, updates the database and notifies the channel.
                            if(!parsed_location.error){
                                con.query("UPDATE channels SET home = " + `'${location}'` + " WHERE id = " + `${message.channel.id}`, function(err, result){
                                    if(err) throw err
                                    console.log("Home was updated.");
                                    channels[message.channel.id].home = location
                                    message.channel.send("```The home location has been set to " + `${location}` + ".```");
                                });
                            }

                            // If the location cannot be found, notifies the channel.
                            else{
                                message.channel.send("```" + location + " is not a valid location!```")
                            };
                        });
                    }
                    catch(error){
                        console.error(error);
                    };
                };
                break;

            case "time":

                // If no argument is specified, looks up the scheduled time in the database.
                if(!args[1]){
                    con.query("SELECT * FROM channels WHERE id = " + `${message.channel.id}`, function(err, result){
                        if(err) throw err;

                        // If a time does not exist, notifies the channel.
                        if(!result[0].time){
                            message.channel.send("```No time has been set.```")
                        }

                        // If a time exists, notifies the channel.
                        else{
                            channels[message.channel.id] = {
                                home: result[0].home,
                                time: result[0].time,
                                scheduled: result[0].scheduled
                            };
                            message.channel.send("```The time of the scheduled message is " + `${channels[message.channel.id].time}` + ".```");
                        };
                    });
                }

                // If an argument is specified, updates the scheduled time.
                else{

                    // Checks if the argument is in the correct format (hhmm).
                    if(
                        args[1].match(/^[0-9]+$/) != null
                        && args[1].length == 4
                        && Number(args[1].substr(0,2)) < 24
                        && Number(args[1].substr(2,4)) < 60
                    ){

                        // Updates the database and notifies the channel.
                        con.query("UPDATE channels SET time = " + `'${args[1]}'` + " WHERE id = " + `${message.channel.id}`, function(err, result){
                            if(err) throw err
                            console.log("Time was updated.");
                            channels[message.channel.id].time = args[1];
                            message.channel.send("```The time of the scheduled message has been set to " + `${args[1]}` + ".```");
                        })
                    }
                    else{
                        message.channel.send("```That is not in the correct format! (hhmm)```");
                    };
                };
                break;

            case "schedule":

                // Collects channel data from the database.
                con.query("SELECT * FROM channels WHERE id = " + `${message.channel.id}`, function(err, result){
                    if(err) throw err;
                    channels[message.channel.id] = {
                        home: result[0].home,
                        time: result[0].time,
                        scheduled: result[0].scheduled
                    };

                    // Toggles the value of "scheduled".
                    if(channels[message.channel.id].scheduled == 1){
                        con.query("UPDATE channels SET scheduled = 0 WHERE id = " + `${message.channel.id}`, function(err, result){
                            if(err) throw err;
                            console.log("Scheduled message was disabled.");
                        });
                        channels[message.channel.id].scheduled = 0;
                        message.channel.send("```The scheduled message has been disabled.```");
                    }
                    else if(!channels[message.channel.id].home){
                        message.channel.send("```No home location has been set!```");
                    }
                    else if(!channels[message.channel.id].time){
                        message.channel.send("```No time has been set!```");
                    }
                    else if(channels[message.channel.id].scheduled == 0){
                        con.query("UPDATE channels SET scheduled = 1 WHERE id = " + `${message.channel.id}`, function(err, result){
                            if(err) throw err;
                            console.log("Scheduled message was enabled.");
                        });
                        channels[message.channel.id].scheduled = 1;
                        message.channel.send("```The scheduled message has been enabled.```");
                    };
                });
                break;
        };
    };
});

bot.login(process.env.DISCORD_TOKEN);