import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Helpers
function formatDateISO(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateISO(d);
}

function toNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : null;
}

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/forecast", async (req, res) => {
  const location = (req.body.location || "").trim();

  if (!location) {
    return res.status(400).render("error", {
      title: "Missing location",
      message: "Please enter a city or town (e.g., Adelaide, London, New York)."
    });
  }

  try {
    // 1) Geocode location -> lat/lon
    const geoUrl = "https://geocoding-api.open-meteo.com/v1/search";
    const geoResp = await axios.get(geoUrl, {
      params: {
        name: location,
        count: 5,
        language: "en",
        format: "json"
      },
      timeout: 12000
    });

    const results = geoResp.data?.results;
    if (!results || results.length === 0) {
      return res.status(404).render("error", {
        title: "Location not found",
        message: `I couldn't find “${location}”. Try adding a country or state (e.g., “Springfield Illinois”).`
      });
    }

    // Pick the top result
    const place = results[0];
    const lat = toNumber(place.latitude);
    const lon = toNumber(place.longitude);

    if (lat === null || lon === null) {
      return res.status(500).render("error", {
        title: "Geocoding error",
        message: "Found the location, but couldn’t read its coordinates. Try another search."
      });
    }

    // 2) Forecast for tomorrow
    const tomorrow = getTomorrowISO();

    const forecastUrl = "https://api.open-meteo.com/v1/forecast";
    const forecastResp = await axios.get(forecastUrl, {
      params: {
        latitude: lat,
        longitude: lon,
        timezone: "auto",
        daily: [
          "precipitation_probability_max",
          "rain_sum",
          "precipitation_hours",
          "weathercode",
          "temperature_2m_max",
          "temperature_2m_min"
        ].join(","),
        start_date: tomorrow,
        end_date: tomorrow
      },
      timeout: 12000
    });

    const d = forecastResp.data?.daily;
    if (!d || !d.time || d.time.length === 0) {
      return res.status(502).render("error", {
        title: "Forecast unavailable",
        message: "The weather service didn’t return daily data for that location."
      });
    }

    const precipProbMax = toNumber(d.precipitation_probability_max?.[0]);
    const rainSum = toNumber(d.rain_sum?.[0]);
    const precipHours = toNumber(d.precipitation_hours?.[0]);
    const tMax = toNumber(d.temperature_2m_max?.[0]);
    const tMin = toNumber(d.temperature_2m_min?.[0]);

    // Decide "Will it rain?"
    // Rule: "Yes" if probability >= 50 OR rain_sum > 0 OR precipitation_hours > 0
    const willRain =
      (precipProbMax !== null && precipProbMax >= 50) ||
      (rainSum !== null && rainSum > 0) ||
      (precipHours !== null && precipHours > 0);

    const placeName = [
      place.name,
      place.admin1,
      place.country
    ]
      .filter(Boolean)
      .join(", ");

    res.render("result", {
      query: location,
      placeName,
      tomorrow,
      willRain,
      precipProbMax,
      rainSum,
      precipHours,
      tMax,
      tMin,
      lat,
      lon
    });
  } catch (err) {
    console.error("Error:", err?.message || err);

    return res.status(500).render("error", {
      title: "Something went wrong",
      message:
        "There was a problem contacting the weather service. Please try again in a moment."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
