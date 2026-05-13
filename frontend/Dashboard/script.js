const API_KEY = "1077f982976faf1888f09834b8fa9213";

let currentDayData = [];
const buttons = document.querySelectorAll(".city-btn");
const searchInput = document.querySelector(".nav-search input");
const favoriteContainer = document.querySelector(".sidebar-card");
let forecastData = [];
let forecastByDay = {};
let dailyData = null;

let currentCity = "";
let currentTemp = "";

let map;
let marker;

// Quick Access
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const city = button.dataset.city;

    loadCity(city);
  });
});

function loadByCoords(lat, lon) {
  showLoading();

  // 👉 gọi API theo tọa độ
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`,
  )
    .then((res) => res.json())
    .then((data) => {
      updateWeather(data);
      initMap(lat, lon);
      getHourlyForecast(lat, lon);
      getDailyForecast(lat, lon);
      getAQI(lat, lon);
      updateStar();
    })
    .catch(() => {
      alert("Error loading location");
    });
}

// Search city
searchInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    const city = searchInput.value.trim();

    if (city !== "") {
      loadCity(city);

      addRecent(city);
    }
  }
});

const dropdown = document.querySelector(".search-dropdown");

let suggestions = [];
let selectedIndex = -1;

searchInput.addEventListener("focus", showRecent);

function showRecent() {
  const recents = JSON.parse(localStorage.getItem("recentCities")) || [];

  dropdown.innerHTML = "";

  recents
    .slice()
    .reverse()
    .forEach((city) => {
      const div = document.createElement("div");

      div.className = "search-item";

      div.innerHTML = `
    <span>${city}</span>
    <span class="favorite-btn">⭐</span>
    `;

      div.onclick = () => {
        searchInput.value = city;

        loadCity(city);

        dropdown.style.display = "none";
      };

      dropdown.appendChild(div);
    });

  dropdown.style.display = "block";
}

function loadCity(city) {
  showLoading();

  forecastData = [];
  forecastByDay = {};

  getWeather(city);
}

searchInput.addEventListener("input", async () => {
  const keyword = searchInput.value.trim();

  if (keyword.length < 2) {
    showRecent();
    return;
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${keyword}&limit=6&appid=${API_KEY}`;

  const res = await fetch(url);
  suggestions = await res.json();

  renderSuggestions(keyword);
});

function showLoading() {
  document.querySelector(".temperature").innerText = "--";
  document.querySelector(".condition").innerText = "Loading...";
  document.querySelector(".weather-icon").innerHTML = "⏳";
}

// Current weather
async function getWeather(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.cod != 200) {
      alert("City not found");
      return;
    }

    updateWeather(data);

    const lat = data.coord.lat;
    const lon = data.coord.lon;

    initMap(lat, lon);

    getHourlyForecast(lat, lon);
    getDailyForecast(lat, lon);
    getAQI(lat, lon);
  } catch (e) {
    alert("Weather API error");
  }
}

function updateWeather(data) {
  document.querySelector(".location span").innerText =
    data.name + ", " + data.sys.country;

  document.querySelector(".temperature").innerText =
    Math.round(data.main.temp) + "°C";

  document.querySelector(".condition-1").innerText = data.weather[0].main;

  document.querySelector(".feels-like").innerText =
    "Feels like " + Math.round(data.main.feels_like) + "°C";

  const icon = data.weather[0].icon;

  document.querySelector(".weather-icon").innerHTML =
    `<img src="https://openweathermap.org/img/wn/${icon}@2x.png">`;

  const details = document.querySelectorAll(".weather-details span");

  details[0].innerText = data.main.humidity + "%";
  details[1].innerText = data.wind.speed + " km/h";
  details[2].innerText = data.visibility / 1000 + " km";
  details[3].innerText = data.main.pressure + " hPa";

  updateDateTime(data);

  setWeatherBackground(data.weather[0].main);

  currentCity = data.name;
  currentTemp = Math.round(data.main.temp);

  updateStar();
  updateSunMoon(data);
}

function updateStar() {
  const star = document.getElementById("favoriteStar");

  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  const exists = favorites.some((city) => city.name === currentCity);

  star.classList.toggle("active", exists);
}

document
  .getElementById("favoriteStar")
  .addEventListener("click", toggleFavorite);

