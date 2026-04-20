// ================= CONFIG =================
const API_KEY = "1077f982976faf1888f09834b8fa9213";
const PEXELS_KEY = "pmI1MfrXmPn5Jyl8Ne2oL36bVyr1Thtn0DYPGmnybdwIsxrfzlxlZl0p";

// ================= DATA =================
const TRAVEL_CITIES = [
  "Tokyo", "Paris", "Seoul", "Sydney", "Barcelona",
  "Rome", "Bangkok", "Singapore", "New York",
  "Vancouver", "Dubai", "Istanbul"
];

const CITY_BANNERS = {
  Tokyo: { main: "Explore Tokyo 🇯🇵", sub: "Tradition meets the future", desc: "Perfect weather and vibrant city life await you." },
  Paris: { main: "Paris is Calling 🇫🇷", sub: "City of love and lights", desc: "Enjoy a romantic escape with mild weather." },
  Seoul: { main: "Discover Seoul 🇰🇷", sub: "Dynamic and trendy", desc: "Culture, food, and modern lifestyle." },
  Sydney: { main: "Sunny Sydney ", sub: "Beach and sunshine", desc: "Perfect for outdoor adventures." },
  Barcelona: { main: "Barcelona Vibes 🇪🇸", sub: "Art and beach", desc: "Sunny days and great food." },
  Rome: { main: "Visit Rome 🇮🇹", sub: "The eternal city", desc: "History and culture everywhere." },
  Bangkok: { main: "Bangkok Adventure 🇹🇭", sub: "Street food paradise", desc: "Vibrant and energetic city." },
  Singapore: { main: "Singapore Escape 🇸🇬", sub: "Clean and modern", desc: "Green city with great air." },
  "New York": { main: "New York City ", sub: "Never sleeps", desc: "Energy and iconic places." },
  Vancouver: { main: "Vancouver Nature 🇨🇦", sub: "Mountains & ocean", desc: "Fresh air and scenery." },
  Dubai: { main: "Dubai Luxury 🇦🇪", sub: "Modern desert city", desc: "Luxury and sunshine." },
  Istanbul: { main: "Istanbul Journey 🇹🇷", sub: "East meets West", desc: "History and culture." },
  "Thanh Hoa": {
  img: "https://source.unsplash.com/1600x900/?thanh-hoa,vietnam,beach",
  main: "Discover Thanh Hoa 🇻🇳",
  sub: "Sam Son Beach & Nature",
  desc: "A perfect destination with beautiful beaches and local cuisine."
}
};

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
            window.location.href = "../Sign-in/index.html";
          });
        }
      };
    }
  }
});

// ================= IMAGE API =================
async function getCityImage(city) {
  try {
    const query = encodeURIComponent(city + " skyline");

    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=1`,
      {
        headers: { Authorization: PEXELS_KEY }
      }
    );

    const data = await res.json();

    return data.photos?.[0]?.src?.landscape
      || `https://picsum.photos/1600/900?random=${city}`;

  } catch (err) {
    console.error("Image error:", err);
    return `https://picsum.photos/1600/900?random=${city}`;
  }
}

// ================= UTIL =================
function calculateAQI(pm25) {
  if (pm25 <= 12) return Math.round((pm25 / 12) * 50);
  if (pm25 <= 35.4) return Math.round(((pm25 - 12.1) / (35.4 - 12.1)) * 50 + 51);
  if (pm25 <= 55.4) return Math.round(((pm25 - 35.5) / (55.4 - 35.5)) * 50 + 101);
  if (pm25 <= 150.4) return Math.round(((pm25 - 55.5) / (150.4 - 55.5)) * 50 + 151);
  return 200;
}

// ================= API =================
async function checkCityGood(city) {
  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
    );
    const geoData = await geoRes.json();
    if (!geoData.length) return null;

    const { lat, lon, name } = geoData[0];

    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const weather = await weatherRes.json();

    const aqiRes = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    const aqiData = await aqiRes.json();

    const temp = weather.main.temp;
    const weatherMain = weather.weather[0].main;
    const pm25 = aqiData.list[0].components.pm2_5;
    const aqi = calculateAQI(pm25);

    const isGood =
      temp >= 18 &&
      temp <= 28 &&
      aqi < 100 &&
      weatherMain !== "Rain";

    return isGood ? { name, lat, lon, temp, aqi } : null;

  } catch (err) {
    console.error("Check city error:", err);
    return null;
  }
}

