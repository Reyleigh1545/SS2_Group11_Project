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



// Current weather
async function getWeather(city){

    const url =
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if(data.cod != 200){

    alert(data.message);
    return;

    }

    updateWeather(data);

    const lat = data.coord.lat;
    const lon = data.coord.lon;

    getHourlyForecast(lat,lon);  // hourly
    getDailyForecast(lat,lon);   // 7 day
    getAQI(lat,lon);

}


function updateWeather(data){

    document.querySelector(".location span").innerText =
        data.name + ", " + data.sys.country;

    document.querySelector(".temperature").innerText =
        Math.round(data.main.temp) + "°C";

    document.querySelector(".condition").innerText =
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
weekday:"long",
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

    const time =
    new Date((item.dt + data.city.timezone)*1000)
    .toLocaleTimeString("en-US",{hour:"2-digit"});

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

    for(let i = 0; i < items.length; i++){

    const date = new Date(data.daily.time[i]);

    const day =
    date.toLocaleDateString("en-US",{weekday:"long"});

    const max =
    Math.round(data.daily.temperature_2m_max[i]);

    const min =
    Math.round(data.daily.temperature_2m_min[i]);

    const code =
    data.daily.weathercode[i];

    const condition = getWeatherCondition(code);
    const icon = getWeatherIcon(code);

    items[i].querySelector(".day").innerText = day;

    items[i].querySelector(".temp").innerText =
    `${max}° / ${min}°`;

    items[i].querySelector(".condition").innerText =
    condition;

    items[i].querySelector(".icon").innerHTML =
    `<img src="${icon}">`;

    }

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

    const score =aqi*20;

    document.querySelector(".circle span").innerText =
    score;

    const levels =
    ["Good","Fair","Moderate","Poor","Very Poor"];

    document.querySelector(".aqi-badge").innerText =
    levels[aqi-1].toUpperCase();

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
return "https://cdn-icons-png.flaticon.com/512/869/869869.png";

if(code <= 3)
return "https://cdn-icons-png.flaticon.com/512/1163/1163624.png";

if(code >= 61 && code <= 65)
return "https://cdn-icons-png.flaticon.com/512/414/414974.png";

if(code >= 71 && code <= 75)
return "https://cdn-icons-png.flaticon.com/512/642/642102.png";

if(code >= 95)
return "https://cdn-icons-png.flaticon.com/512/1146/1146860.png";

return "https://cdn-icons-png.flaticon.com/512/414/414825.png";

}

loadCity("Hanoi");
loadFavorites();