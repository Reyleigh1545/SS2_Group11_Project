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
async function getCityImage(cityName) {
  try {
    const query = encodeURIComponent(cityName + " skyline");

    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=1`,
      {
        headers: { Authorization: PEXELS_KEY }
      }
    );

    const data = await res.json();

    return data.photos?.[0]?.src?.landscape
      || `https://picsum.photos/1600/900?random=${cityName}`;

  } catch (err) {
    console.error("Image error:", err);
    return `https://picsum.photos/1600/900?random=${cityName}`;
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
async function updateBanner(cityName) {
  const banner = CITY_BANNERS[cityName] || {};

  const imgEl = document.getElementById("banner-img");
  const main = document.getElementById("banner-main");
  const sub = document.getElementById("banner-sub");
  const desc = document.getElementById("banner-desc");
  const input = document.querySelector(".search input");

  const imgUrl = await getCityImage(cityName);

  if (imgEl) {
  imgEl.style.opacity = 0;

  const newImg = new Image();
  newImg.src = imgUrl;

  newImg.onload = () => {
    imgEl.src = imgUrl;
    imgEl.style.opacity = 1;
  };
}

  main.innerText = banner.main || `Explore ${cityName}`;
  sub.innerText = banner.sub || "Discover amazing places";
  desc.innerText = banner.desc || "Perfect destination for your next trip.";

  if (input) {
    input.value = cityName;
    input.placeholder = `Search ${cityName}...`;
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

  updateBanner("Thanh Hoa");
});

function initRecommendClick() {
  const items = document.querySelectorAll(".recommend-item");

  items.forEach(item => {
    item.addEventListener("click", async () => {
      const cityName = item.querySelector(".city-name").innerText;

      await updateBanner(cityName);

      addToRecent(cityName);
    });
  });
}

function initRecentClick() {
  const items = document.querySelectorAll(".city-chip");

  items.forEach(item => {
    item.addEventListener("click", async () => {
      const cityName = item.innerText;

      await updateBanner(cityName);
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