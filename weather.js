/* ==========================================================================
   Weather Forecast App - Premium Logic & API Handler
   ========================================================================== */

const cityInput = document.querySelector("#city");
const citiesList = document.querySelector("#cities");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector("#location-btn");
const cityHeading = document.querySelector(".chng");
const dateTimeEl = document.querySelector("#date-time");

// Units Toggle
const unitCBtn = document.querySelector("#unit-c");
const unitFBtn = document.querySelector("#unit-f");
const tempUnitLabel = document.querySelector(".temp-unit");

// Weather Main Elements
const weatherIcon = document.querySelector("#weather-icon");
const iconPlaceholder = document.querySelector("#icon-placeholder");
const tempVal = document.querySelector("#temp-val");
const conditionBadge = document.querySelector("#condition-badge");

// Metrics Elements
const feelsLikeVal = document.querySelector("#feels-like");
const humidityVal = document.querySelector("#humidity-val");
const windVal = document.querySelector("#wind-val");
const pressureVal = document.querySelector("#pressure-val");

// Quick Pills & Toast
const pillButtons = document.querySelectorAll(".pill-btn");
const toastContainer = document.querySelector("#toast-container");

// App State
const apiKey = "90abaceb81c1f78941c9a7493ba71541";
let availableCities = [];
let currentWeatherData = null;
let currentUnit = "C"; // 'C' or 'F'

/* -------------------------------------------------------------------------- */
/* 1. Initialize Cities Autocomplete                                          */
/* -------------------------------------------------------------------------- */
fetch("cities.txt")
    .then((response) => {
        if (!response.ok) {
            throw new Error("Could not load cities list");
        }
        return response.text();
    })
    .then((data) => {
        availableCities = data
            .split(/\r?\n/)
            .map((city) => city.trim())
            .filter((city) => city !== "");

        citiesList.innerHTML = "";
        availableCities.forEach((city) => {
            const option = document.createElement("option");
            option.value = city;
            citiesList.appendChild(option);
        });
    })
    .catch((error) => {
        console.warn("Cities datalist fallback:", error.message);
    });

/* -------------------------------------------------------------------------- */
/* 2. Event Listeners                                                         */
/* -------------------------------------------------------------------------- */

// Search Button Click
searchButton.addEventListener("click", () => {
    const query = cityInput.value.trim();
    if (query === "") {
        showToast("Please enter a city name.");
        return;
    }
    getWeatherByCity(query);
});

// Press Enter in Search Input
cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        searchButton.click();
    }
});

// Geolocation Button Click
locationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        showToast("Geolocation is not supported by your browser.");
        return;
    }

    locationButton.disabled = true;
    locationButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            getWeatherByCoords(latitude, longitude);
            locationButton.disabled = false;
            locationButton.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
        },
        (error) => {
            locationButton.disabled = false;
            locationButton.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
            showToast("Unable to retrieve your location.");
        }
    );
});

// Popular City Pills
pillButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const city = btn.getAttribute("data-city");
        cityInput.value = city;
        getWeatherByCity(city);
    });
});

// Temperature Unit Toggle
unitCBtn.addEventListener("click", () => {
    if (currentUnit === "C") return;
    currentUnit = "C";
    unitCBtn.classList.add("active");
    unitFBtn.classList.remove("active");
    updateUIWithCurrentData();
});

unitFBtn.addEventListener("click", () => {
    if (currentUnit === "F") return;
    currentUnit = "F";
    unitFBtn.classList.add("active");
    unitCBtn.classList.remove("active");
    updateUIWithCurrentData();
});

/* -------------------------------------------------------------------------- */
/* 3. API Fetching Logic                                                      */
/* -------------------------------------------------------------------------- */

async function getWeatherByCity(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
    )}&appid=${apiKey}&units=metric`;

    fetchWeatherData(url);
}

async function getWeatherByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetchWeatherData(url);
}

async function fetchWeatherData(url) {
    setLoadingState(true);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "City not found. Please try again.");
        }

        currentWeatherData = data;
        updateUIWithCurrentData();
    } catch (error) {
        console.error("Fetch Error:", error);
        showToast(capitalizeWords(error.message));
    } finally {
        setLoadingState(false);
    }
}

/* -------------------------------------------------------------------------- */
/* 4. UI Update & Calculations                                                */
/* -------------------------------------------------------------------------- */

function updateUIWithCurrentData() {
    if (!currentWeatherData) return;

    const data = currentWeatherData;

    // Header & Date
    cityHeading.textContent = `${data.name}, ${data.sys.country}`;
    dateTimeEl.textContent = formatCurrentDate();

    // Weather Icon
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    weatherIcon.style.display = "block";
    iconPlaceholder.style.display = "none";

    // Condition
    conditionBadge.textContent = capitalizeWords(data.weather[0].description);

    // Temperature Calculations
    const tempCelsius = data.main.temp;
    const feelsLikeCelsius = data.main.feels_like;

    if (currentUnit === "C") {
        tempVal.textContent = Math.round(tempCelsius);
        tempUnitLabel.textContent = "°C";
        feelsLikeVal.textContent = `${Math.round(feelsLikeCelsius)}°C`;
    } else {
        tempVal.textContent = Math.round(celsiusToFahrenheit(tempCelsius));
        tempUnitLabel.textContent = "°F";
        feelsLikeVal.textContent = `${Math.round(celsiusToFahrenheit(feelsLikeCelsius))}°F`;
    }

    // Humidity
    humidityVal.textContent = `${data.main.humidity}%`;

    // Wind Speed (convert m/s to km/h)
    const windSpeedKmH = (data.wind.speed * 3.6).toFixed(1);
    windVal.textContent = `${windSpeedKmH} km/h`;

    // Pressure
    pressureVal.textContent = `${data.main.pressure} hPa`;
}

function celsiusToFahrenheit(c) {
    return (c * 9) / 5 + 32;
}

function setLoadingState(isLoading) {
    if (isLoading) {
        searchButton.disabled = true;
        searchButton.querySelector("span").textContent = "Searching...";
    } else {
        searchButton.disabled = false;
        searchButton.querySelector("span").textContent = "Search";
    }
}

function formatCurrentDate() {
    const now = new Date();
    const options = {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    };
    return now.toLocaleDateString("en-US", options);
}

function capitalizeWords(text) {
    if (!text) return "";
    return text
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/* -------------------------------------------------------------------------- */
/* 5. Custom Toast Notifications                                              */
/* -------------------------------------------------------------------------- */

function showToast(message) {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
        <span><i class="fa-solid fa-circle-exclamation" style="margin-right: 8px;"></i> ${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toastIn 0.3s reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Automatically load a default city on startup for showcase
document.addEventListener("DOMContentLoaded", () => {
    getWeatherByCity("Islamabad");
});