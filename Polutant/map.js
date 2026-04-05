import { WAQI_TOKEN } from "./script.js";

// INIT MAP
const map = L.map("map").setView([20, 0], 2);

// TILE
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

// LAYER chứa marker
const markerLayer = L.layerGroup().addTo(map);

// AQI COLOR
function getAQIColor(aqi) {
  if (aqi <= 50) return "#22c55e";
  if (aqi <= 100) return "#facc15";
  if (aqi <= 150) return "#f97316";
  if (aqi <= 200) return "#ef4444";
  if (aqi <= 300) return "#7e22ce";
  return "#7f1d1d";
}

// LOAD DATA THEO MAP VIEW
async function loadAQIByBounds() {
  const bounds = map.getBounds();

  const url = `https://api.waqi.info/map/bounds/?latlng=${
    bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()
  }&token=${WAQI_TOKEN}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    markerLayer.clearLayers();

    data.data.forEach(station => {
      if (!station.aqi || station.aqi === "-") return;

      const marker = L.marker([station.lat, station.lon], {
        icon: L.divIcon({
            className: "aqi-marker",
            html: `<div style="
            background:${getAQIColor(station.aqi)};
            color:#000;
            padding:4px 6px;
            border-radius:6px;
            font-size:12px;
            font-weight:bold;
            text-align:center;
            min-width:30px;
            ">
            ${station.aqi}
            </div>`,
            iconSize: [30, 20]
        })
        });

      marker.bindPopup(`
        <b>${station.station.name}</b><br>
        AQI: ${station.aqi}
      `);

      markerLayer.addLayer(marker);
    });

  } catch (err) {
    console.error("AQI load error:", err);
  }
}

// LOAD LẦN ĐẦU
map.whenReady(() => {
  loadAQIByBounds();
});

// LOAD KHI MOVE / ZOOM
map.on("moveend", () => {
  loadAQIByBounds();
});

let selectedMarker = null;

export function focusCityByCoords(lat, lon) {
  map.flyTo([lat, lon], 10);

  if (selectedMarker) {
    markerLayer.removeLayer(selectedMarker);
  }

  selectedMarker = L.marker([lat, lon]).addTo(markerLayer);
}

export async function focusCity(cityName) {
  try {
    // gọi API search city của WAQI
    const res = await fetch(
      `https://api.waqi.info/search/?token=${WAQI_TOKEN}&keyword=${cityName}`
    );
    const data = await res.json();

    if (!data.data.length) return;

    const city = data.data[0];

    if (!city.station || !city.station.geo) return;

    const [lat, lon] = city.station.geo;
    const aqi = city.aqi;

    map.flyTo([lat, lon], 10);

    // xoá marker cũ nếu có
    if (selectedMarker) {
      markerLayer.removeLayer(selectedMarker);
    }

    // tạo marker nổi bật
    selectedMarker = L.marker([lat, lon], {
      icon: L.divIcon({
        className: "aqi-marker",
        html: `<div style="
          background:${getAQIColor(aqi)};
          color:#000;
          padding:6px 10px;
          border-radius:8px;
          font-size:14px;
          font-weight:bold;
          border:2px solid #000;
        ">
          ${aqi}
        </div>`,
        iconSize: [40, 25]
      })
    });

    selectedMarker.bindPopup(`
      <b>${city.station.name}</b><br>
      AQI: ${aqi}
    `);

    markerLayer.addLayer(selectedMarker);

  } catch (err) {
    console.error(err);
  }
}

document.querySelectorAll(".city-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    focusCity(btn.dataset.city);
  });
});