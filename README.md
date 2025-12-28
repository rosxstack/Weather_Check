# Will It Rain Tomorrow? 🌧️

This project is a capstone web application built using **Node.js**, **Express**, **Axios**, and **EJS**.  
It allows users to search for a location and find out whether it is likely to rain **tomorrow**, based on real weather data from a public API.

---

## Project Overview

The application takes a user-entered location (city or town), converts it into geographical coordinates using a geocoding API, and then retrieves tomorrow’s weather forecast for that location.  
The data is processed on the server and displayed in a clear, user-friendly format.

---

## Technologies Used

- **Node.js** – JavaScript runtime
- **Express.js** – Server framework
- **Axios** – HTTP client for API requests
- **EJS** – Templating engine
- **CSS** – Basic styling
- **Open-Meteo API** – Public weather and geocoding data

---

## APIs Used

### Open-Meteo Geocoding API
Used to convert a city name into latitude and longitude coordinates.

### Open-Meteo Forecast API
Used to retrieve tomorrow’s weather data, including:
- Rain probability
- Rain amount
- Precipitation hours
- Temperature range

No API key is required.

---

## How the Application Works

1. The user enters a location on the homepage.
2. The server sends a request to the geocoding API to find the location’s coordinates.
3. The server sends another request to the forecast API using those coordinates.
4. The server applies a simple rule to determine whether it will rain tomorrow.
5. The result is rendered on a new page using EJS.

**Rain decision rule:**
- Rain probability ≥ 50%, **or**
- Rain amount > 0 mm, **or**
- Precipitation hours > 0

---

## Project Structure

