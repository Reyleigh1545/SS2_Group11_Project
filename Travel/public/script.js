// ================= CONFIG =================
const API_KEY = "1077f982976faf1888f09834b8fa9213";

// ================= DATA =================
const TRAVEL_CITIES = [
  "Tokyo",
  "Paris",
  "Seoul",
  "Sydney",
  "Barcelona",
  "Rome",
  "Bangkok",
  "Singapore",
  "New York",
  "Vancouver",
  "Dubai",
  "Istanbul"
];

const CITY_BANNERS = {
  Tokyo: {
    img: "https://source.unsplash.com/1600x900/?tokyo,city",
    main: "Explore Tokyo 🇯🇵",
    sub: "Tradition meets the future",
    desc: "Perfect weather and vibrant city life await you."
  },
  Paris: {
    img: "https://source.unsplash.com/1600x900/?paris,eiffel",
    main: "Paris is Calling 🇫🇷",
    sub: "City of love and lights",
    desc: "Enjoy a romantic escape with mild weather."
  },
  Seoul: {
    img: "https://source.unsplash.com/1600x900/?seoul,city",
    main: "Discover Seoul 🇰🇷",
    sub: "Dynamic and trendy",
    desc: "Culture, food, and modern lifestyle."
  },
  Sydney: {
    img: "https://source.unsplash.com/1600x900/?sydney,beach",
    main: "Sunny Sydney ☀️",
    sub: "Beach and sunshine",
    desc: "Perfect for outdoor adventures."
  },
  Barcelona: {
    img: "https://source.unsplash.com/1600x900/?barcelona,city",
    main: "Barcelona Vibes 🇪🇸",
    sub: "Art and beach",
    desc: "Sunny days and great food."
  },
  Rome: {
    img: "https://source.unsplash.com/1600x900/?rome,city",
    main: "Visit Rome 🇮🇹",
    sub: "The eternal city",
    desc: "History and culture everywhere."
  },
  Bangkok: {
    img: "https://source.unsplash.com/1600x900/?bangkok,street",
    main: "Bangkok Adventure 🇹🇭",
    sub: "Street food paradise",
    desc: "Vibrant and energetic city."
  },
  Singapore: {
    img: "https://source.unsplash.com/1600x900/?singapore,city",
    main: "Singapore Escape 🇸🇬",
    sub: "Clean and modern",
    desc: "Green city with great air."
  },
  "New York": {
    img: "https://source.unsplash.com/1600x900/?newyork,city",
    main: "New York City 🗽",
    sub: "Never sleeps",
    desc: "Energy and iconic places."
  },
  Vancouver: {
    img: "https://source.unsplash.com/1600x900/?vancouver,nature",
    main: "Vancouver Nature 🇨🇦",
    sub: "Mountains & ocean",
    desc: "Fresh air and scenery."
  },
  Dubai: {
    img: "https://source.unsplash.com/1600x900/?dubai,city",
    main: "Dubai Luxury 🇦🇪",
    sub: "Modern desert city",
    desc: "Luxury and sunshine."
  },
  Istanbul: {
    img: "https://source.unsplash.com/1600x900/?istanbul,city",
    main: "Istanbul Journey 🇹🇷",
    sub: "East meets West",
    desc: "History and culture."
  }
};

const UNSPLASH_KEY = "aVJi4xrOtyEv1yVDxxjW7-1ogdfi-j85ZQX9bRxaMPA";

async function getCityImage(cityName) {
  try {
    // 🎯 ưu tiên ảnh custom trước
    if (CITY_BANNERS[cityName]?.img) {
      return CITY_BANNERS[cityName].img;
    }

    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${cityName}&orientation=landscape&client_id=${UNSPLASH_KEY}`
    );

    const data = await res.json();

    // 🔥 lấy ảnh đẹp
    return data?.urls?.regular || "https://picsum.photos/1600/900";

  } catch (err) {
    console.error("Image error:", err);

    // fallback nếu API fail
    return "https://picsum.photos/1600/900";
  }
}

// ================= UTIL =================
function calculateAQI(pm25) {
  if (pm25 <= 12) return Math.round((pm25 / 12) * 50);
  if (pm25 <= 35.4)
    return Math.round(((pm25 - 12.1) / (35.4 - 12.1)) * 50 + 51);
  if (pm25 <= 55.4)
    return Math.round(((pm25 - 35.5) / (55.4 - 35.5)) * 50 + 101);
  if (pm25 <= 150.4)
    return Math.round(((pm25 - 55.5) / (150.4 - 55.5)) * 50 + 151);
  return 200;
}

// ================= API =================
async function checkCityGood(city) {
  try {
    // Geo
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
    );
    const geoData = await geoRes.json();
    if (!geoData.length) return null;

    const { lat, lon, name } = geoData[0];

    // Weather
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const weather = await weatherRes.json();

    // AQI
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

    return isGood
      ? { name, lat, lon, temp, aqi }
      : null;

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
  const input = document.querySelector(".nav-search input");

  // 🔥 gọi API lấy ảnh
  const imgUrl = await getCityImage(cityName);

  if (imgEl) {
    imgEl.style.opacity = 0;

    setTimeout(() => {
      imgEl.src = imgUrl;
      imgEl.style.opacity = 1;
    }, 200);
  }

  // text
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
});