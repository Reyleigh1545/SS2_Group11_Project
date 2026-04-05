const API_KEY = "1077f982976faf1888f09834b8fa9213";
let healthList;
const searchInput = document.querySelector(".nav-search input");
import { focusCityByCoords } from "./map.js";

document.addEventListener("DOMContentLoaded", () => {
  healthList = document.querySelector(".health-list");

  // 🔹 Bắt sự kiện click city
  const buttons = document.querySelectorAll(".city-btn");

  console.log("Buttons found:", buttons.length);

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const city = btn.dataset.city;
      console.log("Clicked:", city);
      loadCityAQI(city);
    });
  });

  // 🔹 Load mặc định
  loadCityAQI("Hanoi");
});

searchInput.addEventListener("keydown", function(e){

    if(e.key === "Enter"){

        const city = searchInput.value.trim();

        if(city !== ""){

            loadCityAQI(city);
            addRecent(city);
            hideDropdown();
            searchInput.blur();

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

    div.onclick = ("click", (e) => {

    e.stopPropagation();

    searchInput.value = city;

    loadCityAQI(city);
    hideDropdown();
    searchInput.blur();

    });

    dropdown.appendChild(div);

    });

    dropdown.style.display="block";

}

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

    div.onclick = ("click", (e)=>{
    
      e.stopPropagation();
      
    searchInput.value=name;

    loadCityAQI(city.name);
    addRecent(city.name);

    hideDropdown();
    searchInput.blur();

    });

    dropdown.appendChild(div);

    });

    dropdown.style.display="block";

}

async function getCitySuggestions(keyword){

  const url =
  `https://api.openweathermap.org/geo/1.0/direct?q=${keyword}&limit=6&appid=${API_KEY}`;

  const res = await fetch(url);

  suggestions = await res.json();

  renderSuggestions(keyword);

}

searchInput.addEventListener("input", async ()=>{

    const keyword = searchInput.value.trim();

    if(keyword.length < 2){

    dropdown.style.display = "none";
    return;

    }

    const url =
    `https://api.openweathermap.org/geo/1.0/direct?q=${keyword}&limit=6&appid=${API_KEY}`;

    const res = await fetch(url);
    suggestions = await res.json();

    renderSuggestions(keyword); 

});

// ================= API =================

async function loadCityAQI(city) {
  try {
    console.log("Loading:", city);

    // 1. Geo
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
    );
    const geoData = await geoRes.json();

    if (!geoData.length) {
      alert("City not found");
      return;
    }

    const { lat, lon, name } = geoData[0];

    // 2. Weather
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const weatherData = await weatherRes.json();

    // 3. AQI
    const aqiRes = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    const aqiData = await aqiRes.json();

    updateAirUI(name, weatherData, aqiData);

    await loadAQIForecast(lat, lon);
    focusCityByCoords(lat, lon);
    
  } catch (err) {
    console.error(err);
    alert("Error loading data");
  }

  
}


// ================= UI =================

function updateAirUI(city, weather, aqiData) {

  const pm25 = aqiData.list[0].components.pm2_5;
  const score = calculateAQI(pm25);
  const status = getAQILevel(score);

  // 🔹 AQI number
  document.querySelector(".aqi-value").innerText = score;

  // 🔹 City name
  document.querySelector(".air-info h2").innerText =
    city + " Air Quality";

  // 🔹 Status badge
  const badge = document.querySelector(".status-badge");
  badge.innerText = status;
  badge.className = "status-badge";

  if(score <= 50) badge.classList.add("green");
  else if(score <= 100) badge.classList.add("yellow");
  else if(score <= 150) badge.classList.add("orange");
  else badge.classList.add("red");

  // 🔹 Description
  document.querySelector(".description").innerText =
    `Air quality is ${status.toLowerCase()} with PM2.5 at ${pm25} µg/m³.`;

  // 🔹 Weather stats
  const stats = document.querySelectorAll(".stat-box h4");

  if(stats.length >= 3){
    stats[0].innerText = weather.main.humidity + "%";
    stats[1].innerText = weather.wind.speed + " km/h";
    stats[2].innerText = Math.round(weather.main.temp) + "°C";
  }

  const advice = getAdvice(status);
  renderHealth(status, advice);
  updatePollutants(aqiData.list[0].components);
}


// ================= AQI =================

function calculateAQI(pm25){
  if(pm25 <= 12) return Math.round((pm25/12)*50);
  if(pm25 <= 35.4)
    return Math.round(((pm25-12.1)/(35.4-12.1))*50 + 51);
  if(pm25 <= 55.4)
    return Math.round(((pm25-35.5)/(55.4-35.5))*50 + 101);
  if(pm25 <= 150.4)
    return Math.round(((pm25-55.5)/(150.4-55.5))*50 + 151);
  return 200;
}

function getAQILevel(aqi){
  if(aqi <= 50) return "Good";
  if(aqi <= 100) return "Moderate";
  if(aqi <= 150) return "Unhealthy";
  return "Very Unhealthy";
}