async function getSmartRandomCity() {
  const shuffled = [...TRAVEL_CITIES].sort(() => 0.5 - Math.random());

  for (let city of shuffled) {
    const result = await checkCityGood(city);
    if (result) return result;
  }

  return null;
}

// ================= UI =================
async function updateBanner(city) {
  const banner = CITY_BANNERS[city] || {};

  const imgEl = document.getElementById("banner-img");
  const main = document.getElementById("banner-main");
  const sub = document.getElementById("banner-sub");
  const desc = document.getElementById("banner-desc");
  const input = document.querySelector(".search input");

  const imgUrl = await getCityImage(city);

  if (imgEl) {
  imgEl.style.opacity = 0;

  const newImg = new Image();
  newImg.src = imgUrl;

  newImg.onload = () => {
    imgEl.src = imgUrl;
    imgEl.style.opacity = 1;
  };
  
}
await updateTravelInfo(city);

  main.innerText = banner.main || `Explore ${city}`;
  sub.innerText = banner.sub || "Discover amazing places";
  desc.innerText = banner.desc || "Perfect destination for your next trip.";

  if (input) {
    input.value = city;
    input.placeholder = `Search ${city}...`;
  }

  console.log("IMG:", imgUrl);
}

// ================= INIT =================
function initSyncButton() {
  const syncBtn = document.querySelector(".sync-btn");
  if (!syncBtn) return;

  syncBtn.addEventListener("click", async () => {
    syncBtn.classList.add("rotate");
    syncBtn.innerText = "hourglass_top";

    const city = await getSmartRandomCity();

    syncBtn.classList.remove("rotate");
    syncBtn.innerText = "sync_alt";

    if (!city) {
      alert("No good travel city found 😢");
      return;
    }

    await updateBanner(city.name);
    console.log("Recommended:", city);
  });
}

// ================= RUN =================
document.addEventListener("DOMContentLoaded", () => {
  initSyncButton();
  initRecommendClick();
  initRecentClick();
  initSearch();
  initAutocomplete();

  updateBanner("Thanh Hoa");
});

function initRecommendClick() {
  const items = document.querySelectorAll(".recommend-item");

  items.forEach(item => {
    item.addEventListener("click", async () => {
      const city = item.querySelector(".city-name").innerText;

      await updateBanner(city);

      addToRecent(city);
    });
  });
}

function initRecentClick() {
  const items = document.querySelectorAll(".city-chip");

  items.forEach(item => {
    item.addEventListener("click", async () => {
      const city = item.innerText;

      await updateBanner(city);
    });
  });
}

function addToRecent(city) {
  const list = document.querySelector(".recent-list");

  if (!list) return;

  // tránh trùng
  const exists = [...list.children].some(
    el => el.innerText === city
  );
  if (exists) return;

  const chip = document.createElement("span");
  chip.className = "city-chip";
  chip.innerText = city;

  chip.addEventListener("click", async () => {
    await updateBanner(city);
  });

  list.prepend(chip);

  // giới hạn 5 item
  if (list.children.length > 8) {
    list.removeChild(list.lastChild);
  }
}

async function searchCity(city) {
  try {
    // 🌍 lấy tọa độ
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
    );
    const geoData = await geoRes.json();

    if (!geoData.length) {
      alert("City not found ❌");
      return null;
    }

    const { lat, lon, name, country } = geoData[0];

    // 🌤 weather
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const weather = await weatherRes.json();

    // 🌫 AQI
    const aqiRes = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    const aqiData = await aqiRes.json();

    const temp = weather.main.temp;
    const pm25 = aqiData.list[0].components.pm2_5;
    const aqi = calculateAQI(pm25);

    return {
      name: `${name}, ${country}`,
      lat,
      lon,
      temp,
      aqi
    };

  } catch (err) {
    console.error("Search error:", err);
    alert("Something went wrong ⚠️");
    return null;
  }
}