function toggleFavorite() {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  const index = favorites.findIndex((c) => c.name === currentCity);

  if (index !== -1) {
    favorites.splice(index, 1);
  } else {
    if (favorites.length >= 3) {
      alert("You can only save 3 favorite cities");
      return;
    }

    favorites.push({
      name: currentCity,
      temp: currentTemp,
    });
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));

  renderFavorites();
  updateStar();
}

function renderFavorites() {
  const box = document.querySelector(".sidebar-card");

  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  box.innerHTML = `<h4>FAVORITE LOCATIONS</h4>`;

  favorites.forEach((city) => {
    const div = document.createElement("div");

    div.className = "location-item";

    div.innerHTML = `
<span><span class="icon-star">★</span> ${city.name}</span>
<span>${city.temp}°C</span>
`;

    div.onclick = () => loadCity(city.name);

    box.appendChild(div);
  });
}

let clockInterval;

function updateDateTime(data) {
  const timezone = data.timezone;

  function getLocalTime() {
    const now = new Date();

    const utc = now.getTime() + now.getTimezoneOffset() * 60000;

    return new Date(utc + timezone * 1000);
  }

  const local = getLocalTime();

  document.querySelector(".date").innerText = local.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      day: "numeric",
      month: "long",
    },
  );

  document.querySelector(".time").innerText = local.toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  if (clockInterval) clearInterval(clockInterval);

  clockInterval = setInterval(() => {
    const t = getLocalTime();

    document.querySelector(".time").innerText = t.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, 1000);
}