// 👉 Advice theo level
function getAdvice(level) {
  const advice = {
    Good: [
      ["park", "Enjoy outdoor activities", "Air quality is excellent."],
      ["air", "Open windows", "Fresh air is safe."],
    ],
    Moderate: [
      ["directions_walk", "Normal activities OK", "Sensitive people should be careful."],
      ["fitness_center", "Light exercise", "Avoid heavy workouts."],
    ],
    Unhealthy: [
      ["masks", "Wear a mask outdoors", "N95 or higher protection recommended."],
      ["air_purifier_gen", "Run an air purifier", "Keep indoor air clean of particulates."],
      ["event_busy", "Avoid outdoor exercise", "Limit prolonged physical exertion."],
      ["window", "Close windows", "Prevent polluted air from entering homes."],
      
    ],
    "Very Unhealthy": [
      ["block", "Avoid going outside", "Health risk is high."],
      ["air_purifier_gen", "Run an air purifier", "Keep indoor air clean of particulates."],
      ["event_busy", "Avoid outdoor exercise", "Limit prolonged physical exertion."],
      ["window", "Close windows", "Prevent polluted air from entering homes."],
    ],
  };

  return advice[level];
}

// 👉 Render Health UI
function renderHealth(level, adviceArr) {
  healthList.innerHTML = "";

  adviceArr.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("health-item");

    div.innerHTML = `
      <div class="icon-box ${getColorClass(level)}">
        <span class="material-symbols-outlined">${item[0]}</span>
      </div>
      <div>
        <p class="item-title">${item[1]}</p>
        <p class="item-desc">${item[2]}</p>
      </div>
    `;

    healthList.appendChild(div);
  });
}

function getColorClass(level) {
  if (level === "Good") return "green";
  if (level === "Moderate") return "yellow";
  if (level === "Unhealthy") return "orange";
  return "red";
}

function getPollutantLevel(value) {
  if (value <= 50) {
    return { level: "Good", percent: 20, color: "green" };
  }
  if (value <= 100) {
    return { level: "Moderate", percent: 40, color: "yellow" };
  }
  if (value <= 150) {
    return { level: "Unhealthy", percent: 70, color: "orange" };
  }
  return { level: "Very Unhealthy", percent: 100, color: "red" };
}

function updatePollutants(components) {
  const cards = document.querySelectorAll(".pollutant-card");

  cards.forEach(card => {
    const type = card.dataset.type;
    const value = components[type];

    if (value === undefined) return;

    const valueEl = card.querySelector(".value");
    const badge = card.querySelector(".badge");
    const progress = card.querySelector(".progress");

    if (!valueEl || !badge || !progress) return;

    valueEl.innerHTML = `${value.toFixed(1)} <span>µg/m³</span>`;

    const { level, percent, color } = getPollutantLevel(value);

    badge.innerText = level;
    badge.className = "badge " + color;

    progress.style.width = percent + "%";
    progress.className = "progress " + color;
  });
}

async function loadAQIForecast(lat, lon) {
  try {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5&timezone=auto`
    );

    const data = await res.json();

    if (!data.hourly) {
      console.error("Invalid forecast data:", data);
      return;
    }

    updateForecastUI(data.hourly);

  } catch (err) {
    console.error("AQI forecast error:", err);
  }
}

function groupByDay(hourly) {
  const days = {};

  hourly.time.forEach((t, i) => {
    const date = t.split("T")[0];

    if (!days[date]) days[date] = [];

    days[date].push(hourly.pm2_5[i]);
  });

  return days;
}

function updateForecastUI(hourly) {
  const tbody = document.querySelector(".forecast-table tbody");
  tbody.innerHTML = "";

  const days = groupByDay(hourly);

  const dates = Object.keys(days).slice(0, 7);

  dates.forEach((date, index) => {
    const values = days[date].filter(v => v != null);

    if (!values.length) return;

    const min = Math.min(...values);
    const max = Math.max(...values);

    const aqiMin = calculateAQI(min);
    const aqiMax = calculateAQI(max);

    const level = getAQILevel(aqiMax);
    const color = getColorClass(level);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="day">${formatDay(index, date)}</td>
      <td class="condition ${color}">● ${level}</td>
      <td class="range">${aqiMin} - ${aqiMax}</td>
      <td class="dominant">${getDominant(max)}</td>
    `;

    tbody.appendChild(row);
  });
}

function getDominant(pm25) {
  if (pm25 > 100) return "PM2.5";
  if (pm25 > 50) return "PM10";
  return "O₃";
}

function formatDay(index, dateStr) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";

  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function getAQIColor(aqi) {
  if (aqi <= 50) return "green";
  if (aqi <= 100) return "gold";
  if (aqi <= 150) return "orange";
  if (aqi <= 200) return "red";
  if (aqi <= 300) return "purple";
  return "maroon";
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".nav-search")) {
    dropdown.style.display = "none";
  }
});

function hideDropdown() {
  dropdown.style.display = "none";
}


export const WAQI_TOKEN = "d227b74071f97b68607dff55e9a633fb7973f9a1";

// ================= FIREBASE AUTH =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwsrMQn_mbMIL_ZoNpiJcWu7SccSVSfk0",
    authDomain: "skycast-5b2c7.firebaseapp.com",
    projectId: "skycast-5b2c7",
    storageBucket: "skycast-5b2c7.firebasestorage.app",
    messagingSenderId: "226194876823",
    appId: "1:226194876823:web:ce019b2611283d9b727cd2",
    measurementId: "G-XE2XP41DMM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  const avatar = document.getElementById("avatar");

  if (!user) {
    window.location.href = "../../Sign-in/index.html";
  } else {
    if (avatar) {
      avatar.src = user.photoURL;

      avatar.onclick = () => {
        if (confirm("Logout?")) {
          signOut(auth).then(() => {
            window.location.href = "../../Sign-in/index.html";
          });
        }
      };
    }
  }
});