function initSearch() {
  const input = document.querySelector(".search input");

  if (!input) return;

  input.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      const query = input.value.trim();
      if (!query) return;

      const box = document.querySelector(".search-suggestions");
      if (box) {
        box.innerHTML = "";
        box.style.display = "none";
      }
      input.blur();
      input.value = "Loading...";

      const result = await searchCity(query);

      if (!result) {
        input.value = "";
        return;
      }

      await updateBanner(result.name.split(",")[0]);

      addToRecent(result.name);

      console.log("Search result:", result);

      input.value = "";
    }
  });
}

let debounceTimer;

function initAutocomplete() {
  const input = document.querySelector(".search input");
  const box = document.querySelector(".search-suggestions");

  if (!input || !box) return;

  box.innerHTML = "";
  box.style.display = "none";

  input.addEventListener("input", () => {
    const query = input.value.trim();

    clearTimeout(debounceTimer);

    if (query.length < 2) {
      box.innerHTML = "";
      box.style.display = "none";
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
        );
        const data = await res.json();

        box.innerHTML = "";
        box.style.display = "block";

        data.forEach(city => {
          const div = document.createElement("div");

          const name = `${city.name}, ${city.country}`;

          div.innerText = name;

          div.addEventListener("click", async () => {
            input.value = name;
            box.innerHTML = "";
            box.style.display = "none";

            await updateBanner(city.name);

            addToRecent(city.name);
          });

          box.appendChild(div);
        });

      } catch (err) {
        console.error("Autocomplete error:", err);
      }
    }, 400); // debounce
  });

  // click ra ngoài thì ẩn
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search")) {
      box.innerHTML = "";
      box.style.display = "none";
    }
  });
}

async function getCityClimate(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );

    const data = await res.json();

    const temps = data.list.map(item => item.main.temp);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

    const rainCount = data.list.filter(item => item.weather[0].main === "Rain").length;

    return {
      avgTemp,
      rainLevel: rainCount > 5 ? "High" : rainCount > 2 ? "Medium" : "Low"
    };

  } catch (err) {
    console.error("Climate error:", err);
    return null;
  }
}

async function updateTravelInfo(city) {
  const geoRes = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
  );
  const geoData = await geoRes.json();

  if (!geoData.length) return;

  const { lat, lon } = geoData[0];

  const climate = await getCityClimate(lat, lon);
  if (!climate) return;

  // ================= LEFT CARD =================
  const tempEl = document.querySelector(".value");
  const rainEl = document.querySelectorAll(".value")[1];
  
  const weatherRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );
  const weatherData = await weatherRes.json();

  const weatherMain = weatherData.weather[0].main;
  const temp = weatherData.main.temp;

  if (tempEl) {
    tempEl.innerText = `${Math.round(climate.avgTemp - 3)}°C - ${Math.round(climate.avgTemp + 3)}°C`;
  }

  if (rainEl) {
    rainEl.innerText = `${climate.rainLevel} Probability`;
  }

  // ================= TITLE =================
  const title = document.querySelector(".left h2");
  const sub = document.querySelector(".left .sub");

  if (title && sub) {
    title.innerText = "Best Time Now";
    sub.innerText = `In ${city}`;
  }

  // ================= AIR QUALITY =================
  const aqiRes = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );
  const aqiData = await aqiRes.json();

  const pm25 = aqiData.list[0].components.pm2_5;
  const aqi = calculateAQI(pm25);

  const badge = document.querySelector(".badge-green");

  if (badge) {
    if (aqi < 50) {
      badge.innerText = "EXCELLENT";
      badge.className = "badge-green";
    } else if (aqi < 100) {
      badge.innerText = "MODERATE";
      badge.className = "badge-yellow";
    } else {
      badge.innerText = "POOR";
      badge.className = "badge-red";
    }
  }

  // Wardrobe
const wardrobeText = document.querySelector(".wardrobe-text");
if (wardrobeText) {
  wardrobeText.innerText = getWardrobe(climate.avgTemp);
}

// Activities
const activityText = document.querySelector(".activity-text");
if (activityText) {
  activityText.innerText = getActivities(weatherMain);
}

