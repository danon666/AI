const API_KEY = 'e95e9957119d9f9ce8db92609876ac16';
const CURRENT_WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

let cityInput, searchBtn, weatherContainer, currentWeatherDiv, forecastDiv, errorMessage, loading;

document.addEventListener('DOMContentLoaded', function() {
    cityInput = document.getElementById('cityInput');
    searchBtn = document.getElementById('searchBtn');
    weatherContainer = document.getElementById('weatherContainer');
    currentWeatherDiv = document.getElementById('currentWeather');
    forecastDiv = document.getElementById('forecastContainer');
    errorMessage = document.getElementById('errorMessage');
    loading = document.getElementById('loading');

    searchBtn.addEventListener('click', handleSearch);
});

function handleSearch() {
    const city = cityInput.value.trim();
    showLoading();
    getCurrentWeather(city);
}

function getCurrentWeather(city) {
    const url = `${CURRENT_WEATHER_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pl`;
    console.log('XMLHttpRequest URL:', url); 
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
        console.log('XMLHttpRequest status:', xhr.status);
        console.log('XMLHttpRequest response:', xhr.responseText);
        const data = JSON.parse(xhr.responseText);
        console.log('Current Weather Data:', data);
        displayCurrentWeather(data);        
        getForecast(city);        
        }  
    xhr.send();
}

function getForecast(city) {
    const url = `${FORECAST_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pl`;
    console.log('Fetch URL:', url);
    fetch(url)
        .then(response => {
            console.log('Fetch status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Forecast Data:', data);
            displayForecast(data);
            hideLoading();
            showWeather();
        })
}

function displayCurrentWeather(data) {
    const { name, sys, main, weather, wind, clouds } = data;
    
    const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
    
    currentWeatherDiv.innerHTML = `
        <h2>${name}, ${sys.country}</h2>
        <div class="weather-main">
            <img src="${iconUrl}" alt="${weather[0].description}" class="weather-icon">
            <div>
                <div class="weather-temp">${Math.round(main.temp)}°C</div>
                <div class="weather-description">${weather[0].description}</div>
            </div>
        </div>
        <div class="weather-details">
            <div class="detail-item">
                <span class="detail-label">Odczuwalna</span>
                <span class="detail-value">${Math.round(main.feels_like)}°C</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Wilgotność</span>
                <span class="detail-value">${main.humidity}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Ciśnienie</span>
                <span class="detail-value">${main.pressure} hPa</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Wiatr</span>
                <span class="detail-value">${Math.round(wind.speed)} m/s</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Zachmurzenie</span>
                <span class="detail-value">${clouds.all}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Min/Max</span>
                <span class="detail-value">${Math.round(main.temp_min)}°/${Math.round(main.temp_max)}°C</span>
            </div>
        </div>
    `;
    
    console.log('Wyświetlono pogodę bieżącą');
}

function displayForecast(data) {
    const forecastHTML = data.list.map(item => {
        const date = new Date(item.dt * 1000);
        const dayOfWeek = date.toLocaleDateString('pl-PL', { weekday: 'short' });
        const dayMonth = date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
        const time = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
        
        return `
            <div class="forecast-item">
                <div class="forecast-datetime">
                    <div class="forecast-date">${dayOfWeek}, ${dayMonth}</div>
                    <div class="forecast-time">${time}</div>
                </div>
                <div class="forecast-weather">
                    <img src="${iconUrl}" alt="${item.weather[0].description}" class="forecast-icon">
                    <div>
                        <div class="forecast-temp">${Math.round(item.main.temp)}°C</div>
                        <div class="forecast-desc">${item.weather[0].description}</div>
                    </div>
                </div>
                <div class="forecast-extra">
                    <div>Wilgotność ${item.main.humidity}%</div>
                    <div>Wiatr ${Math.round(item.wind.speed)} m/s</div>
                </div>
            </div>
        `;
    }).join('');
    
    forecastDiv.innerHTML = `
        <div class="forecast-list">
            ${forecastHTML}
        </div>
    `;
    }



function showLoading() {
    loading.style.display = 'block';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showWeather() {
    weatherContainer.style.display = 'block';
}