// Forecast
async function getDailyForecast(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset&timezone=auto`;

  const res = await fetch(url);
  const data = await res.json();

  updateDaily(data);
}

let currentForecastCity = "";

async function getHourlyForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  currentForecastCity = currentCity;

  forecastData = data.list;
  forecastByDay = groupByDay(forecastData); 

  const today = forecastData[0].dt_txt.split(" ")[0];
  currentDayData = forecastByDay[today];

  updateHourly(data);
}

function updateHourly(data) {
  const container = document.querySelector(".hourly-container");

  container.innerHTML = "";

  for (let i = 0; i < 8; i++) {
    const item = data.list[i];

    if (!item) break;

    const time = new Date(item.dt * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const temp = Math.round(item.main.temp);

    const rain = Math.round(item.pop * 100);

    const icon = item.weather[0].icon;

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
function updateDaily(data) {
  const items = document.querySelectorAll(".forecast-item");

  const maxTemps = data.daily.temperature_2m_max;
  const minTemps = data.daily.temperature_2m_min;

  const globalMax = Math.max(...maxTemps);
  const globalMin = Math.min(...minTemps);

  const sunrises = data.daily.sunrise;
  const sunsets = data.daily.sunset;

  const range = globalMax - globalMin || 1;
  dailyData = data;

  items.forEach((item, i) => {
    if (!maxTemps[i]) return;

    const date = new Date(data.daily.time[i]);

    item.dataset.index = i;
    item.dataset.date = data.daily.time[i];
    item.dataset.sunrise = sunrises[i];
    item.dataset.sunset = sunsets[i];

    const day = date.toLocaleDateString("en-US", { weekday: "short" });

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
    if (conditionBox) {
      conditionBox.innerText = condition;
    }

    // TEMPERATURE
    item.querySelector(".min").innerText = min + "°";
    item.querySelector(".max").innerText = max + "°";

    // TEMP BAR
    const fill = item.querySelector(".fill");

    if (fill) {
      const left = ((min - globalMin) / range) * 100;
      const width = ((max - min) / range) * 100;

      fill.style.marginLeft = left + "%";
      fill.style.width = width + "%";
    }
  });
}

// AQI
async function getAQI(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  updateAQI(data);
}

function updateAQI(data) {
  const aqi = data.list[0].main.aqi;

  const components = data.list[0].components;

  const score = calculateAQI(components.pm2_5);

  document.querySelector(".circle span").innerText = score;

  document.querySelector(".aqi-badge").innerText = getAQILevel(score);

  const pollutants = document.querySelectorAll(".pollutant .value");

  pollutants[0].innerHTML = components.pm2_5 + " <small>µg/m³</small>";

  pollutants[1].innerHTML = components.pm10 + " <small>µg/m³</small>";

  pollutants[2].innerHTML = components.co + " <small>µg/m³</small>";

  pollutants[3].innerHTML = components.no2 + " <small>µg/m³</small>";

  pollutants[4].innerHTML = components.o3 + " <small>µg/m³</small>";

  const mainPollutant = getMainPollutant(components);

  const message = getAQIMessage(aqi, mainPollutant);

  document.querySelector(".aqi-message").innerText = message;

  window.currentAQI = score;
}

// Favorites
function addFavorite(city) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (!favorites.includes(city)) {
    favorites.push(city);

    localStorage.setItem("favorites", JSON.stringify(favorites));
  }
}

function loadFavorites() {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  favorites.forEach((city) => {
    const div = document.createElement("div");

    div.className = "location-item";

    div.innerHTML = `<span>⭐ ${city}</span>`;

    div.onclick = () => loadCity(city);

    favoriteContainer.appendChild(div);
  });
}

// Recent searches
function addRecent(city) {
  let recents = JSON.parse(localStorage.getItem("recentCities")) || [];

  recents = recents.filter((c) => c !== city);

  recents.push(city);

  if (recents.length > 8) {
    recents.shift();
  }

  localStorage.setItem("recentCities", JSON.stringify(recents));
}

function renderSuggestions(keyword) {
  dropdown.innerHTML = "";

  suggestions.forEach((city, index) => {
    const div = document.createElement("div");

    div.className = "search-item";

    const name = `${city.name}, ${city.country}`;

    const highlight = city.name.replace(
      new RegExp(keyword, "i"),
      (match) => `<b>${match}</b>`,
    );

    div.innerHTML = `
    <div>
    <span class="search-city">${highlight}</span>
    <span class="search-country">${city.country}</span>
    </div>
    <span class="favorite-btn">⭐</span>
    `;

    div.onclick = () => {
      searchInput.value = name;

      loadCity(city.name);

      addRecent(city.name);

      dropdown.style.display = "none";
    };

    dropdown.appendChild(div);
  });

  dropdown.style.display = "block";
}

searchInput.addEventListener("keydown", (e) => {
  const items = document.querySelectorAll(".search-item");

  if (e.key === "ArrowDown") {
    selectedIndex++;

    if (selectedIndex >= items.length) selectedIndex = 0;
  }

  if (e.key === "ArrowUp") {
    selectedIndex--;

    if (selectedIndex < 0) selectedIndex = items.length - 1;
  }

  items.forEach((item) => item.classList.remove("active"));

  if (items[selectedIndex]) items[selectedIndex].classList.add("active");

  if (e.key === "Enter" && items[selectedIndex]) {
    items[selectedIndex].click();
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".nav-search")) {
    dropdown.style.display = "none";
  }
});

async function getCitySuggestions(keyword) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${keyword}&limit=6&appid=${API_KEY}`;

  const res = await fetch(url);

  suggestions = await res.json();

  renderSuggestions(keyword);
}

function getWeatherCondition(code) {
  const map = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Fog",
    51: "Drizzle",
    53: "Drizzle",
    55: "Drizzle",
    61: "Rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy showers",
    95: "Thunderstorm",
  };

  return map[code] || "Cloudy";
}

function getWeatherIcon(code) {
  if (code === 0) return "https://openweathermap.org/img/wn/01d.png";

  if (code <= 3) return "https://openweathermap.org/img/wn/02d.png";

  if (code >= 45 && code <= 48)
    return "https://openweathermap.org/img/wn/50d.png";

  if (code >= 51 && code <= 55)
    return "https://openweathermap.org/img/wn/09d.png";

  if (code >= 61 && code <= 65)
    return "https://openweathermap.org/img/wn/10d.png";

  if (code >= 71 && code <= 75)
    return "https://openweathermap.org/img/wn/13d.png";

  if (code >= 80 && code <= 82)
    return "https://openweathermap.org/img/wn/09d.png";

  if (code >= 95) return "https://openweathermap.org/img/wn/11d.png";

  return "https://openweathermap.org/img/wn/02d.png";
}