// Air quality
const airText = document.querySelector(".air-text");
if (airText) {
  airText.innerText = getAirQualityText(aqi);
}

// 🌿 Seasonal
const foliage = await getSeasonalForecast(city);
document.querySelector(".foliage-text").innerText = foliage.text;
document.querySelector(".foliage-img").src = foliage.img;

// ✈️ Travel Info
const info = getTravelInfo(temp, aqi);

document.querySelectorAll(".info-status")[0].innerText = info.humidity;
document.querySelectorAll(".info-status")[1].innerText = info.jetLag;
document.querySelectorAll(".info-status")[2].innerText = info.uv;

// 💡 Tip
document.querySelector(".tip-text").innerText =
  getSkycastTip(temp, weatherMain, aqi, city);

  const eventLink = document.querySelector(".events-link");

if (eventLink) {
  eventLink.href = getEventLink(city);
  eventLink.target = "_blank"; // mở tab mới
}

const detailBtn = document.querySelector(".detail-btn");

if (detailBtn) {
  const encodedCity = encodeURIComponent(city);

  detailBtn.href = `../Dashboard/frontend/dashboard.html?city=${encodedCity}`;
}

  updateMonthlyChart(Number(climate.avgTemp));
  highlightCurrentMonth();

}

function generateMonthlyData(baseTemp) {
  const temps = [];
  const rains = [];

  for (let i = 0; i < 12; i++) {
    // mô phỏng mùa
    const seasonal = Math.sin((i / 12) * Math.PI * 2);

    const temp = baseTemp + seasonal * 10;
    const rain = Math.random() * 100;

    temps.push(Math.round(temp));
    rains.push(Math.round(rain));
  }

  return { temps, rains };
}

function updateMonthlyChart(cityTemp) {
  const { temps, rains } = generateMonthlyData(cityTemp);

  const tempParts = document.querySelectorAll(".temp-part");
  const precipParts = document.querySelectorAll(".precip-part");

  for (let i = 0; i < 12; i++) {
    const tempHeight = Math.min(temps[i] * 2, 100);
    const rainHeight = Math.min(rains[i] / 2, 100);

    if (tempParts[i]) {
      tempParts[i].style.height = tempHeight + "%";
    }

    if (precipParts[i]) {
      precipParts[i].style.height = rainHeight + "%";
    }
  }
  console.log("tempParts:", tempParts.length);
  console.log("precipParts:", precipParts.length);
}

function highlightCurrentMonth() {
  const month = new Date().getMonth(); // 0-11

  const bars = document.querySelectorAll(".bar-container");

  bars.forEach(b => b.classList.remove("active"));

  if (bars[month]) {
    bars[month].classList.add("active");
  }
}

function getWardrobe(temp) {
  if (temp < 5) {
    return "Heavy winter clothing is essential. Pack a thick coat, gloves, scarf, and insulated boots to stay warm in freezing conditions.";
  }

  if (temp < 12) {
    return "Cold weather requires a warm jacket, sweaters, and possibly a scarf. Layering is key to stay comfortable throughout the day.";
  }

  if (temp < 18) {
    return "Mildly cool conditions. A light jacket or hoodie with long sleeves will keep you comfortable, especially in the evening.";
  }

  if (temp < 25) {
    return "Pleasant weather. Light layers such as t-shirts, jeans, or casual wear are perfect. You may want a thin jacket for cooler nights.";
  }

  if (temp < 32) {
    return "Warm temperatures call for breathable clothing like t-shirts, shorts, and light fabrics. Stay hydrated and avoid heavy materials.";
  }

  return "Very hot conditions. Wear ultra-light, loose clothing, use sun protection like hats and sunglasses, and drink plenty of water throughout the day.";
}

