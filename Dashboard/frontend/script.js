const API_KEY = "1077f982976faf1888f09834b8fa9213";

const buttons = document.querySelectorAll(".city-btn");
const searchInput = document.querySelector(".nav-search input");
const favoriteContainer = document.querySelector(".sidebar-card");

// Quick Access
buttons.forEach(button => {

    button.addEventListener("click", () => {

        const city = button.dataset.city;

        loadCity(city);

    });

});

// Search city
searchInput.addEventListener("keypress", function(e){

    if(e.key === "Enter"){

        const city = searchInput.value.trim();

        if(city !== ""){

            loadCity(city);

            addRecent(city);

        }

    }

});

const dropdown = document.querySelector(".search-dropdown");

let suggestions = [];
let selectedIndex = -1;

searchInput.addEventListener("focus", showRecent);

function showRecent(){

    const recents =
    JSON.parse(localStorage.getItem("recentCities")) || [];

    dropdown.innerHTML = "";

    recents.slice().reverse().forEach(city => {

    const div = document.createElement("div");

    div.className = "search-item";

    div.innerHTML = `
    <span>${city}</span>
    <span class="favorite-btn">⭐</span>
    `;

    div.onclick = () => {

    searchInput.value = city;

    loadCity(city);

    dropdown.style.display="none";

    };

    dropdown.appendChild(div);

    });

    dropdown.style.display="block";

}

function loadCity(city){

    showLoading();
    getWeather(city);

}

searchInput.addEventListener("input", async ()=>{

    const keyword = searchInput.value.trim();

    if(keyword.length < 2){

    showRecent();
    return;

    }

    const url =
    `https://api.openweathermap.org/geo/1.0/direct?q=${keyword}&limit=6&appid=${API_KEY}`;

    const res = await fetch(url);
    suggestions = await res.json();

    renderSuggestions(keyword);

});

function showLoading(){

document.querySelector(".temperature").innerText="--";
document.querySelector(".condition").innerText="Loading...";
document.querySelector(".weather-icon").innerHTML="⏳";

}

