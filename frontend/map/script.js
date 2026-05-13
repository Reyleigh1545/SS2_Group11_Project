export const WAQI_TOKEN = "d227b74071f97b68607dff55e9a633fb7973f9a1";

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
            window.location.href = "../Sign-in/index.html";
          });
        }
      };
    }
  }
});

// ================= MAP =================
document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map", { zoomControl: false }).setView(
    [21.0285, 105.8542],
    6,
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  L.control.zoom({ position: "bottomright" }).addTo(map);

  // ================= POPUP =================
  const popupEl = document.querySelector(".map-popup");
  L.DomEvent.disableClickPropagation(popupEl);
  L.DomEvent.disableScrollPropagation(popupEl);

  const titleEl = popupEl.querySelector("h4");
  const timeEl = popupEl.querySelector("p");
  const closeBtn = popupEl.querySelector(".close");
  const saveBtn = popupEl.querySelector(".save-btn");

  const aqiValue = popupEl.querySelector(".aqi h1");
  const aqiText = popupEl.querySelector(".aqi span");
  const tempValue = popupEl.querySelector(".temp h1");
  const tempDesc = popupEl.querySelector(".temp span");

  let currentLatLng = null;

  // ================= SAVE SYSTEM =================
  let savedLocations = JSON.parse(
    localStorage.getItem("savedLocations") || "[]",
  );
  const savedLayer = L.layerGroup().addTo(map);

  const detailBtn = popupEl.querySelector(".detail-btn");

  detailBtn.onclick = () => {
    if (!currentLatLng) return;

    const data = {
      name: titleEl.innerText,
      lat: currentLatLng.lat,
      lng: currentLatLng.lng,
      aqi: aqiValue.innerText,
      temp: tempValue.innerText,
      weather: tempDesc.innerText,
      time: timeEl.innerText,
    };

    // lưu dữ liệu
    localStorage.setItem("selectedLocation", JSON.stringify(data));

    // chuyển trang
    window.location.href = "../Dashboard/frontend/dashboard.html";
  };

  function renderSavedLocations() {
    const container = document.querySelector(".saved-list");
    container.innerHTML = "";
    savedLayer.clearLayers();

    savedLocations.forEach((loc) => {
      // marker
      L.marker([loc.lat, loc.lng]).bindPopup(loc.name).addTo(savedLayer);

      // list
      const div = document.createElement("div");
      div.className = "saved-item";

      div.innerHTML = `
      <span>${loc.name}</span>
      <span class="aqi-badge ${getAqiClass(loc.aqi)}">${loc.aqi}</span>
    `;

      div.onclick = () => {
        map.flyTo([loc.lat, loc.lng], 12);
      };

      container.appendChild(div);
    });
  }

  function saveLocation(location) {
    // remove trùng theo lat/lng
    savedLocations = savedLocations.filter(
      (loc) => loc.lat !== location.lat || loc.lng !== location.lng,
    );

    // thêm mới nhất
    savedLocations.unshift(location);

    // chỉ giữ 2
    savedLocations = savedLocations.slice(0, 2);

    localStorage.setItem("savedLocations", JSON.stringify(savedLocations));
    renderSavedLocations();
  }

  renderSavedLocations();

  // ================= MAP CLICK =================
  map.on("click", async function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    currentLatLng = e.latlng;

    const point = map.latLngToContainerPoint(e.latlng);
    const rect = popupEl.getBoundingClientRect();

    popupEl.style.display = "block";
    popupEl.style.left = point.x - rect.width / 2 + "px";
    popupEl.style.top = point.y - rect.height - 20 + "px";

    // tránh bị che
    setTimeout(() => {
      if (point.y < 200) {
        map.panBy([0, 200]);
      }
    }, 200);

    titleEl.innerText = "Đang tải...";
    timeEl.innerText = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    try {
      // ===== ADDRESS =====
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      );
      const data = await res.json();

      titleEl.innerText = data.display_name || "Không rõ";
      timeEl.innerText = new Date().toLocaleString();

      // ===== AQI =====
      const aqiRes = await fetch(
        `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_TOKEN}`,
      );
      const aqiData = await aqiRes.json();

      const aqiBox = popupEl.querySelector(".aqi");
      aqiBox.className = "aqi";

      if (aqiData.status === "ok") {
        const aqi = aqiData.data.aqi;
        aqiValue.innerText = aqi;

        if (aqi <= 50) {
          aqiText.innerText = "GOOD";
          aqiBox.classList.add("good");
        } else if (aqi <= 100) {
          aqiText.innerText = "MODERATE";
          aqiBox.classList.add("moderate");
        } else if (aqi <= 150) {
          aqiText.innerText = "UNHEALTHY";
          aqiBox.classList.add("unhealthy1");
        } else if (aqi <= 200) {
          aqiText.innerText = "UNHEALTHY";
          aqiBox.classList.add("unhealthy2");
        } else if (aqi <= 300) {
          aqiText.innerText = "VERY UNHEALTHY";
          aqiBox.classList.add("veryunhealthy");
        } else {
          aqiText.innerText = "HAZARDOUS";
          aqiBox.classList.add("hazardous");
        }
      } else {
        aqiValue.innerText = "--";
        aqiText.innerText = "NO DATA";
      }

      // ===== WEATHER =====
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      );
      const weatherData = await weatherRes.json();

      const tempC = weatherData.current_weather.temperature;
      const weatherCode = weatherData.current_weather.weathercode;

      tempValue.innerText = `${tempC}°C`;
      tempDesc.innerText = getWeatherDescription(weatherCode);
    } catch (err) {
      titleEl.innerText = "Lỗi khi tải dữ liệu";
    }
  });

  // ================= SAVE BUTTON =================
  saveBtn.onclick = () => {
    if (!currentLatLng) return;

    saveLocation({
      name: titleEl.innerText,
      lat: currentLatLng.lat,
      lng: currentLatLng.lng,
      aqi: aqiValue.innerText,
    });
  };

  // ================= CLOSE =================
  closeBtn.onclick = () => {
    popupEl.style.display = "none";
  };
});

// ================= WEATHER =================
function getWeatherDescription(code) {
  if (code === 0) return "CLEAR SKY ☀️";
  if (code <= 2) return "PARTLY CLOUDY ⛅";
  if (code === 3) return "CLOUDY ☁️";
  if (code <= 48) return "FOG 🌫";
  if (code <= 67) return "RAIN 🌧";
  if (code <= 77) return "SNOW ❄️";
  if (code <= 82) return "HEAVY RAIN 🌧🌧";
  if (code <= 95) return "THUNDERSTORM ⛈";
  return "UNKNOWN";
}

function getAqiClass(aqi) {
  aqi = Number(aqi);

  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "unhealthy1";
  if (aqi <= 200) return "unhealthy2";
  if (aqi <= 300) return "veryunhealthy";
  return "hazardous";
}