function getActivities(weatherMain) {
  switch (weatherMain) {
    case "Clear":
      return "Perfect conditions for outdoor activities such as sightseeing, walking tours, parks, and photography. A great time to explore the city freely.";

    case "Clouds":
      return "Comfortable weather for long walks, exploring neighborhoods, and visiting attractions without harsh sunlight. Ideal for casual outdoor exploration.";

    case "Rain":
      return "Rainy conditions are best suited for indoor activities such as museums, shopping centers, cafés, or cultural experiences. Carry an umbrella if going outside.";

    case "Drizzle":
      return "Light rain may still allow short outdoor walks, but it's best to plan flexible activities and have indoor options ready.";

    case "Thunderstorm":
      return "Stormy weather makes outdoor activities unsafe. It is strongly recommended to stay indoors and avoid unnecessary travel.";

    case "Snow":
      return "Great opportunity for winter activities like sightseeing in snowy landscapes, photography, or enjoying seasonal experiences. Dress warmly.";

    case "Mist":
    case "Fog":
      return "Low visibility conditions. Best for relaxed indoor plans or short-distance exploration. Be cautious when traveling.";

    default:
      return "Mixed weather conditions. Plan a flexible itinerary with both indoor and outdoor options to adapt throughout the day.";
  }
}

function getAirQualityText(aqi) {
  if (aqi < 50) {
    return "Air quality is excellent with minimal pollution. It is safe and ideal for all outdoor activities, including exercise and long walks.";
  }

  if (aqi < 100) {
    return "Air quality is acceptable for most people. However, individuals who are sensitive to pollution should consider reducing prolonged outdoor exposure.";
  }

  if (aqi < 150) {
    return "Air quality is unhealthy for sensitive groups. It is advisable to limit outdoor activities, especially for children, the elderly, and those with respiratory issues.";
  }

  if (aqi < 200) {
    return "Air quality is unhealthy. Prolonged outdoor exposure should be avoided. Consider wearing a mask if going outside.";
  }

  return "Air quality is very poor and hazardous. It is strongly recommended to stay indoors and avoid outdoor activities entirely.";
}

function getTravelInfo(temp, aqi) {
  // Humidity impact (fake logic based on temp)
  let humidity = temp > 30 ? "High" : temp > 20 ? "Moderate" : "Low";

  // Jet lag (random cho vui)
  const jetLag = ["Low", "Moderate", "High"][
    Math.floor(Math.random() * 3)
  ];

  // UV risk
  let uv = temp > 30 ? "High" : temp > 25 ? "Moderate" : "Low";

  return { humidity, jetLag, uv };
}

function getSkycastTip(temp, weatherMain, aqi, city) {
  if (aqi < 50) {
    return `Air quality in ${city} is excellent, making it a perfect time for outdoor activities and long city walks.`;
  }

  if (weatherMain === "Rain") {
    return `Rainy conditions in ${city} may affect travel plans. Consider indoor attractions and allow extra travel time.`;
  }

  if (temp > 30) {
    return `High temperatures in ${city} can cause fatigue during travel. Stay hydrated and avoid peak midday heat.`;
  }

  return `Weather conditions in ${city} are generally stable, providing a comfortable travel experience overall.`;
}

function getStatusClass(level) {
  if (level === "Low") return "status-blue";
  if (level === "Moderate") return "status-gray";
  return "status-orange";
}

async function getInfoImage(city, type = "nature") {
  try {
    const query = encodeURIComponent(`${city} ${type}`);

    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=1`,
      {
        headers: { Authorization: PEXELS_KEY }
      }
    );

    const data = await res.json();

    return data.photos?.[0]?.src?.landscape
      || `https://picsum.photos/600/400?random=${city}-${type}`;

  } catch (err) {
    console.error("Info image error:", err);
    return `https://picsum.photos/600/400?random=${city}-${type}`;
  }
}

async function getSeasonalForecast(city) {
  const month = new Date().getMonth() + 1;

  let type = "city";

  if (month >= 9 && month <= 11) {
    type = "autumn forest";
  } else if (month >= 12 || month <= 2) {
    type = "winter snow";
  } else if (month >= 3 && month <= 5) {
    type = "spring flowers";
  } else {
    type = "summer beach";
  }

  const img = await getInfoImage(city, type);

  return {
    text: `Seasonal highlights in ${city} with ${type} scenery, perfect for travel and exploration.`,
    img
  };
}

function getEventLink(city) {
  return `https://www.google.com/search?q=${encodeURIComponent(city + " events this month")}`;
}