function calculateAQI(pm25) {
  if (pm25 <= 12) return Math.round((pm25 / 12) * 50);

  if (pm25 <= 35.4)
    return Math.round(((pm25 - 12.1) / (35.4 - 12.1)) * 50 + 51);

  if (pm25 <= 55.4)
    return Math.round(((pm25 - 35.5) / (55.4 - 35.5)) * 50 + 101);

  if (pm25 <= 150.4)
    return Math.round(((pm25 - 55.5) / (150.4 - 55.5)) * 50 + 151);

  if (pm25 <= 250.4)
    return Math.round(((pm25 - 150.5) / (250.4 - 150.5)) * 100 + 201);

  return 300;
}

function getAQILevel(aqi) {
  if (aqi <= 50) return "GOOD";

  if (aqi <= 100) return "MODERATE";

  if (aqi <= 150) return "UNHEALTHY FOR SENSITIVE GROUPS";

  if (aqi <= 200) return "UNHEALTHY";

  if (aqi <= 300) return "VERY UNHEALTHY";

  return "HAZARDOUS";
}

function getMainPollutant(components) {
  const pollutants = [
    { name: "PM2.5", value: components.pm2_5 },
    { name: "PM10", value: components.pm10 },
    { name: "CO", value: components.co },
    { name: "NO₂", value: components.no2 },
    { name: "O₃", value: components.o3 },
  ];

  pollutants.sort((a, b) => b.value - a.value);

  return pollutants[0].name;
}

function getAQIMessage(aqi, pollutant) {
  if (aqi === 1)
    return `Air quality is excellent. ${pollutant} levels are low.`;

  if (aqi === 2)
    return `Air quality is acceptable. Slightly elevated ${pollutant} detected.`;

  if (aqi === 3)
    return `Sensitive groups should reduce outdoor activities. High ${pollutant} levels detected.`;

  if (aqi === 4)
    return `Air pollution is high due to elevated ${pollutant}. Limit outdoor activities.`;

  if (aqi === 5)
    return `Hazardous air quality. Very high ${pollutant} levels detected. Avoid outdoor exposure.`;

  return "";
}

function detectLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    updateWeather(data);

    getHourlyForecast(lat, lon);
    getDailyForecast(lat, lon);
    getAQI(lat, lon);
  });
}

function setWeatherBackground(condition) {
  const body = document.body;

  if (condition.includes("Rain"))
    body.style.background = "linear-gradient(#4b6cb7,#182848)";
  else if (condition.includes("Cloud"))
    body.style.background = "linear-gradient(#bdc3c7,#2c3e50)";
  else body.style.background = "linear-gradient(#56ccf2,#2f80ed)";
}

function updateSunMoon(data) {
  const timezone = data.timezone;
  window.sunrise = data.sys.sunrise;
  window.sunset = data.sys.sunset;
  window.timezone = data.timezone;

  function convertTime(unix) {
    const date = new Date(unix * 1000);

    const utc = date.getTime() + date.getTimezoneOffset() * 60000;

    const cityTime = new Date(utc + timezone * 1000);

    return cityTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const sunriseTime = convertTime(data.sys.sunrise);
  const sunsetTime = convertTime(data.sys.sunset);

  document.querySelector(".sunrise").innerText = "☀ " + sunriseTime;

  document.querySelector(".sunset").innerText = "🌇 " + sunsetTime;

  updateMoonPhase();
}

function updateMoonPhase() {
  const phases = [
    "New Moon",
    "Waxing Crescent",
    "First Quarter",
    "Waxing Gibbous",
    "Full Moon",
    "Waning Gibbous",
    "Last Quarter",
    "Waning Crescent",
  ];

  const day = new Date().getDate();
  const phase = phases[day % phases.length];

  document.querySelector(".moon-phase").innerText = "🌙 " + phase;
}

function initMap(lat, lon) {
  if (!map) {
    map = L.map("map").setView([lat, lon], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    marker = L.marker([lat, lon]).addTo(map);
  } else {
    map.setView([lat, lon], 10);
    marker.setLatLng([lat, lon]);
  }
}

function getCityFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("city");
}

const city = getCityFromURL();

if (city) {
  console.log("City from URL:", city);

  // gọi API weather ở đây
  loadCity(city);
}

const modal = document.getElementById("detail-modal");
const forecastItems = document.querySelectorAll(".forecast-item");

forecastItems.forEach(item => {
  item.addEventListener("click", () => {
    const date = item.dataset.date; // đã có sẵn YYYY-MM-DD

    console.log("CLICK DATE:", date);
    console.log("forecastByDay:", forecastByDay);

    const dayData = forecastByDay[date]; // 🔥 LẤY TRỰC TIẾP

    if (!dayData || dayData.length === 0) {
      console.log("❌ No data for this day:", date);
      return;
    }

    fillModal(dayData, date);
    modal.style.display = "flex";
  });
});

const closeBtn = document.getElementById("modal-close-btn");

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

function groupByDay(list) {
  const days = {};

  list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];

    if (!days[date]) days[date] = [];
    days[date].push(item);
  });

  return days;
}


