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

document.addEventListener("DOMContentLoaded", () => {

  const map = L.map('map', {
      zoomControl: false
  }).setView([21.0285, 105.8542], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  L.control.zoom({
      position: 'bottomright'
  }).addTo(map);

  // 👉 POPUP HTML
  const popupEl = document.querySelector(".map-popup");
  const titleEl = popupEl.querySelector("h4");
  const timeEl = popupEl.querySelector("p");
  const closeBtn = popupEl.querySelector(".close");

  // 👉 CLICK MAP
  map.on("click", async function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    const x = e.containerPoint.x;
    const y = e.containerPoint.y;

    popupEl.style.display = "block";
    popupEl.style.left = x + "px";
    popupEl.style.top = y + "px";
    popupEl.style.transform = "translate(-50%, -100%)";

    titleEl.innerText = "Đang tải...";
    timeEl.innerText = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();

      titleEl.innerText = data.display_name || "Không rõ";
      timeEl.innerText = new Date().toLocaleString();
    } catch (err) {
      titleEl.innerText = "Lỗi khi tải dữ liệu";
    }
  });

  // 👉 CLOSE
  closeBtn.onclick = () => {
    popupEl.style.display = "none";
  };

});