// Current weather
async function getWeather(city){

try{

const url =
`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;

const res = await fetch(url);
const data = await res.json();

if(data.cod != 200){

alert("City not found");
return;

}

updateWeather(data);

const lat = data.coord.lat;
const lon = data.coord.lon;

getHourlyForecast(lat,lon);
getDailyForecast(lat,lon);
getAQI(lat,lon);

}catch(e){

alert("Weather API error");

}

}

function updateWeather(data){

    document.querySelector(".location span").innerText =
        data.name + ", " + data.sys.country;

    document.querySelector(".temperature").innerText =
        Math.round(data.main.temp) + "°C";

    document.querySelector(".condition-1").innerText =
        data.weather[0].main;

    document.querySelector(".feels-like").innerText =
        "Feels like " + Math.round(data.main.feels_like) + "°C";

    const icon = data.weather[0].icon;

    document.querySelector(".weather-icon").innerHTML =
        `<img src="https://openweathermap.org/img/wn/${icon}@2x.png">`;

    const details = document.querySelectorAll(".weather-details span");

    details[0].innerText = data.main.humidity + "%";
    details[1].innerText = data.wind.speed + " km/h";
    details[2].innerText = (data.visibility/1000) + " km";
    details[3].innerText = data.main.pressure + " hPa";

    updateDateTime(data);

    setWeatherBackground(data.weather[0].main);
}

let clockInterval;

function updateDateTime(data){

const timezone = data.timezone;

function getLocalTime(){

const now = new Date();

const utc =
now.getTime() + now.getTimezoneOffset()*60000;

return new Date(utc + timezone*1000);

}

const local = getLocalTime();

document.querySelector(".date").innerText =
local.toLocaleDateString("en-US",{
weekday:"short",
day:"numeric",
month:"long"
});

document.querySelector(".time").innerText =
local.toLocaleTimeString("en-US",{
hour:"2-digit",
minute:"2-digit"
});

if(clockInterval) clearInterval(clockInterval);

clockInterval = setInterval(()=>{

const t = getLocalTime();

document.querySelector(".time").innerText =
t.toLocaleTimeString("en-US",{
hour:"2-digit",
minute:"2-digit",
second:"2-digit"
});

},1000);

}

// Forecast
async function getDailyForecast(lat, lon){

    const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

    const res = await fetch(url);
    const data = await res.json();

    updateDaily(data);

}

async function getHourlyForecast(lat,lon){

    const url =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    updateHourly(data);

}

function updateHourly(data){

    const container = document.querySelector(".hourly-container");

    container.innerHTML = "";

    for(let i=0;i<8;i++){

    const item = data.list[i];

    if(!item) break;

    const time = new Date(item.dt * 1000)
    .toLocaleTimeString("en-US",{
    hour:"2-digit",
    minute:"2-digit"
    });

    const temp =
    Math.round(item.main.temp);

    const rain =
    Math.round(item.pop*100);

    const icon =
    item.weather[0].icon;

    const html = `
    <div class="hour-item">
    <p class="time">${time}</p>
    <img class="icon" src="https://openweathermap.org/img/wn/${icon}.png">
    <p class="temp">${temp}°C</p>
    <span class="rain">${rain}%</span>
    </div>
    `;

    container.innerHTML += html;

    }
}

// 7 day forecast
function updateDaily(data){

const items = document.querySelectorAll(".forecast-item");

const maxTemps = data.daily.temperature_2m_max;
const minTemps = data.daily.temperature_2m_min;

const globalMax = Math.max(...maxTemps);
const globalMin = Math.min(...minTemps);

const range = globalMax - globalMin || 1;

items.forEach((item,i)=>{

if(!maxTemps[i]) return;

const date = new Date(data.daily.time[i]);

const day =
date.toLocaleDateString("en-US",{weekday:"short"});

const max = Math.round(maxTemps[i]);
const min = Math.round(minTemps[i]);

const code = data.daily.weathercode[i];

const condition = getWeatherCondition(code);
const icon = getWeatherIcon(code);

item.querySelector(".day").innerText = day;

// ICON
const iconBox = item.querySelector(".icon");
iconBox.innerHTML = `<img src="${icon}" width="28">`;

// CONDITION TEXT (đây là phần hay bị mất)
const conditionBox = item.querySelector(".condition");
if(conditionBox){
conditionBox.innerText = condition;
}

// TEMPERATURE
item.querySelector(".min").innerText = min + "°";
item.querySelector(".max").innerText = max + "°";

// TEMP BAR
const fill = item.querySelector(".fill");

if(fill){

const left = ((min - globalMin) / range) * 100;
const width = ((max - min) / range) * 100;

fill.style.marginLeft = left + "%";
fill.style.width = width + "%";

}

});

}


// AQI
async function getAQI(lat,lon){

    const url =
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    updateAQI(data);

}

function updateAQI(data){

    const aqi =
    data.list[0].main.aqi;

    const components =
    data.list[0].components;

    const score =
    calculateAQI(components.pm2_5);

    document.querySelector(".circle span").innerText =
    score;

    document.querySelector(".aqi-badge").innerText =
    getAQILevel(score);

    const pollutants =
    document.querySelectorAll(".pollutant .value");

    pollutants[0].innerHTML =
    components.pm2_5 + " <small>µg/m³</small>";

    pollutants[1].innerHTML =
    components.pm10 + " <small>µg/m³</small>";

    pollutants[2].innerHTML =
    components.co + " <small>µg/m³</small>";

    pollutants[3].innerHTML =
    components.no2 + " <small>µg/m³</small>";

    pollutants[4].innerHTML =
    components.o3 + " <small>µg/m³</small>";

    const mainPollutant = getMainPollutant(components);

    const message =
    getAQIMessage(aqi, mainPollutant);

    document.querySelector(".aqi-message").innerText =
    message;

}

// Favorites
function addFavorite(city){

    let favorites =
    JSON.parse(localStorage.getItem("favorites")) || [];

    if(!favorites.includes(city)){

        favorites.push(city);

        localStorage.setItem("favorites",
        JSON.stringify(favorites));

    }

}

function loadFavorites(){

    let favorites =
    JSON.parse(localStorage.getItem("favorites")) || [];

    favorites.forEach(city => {

        const div =
        document.createElement("div");

        div.className = "location-item";

        div.innerHTML =
        `<span>⭐ ${city}</span>`;

        div.onclick =
        () => loadCity(city);

        favoriteContainer.appendChild(div);

    });

}

// Recent searches
function addRecent(city){

    let recents =
    JSON.parse(localStorage.getItem("recentCities")) || [];

    recents = recents.filter(c => c !== city);

    recents.push(city);

    if(recents.length > 8){
    recents.shift();
    }

    localStorage.setItem("recentCities",
    JSON.stringify(recents));

}

function renderSuggestions(keyword){

    dropdown.innerHTML = "";

    suggestions.forEach((city,index)=>{

    const div = document.createElement("div");

    div.className="search-item";

    const name =
    `${city.name}, ${city.country}`;

    const highlight =
    city.name.replace(
    new RegExp(keyword,"i"),
    match=>`<b>${match}</b>`
    );

    div.innerHTML=`
    <div>
    <span class="search-city">${highlight}</span>
    <span class="search-country">${city.country}</span>
    </div>
    <span class="favorite-btn">⭐</span>
    `;

    div.onclick = ()=>{

    searchInput.value=name;

    loadCity(city.name);

    addRecent(city.name);

    dropdown.style.display="none";

    };

    dropdown.appendChild(div);

    });

    dropdown.style.display="block";

}

searchInput.addEventListener("keydown",(e)=>{

    const items =
    document.querySelectorAll(".search-item");

    if(e.key==="ArrowDown"){

    selectedIndex++;

    if(selectedIndex >= items.length)
    selectedIndex=0;

    }

    if(e.key==="ArrowUp"){

    selectedIndex--;

    if(selectedIndex<0)
    selectedIndex=items.length-1;

    }

    items.forEach(item=>item.classList.remove("active"));

    if(items[selectedIndex])
    items[selectedIndex].classList.add("active");

    if(e.key==="Enter" && items[selectedIndex]){

    items[selectedIndex].click();

    }

});

document.addEventListener("click",(e)=>{

    if(!e.target.closest(".nav-search")){

    dropdown.style.display="none";

    }

});

async function getCitySuggestions(keyword){

const url =
`https://api.openweathermap.org/geo/1.0/direct?q=${keyword}&limit=6&appid=${API_KEY}`;

const res = await fetch(url);

suggestions = await res.json();

renderSuggestions(keyword);

}

function getWeatherCondition(code){

const map = {
0:"Clear",
1:"Mainly clear",
2:"Partly cloudy",
3:"Cloudy",
45:"Fog",
48:"Fog",
51:"Drizzle",
53:"Drizzle",
55:"Drizzle",
61:"Rain",
63:"Rain",
65:"Heavy rain",
71:"Snow",
73:"Snow",
75:"Heavy snow",
80:"Rain showers",
81:"Rain showers",
82:"Heavy showers",
95:"Thunderstorm"
};

return map[code] || "Cloudy";

}

function getWeatherIcon(code){

if(code === 0)
return "https://openweathermap.org/img/wn/01d.png";

if(code <= 3)
return "https://openweathermap.org/img/wn/02d.png";

if(code >= 45 && code <= 48)
return "https://openweathermap.org/img/wn/50d.png";

if(code >= 51 && code <= 55)
return "https://openweathermap.org/img/wn/09d.png";

if(code >= 61 && code <= 65)
return "https://openweathermap.org/img/wn/10d.png";

if(code >= 71 && code <= 75)
return "https://openweathermap.org/img/wn/13d.png";

if(code >= 80 && code <= 82)
return "https://openweathermap.org/img/wn/09d.png";

if(code >= 95)
return "https://openweathermap.org/img/wn/11d.png";

return "https://openweathermap.org/img/wn/02d.png";

}

function calculateAQI(pm25){

if(pm25 <= 12) return Math.round((pm25/12)*50);

if(pm25 <= 35.4)
return Math.round(((pm25-12.1)/(35.4-12.1))*50 + 51);

if(pm25 <= 55.4)
return Math.round(((pm25-35.5)/(55.4-35.5))*50 + 101);

if(pm25 <= 150.4)
return Math.round(((pm25-55.5)/(150.4-55.5))*50 + 151);

if(pm25 <= 250.4)
return Math.round(((pm25-150.5)/(250.4-150.5))*100 + 201);

return 300;

}

function getAQILevel(aqi){

if(aqi <= 50) return "GOOD";

if(aqi <= 100) return "MODERATE";

if(aqi <= 150)
return "UNHEALTHY FOR SENSITIVE GROUPS";

if(aqi <= 200) return "UNHEALTHY";

if(aqi <= 300) return "VERY UNHEALTHY";

return "HAZARDOUS";

}

function getMainPollutant(components){

const pollutants = [
{ name:"PM2.5", value:components.pm2_5 },
{ name:"PM10", value:components.pm10 },
{ name:"CO", value:components.co },
{ name:"NO₂", value:components.no2 },
{ name:"O₃", value:components.o3 }
];

pollutants.sort((a,b)=>b.value-a.value);

return pollutants[0].name;

}

function getAQIMessage(aqi, pollutant){

if(aqi === 1)
return `Air quality is excellent. ${pollutant} levels are low.`;

if(aqi === 2)
return `Air quality is acceptable. Slightly elevated ${pollutant} detected.`;

if(aqi === 3)
return `Sensitive groups should reduce outdoor activities. High ${pollutant} levels detected.`;

if(aqi === 4)
return `Air pollution is high due to elevated ${pollutant}. Limit outdoor activities.`;

if(aqi === 5)
return `Hazardous air quality. Very high ${pollutant} levels detected. Avoid outdoor exposure.`;

return "";

}

function detectLocation(){

if(!navigator.geolocation) return;

navigator.geolocation.getCurrentPosition(async pos=>{

const lat = pos.coords.latitude;
const lon = pos.coords.longitude;

const url =
`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

const res = await fetch(url);
const data = await res.json();

updateWeather(data);

getHourlyForecast(lat,lon);
getDailyForecast(lat,lon);
getAQI(lat,lon);

});

}

function setWeatherBackground(condition){

const body = document.body;

if(condition.includes("Rain"))
body.style.background="linear-gradient(#4b6cb7,#182848)";

else if(condition.includes("Cloud"))
body.style.background="linear-gradient(#bdc3c7,#2c3e50)";

else
body.style.background="linear-gradient(#56ccf2,#2f80ed)";

}

detectLocation();
loadCity("Hanoi");
loadFavorites();