function fillModal(dayData, date) {

  currentDayData = dayData;

  const width = 800;
  const height = 300;

  // 🔥 lấy thời gian thật
  const times = dayData.map(item =>
    item.dt_txt.split(" ")[1].slice(0, 5)
  );

  chartTimes = times;

  // 🔥 lấy nhiệt độ
  const temps = dayData.map(item => item.main.temp);

  if (!dayData || !Array.isArray(dayData)) {
    console.log("No hourly data for this day");
    return;
  }

  const max = Math.max(...temps);
  const min = Math.min(...temps);

  const first = dayData[0];
  const humidity = first.main.humidity;
  const wind = first.wind.speed;
  const clouds = first.clouds.all;

  // DATE
  document.getElementById("modal-date").innerText = date;

  document.getElementById("modal-city").innerText = currentCity;

  document.getElementById("modal-aqi").innerText =
  window.currentAQI || "--";

  // TEMP
  document.getElementById("modal-main-temp").innerText =
    Math.round(first.main.temp) + "°";

  // STATUS
  document.getElementById("modal-status-text").innerText =
    clouds + "%";

  // HIGH LOW
  document.getElementById("modal-high-low").innerText =
    `H: ${Math.round(max)}° L: ${Math.round(min)}°`;

  // HUMIDITY
  document.getElementById("modal-humidity").innerText =
    humidity + "%";

  // WIND
  document.getElementById("modal-wind").innerHTML =
    wind + " <small>m/s</small>";

  // CHART
  const path = generatePath(temps);
  document.getElementById("modal-chart-path").setAttribute("d", path);

  // ===== TIME LABELS (🔥 THÊM ĐOẠN NÀY) =====
const timeContainer = document.getElementById("modal-times");

if (timeContainer) {
  timeContainer.innerHTML = "";

  times.forEach((t, i) => {
  const div = document.createElement("div");

  div.innerText = t;

  let percent = i / (times.length - 1);

  // 🔥 fix 2 đầu
  if (i === 0) {
    div.style.left = "0%";
    div.style.transform = "translateX(0)";
  } else if (i === times.length - 1) {
    div.style.left = "100%";
    div.style.transform = "translateX(-100%)";
  } else {
    div.style.left = `${percent * 100}%`;
    div.style.transform = "translateX(-50%)";
  }

  timeContainer.appendChild(div);
});
}

  // RAIN BAR
  const barContainer = document.getElementById("modal-bar-chart");
barContainer.innerHTML = "";

const maxRain = Math.max(...dayData.map(d => d.pop));

dayData.forEach(d => {
  const rain = d.pop;

  const percent = maxRain ? (rain / maxRain) * 100 : 0;

  barContainer.innerHTML += `
    <div class="bar-item">
      <div class="bar" style="height:${percent}%"></div>
      <span>${d.dt_txt.split(" ")[1].slice(0,5)}</span>
    </div>
  `;
});
  
  if (chartPoints.length > 0) {
  const first = chartPoints[0];

  dot.setAttribute("cx", first.x);
  dot.setAttribute("cy", first.y);
}
 const sunrise = new Date(
  document.querySelector(`[data-date="${date}"]`).dataset.sunrise
);

const sunset = new Date(
  document.querySelector(`[data-date="${date}"]`).dataset.sunset
);

document.getElementById("modal-sunrise").innerText =
  "☀ " + sunrise.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

document.getElementById("modal-sunset").innerText =
  "🌇 " + sunset.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  updateRainProbability(dayData);
}

const svg = document.querySelector(".line-chart");
const path = document.getElementById("modal-chart-path");
const dot = document.getElementById("chart-dot");

let chartPoints = [];
let chartTimes = [];

function generatePath(temps) {
  const width = 800;
  const height = 120;

  const max = Math.max(...temps);
  const min = Math.min(...temps);

  const step = width / (temps.length - 1);

  chartPoints = temps.map((t, i) => {
    const x = i * step;
    const y = height - ((t - min) / (max - min || 1)) * height;
    return { x, y, temp: t };
  });

  return chartPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
}

function openModal(index) {
  const day = dailyData.daily;

  const date = day.time[index];
  const max = day.temperature_2m_max[index];
  const min = day.temperature_2m_min[index];
  const code = day.weathercode[index];

  const condition = getWeatherCondition(code);

  // 👉 render vào modal
  document.querySelector(".modal-date").innerText = date;
  document.querySelector(".modal-temp").innerText =
    `${Math.round(min)}°C - ${Math.round(max)}°C`;
  document.querySelector(".modal-condition").innerText = condition;

  modal.style.display = "flex";
}

function fillModalDaily(index) {
  const day = dailyData.daily;

  document.getElementById("modal-date").innerText = day.time[index];

  document.getElementById("modal-main-temp").innerText =
    Math.round(day.temperature_2m_max[index]) + "°";

  document.getElementById("modal-status-text").innerText =
    getWeatherCondition(day.weathercode[index]);

  document.getElementById("modal-high-low").innerText =
    `H: ${Math.round(day.temperature_2m_max[index])}° 
     L: ${Math.round(day.temperature_2m_min[index])}°`;
}

svg.addEventListener("click", (e) => {
  if (!chartPoints.length) return;

  const rect = svg.getBoundingClientRect();
  const scaleX = 800 / rect.width;
  const x = (e.clientX - rect.left) * scaleX;

  const step = 800 / (chartPoints.length - 1);
  const index = Math.round(x / step);

  const point = chartPoints[index];
  const temp = point.temp;
  const time = chartTimes[index];

  // 🔥 LẤY DATA THẬT
  const data = currentDayData[index];

  // move dot
  dot.setAttribute("cx", point.x);
  dot.setAttribute("cy", point.y);

  // TEMP
  document.getElementById("modal-main-temp").innerText =
    Math.round(temp) + "°";

  // TIME
  document.getElementById("modal-date").innerText =
    `${time} - ${currentCity}`;

  // 🔥 CLOUDS
  document.getElementById("modal-status-text").innerText =
    data.clouds.all + "% Clouds";

  // 🔥 HUMIDITY
  document.getElementById("modal-humidity").innerText =
    data.main.humidity + "%";

  // 🔥 WIND
  document.getElementById("modal-wind").innerHTML =
    data.wind.speed + " <small>m/s</small>";

});

function updateRainProbability(dayData) {
  const container = document.getElementById("rain-container");

  container.innerHTML = "";

  dayData.forEach(d => {
    const time = d.dt_txt.split(" ")[1].slice(0,5);

    // 🔥 convert sang %
    const percent = Math.round((d.pop || 0) * 100);

    const row = document.createElement("div");
    row.className = "rain-row";

    row.innerHTML = `
      <span class="rain-time">${time}</span>

      <div class="rain-bar">
        <div class="rain-fill" style="width:${percent}%"></div>
      </div>

      <span class="rain-percent">${percent}%</span>
    `;

    container.appendChild(row);
  });
}

function convertTimeWithTZ(unix, timezone) {
  const date = new Date(unix * 1000);

  const utc = date.getTime() + date.getTimezoneOffset() * 60000;

  const cityTime = new Date(utc + timezone * 1000);

  return cityTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ================= FIREBASE AUTH =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwsrMQn_mbMIL_ZoNpiJcWu7SccSVSfk0",
  authDomain: "skycast-5b2c7.firebaseapp.com",
  projectId: "skycast-5b2c7",
  storageBucket: "skycast-5b2c7.firebasestorage.app",
  messagingSenderId: "226194876823",
  appId: "1:226194876823:web:ce019b2611283d9b727cd2",
  measurementId: "G-XE2XP41DMM",
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

const cityFromURL = getCityFromURL();
const saved = JSON.parse(localStorage.getItem("selectedLocation"));

if (cityFromURL) {
  loadCity(cityFromURL);
} else if (saved) {
  loadByCoords(saved.lat, saved.lng);
} else {
  detectLocation();
  loadCity("Hanoi");
}

console.log(Object.keys(forecastByDay));