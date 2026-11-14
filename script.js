let temperatureData = [];
let temperatureChart = null;

let audioContext = null;
let currentOscillator = null;
let currentGain = null;

let currentIndex = 0;
let isPlaying = false;
let isPaused = false;
let playbackTimer = null;


// 3. CREATE THE WEBSITE INTERFACE

const chartContainer = document.querySelector(".chart-placeholder");

chartContainer.innerHTML = `
    <p>01 / TEMPERATURE ANALYSIS</p>
    <h3>Temperature Over Time</h3>

    <p id="data-status">Loading NASA data...</p>

    <div style="width:100%; height:300px; position:relative;">
        <canvas id="temperatureChart"></canvas>
    </div>
`;

const audioContainer = document.querySelector(".audio-placeholder");

audioContainer.innerHTML = `
    <p id="audio-status">NASA DATA SONIFICATION</p>

    <div style="display:flex; justify-content:center; gap:15px; margin:25px 0;">
        <button id="playButton">▶ Play</button>
        <button id="pauseButton">Ⅱ Pause</button>
        <button id="stopButton">■ Stop</button>
    </div>

    <div style="margin-top:20px;">
        <label for="volumeControl">Volume</label>
        <input
            type="range"
            id="volumeControl"
            min="0"
            max="1"
            step="0.01"
            value="0.3"
        >
    </div>

    <p id="sound-progress">Ready to play</p>
`;


// 4. LOAD CHART.JS

function loadChartLibrary() {

    return new Promise((resolve, reject) => {

        const script = document.createElement("script");

        script.src =
            "https://cdn.jsdelivr.net/npm/chart.js";

        script.onload = resolve;

        script.onerror = () => {
            reject(new Error("Could not load Chart.js"));
        };

        document.head.appendChild(script);

    });

}


// 5. GET NASA DATA




// 6. CREATE TEMPERATURE CHART
function createTemperatureChart() {
if (temperatureChart) {
    temperatureChart.destroy();
    temperatureChart = null;
}

    const canvas = document.getElementById("temperatureChart");

    const labels = temperatureData.map(item => item.date);

    const values = temperatureData.map(item => item.temperature);

    temperatureChart = new Chart(canvas, {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Temperature (°C)",

                data: values,

                borderColor: "#38bdf8",

                backgroundColor: "rgba(56, 189, 248, 0.12)",

                borderWidth: 2,

                pointRadius: 2,

                pointHoverRadius: 6,

                fill: true,

                tension: 0.35

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {

                legend: {
                    labels: {
                        color: "#a8b8ca"
                    }
                }

            },

            scales: {

                x: {
                    ticks: {
                        color: "#829bb2",
                        maxTicksLimit: 12
                    },

                    grid: {
                        color: "rgba(130, 155, 178, 0.1)"
                    }

                },

                y: {

                    title: {
                        display: true,
                        text: "Temperature (°C)",
                        color: "#a8b8ca"
                    },

                    ticks: {
                        color: "#829bb2"
                    },

                    grid: {
                        color: "rgba(130, 155, 178, 0.1)"
                    }

                }

            }

        }

    });

}


// 7. INITIALIZE AUDIO SYSTEM

function initializeAudio() {

    if (!audioContext) {

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        audioContext = new AudioContextClass();

    }

    if (audioContext.state === "suspended") {

        audioContext.resume();

    }

}
function playTemperatureSound(temperature) {

    const frequency = temperatureToFrequency(temperature);

    currentOscillator = audioContext.createOscillator();
    currentGain = audioContext.createGain();

    currentOscillator.frequency.value = frequency;

    currentGain.gain.value = 0.2;

    currentOscillator.connect(currentGain);
    currentGain.connect(audioContext.destination);

    currentOscillator.start();

    currentOscillator.stop(audioContext.currentTime + 1);
}

// 8. CONVERT TEMPERATURE INTO SOUND FREQUENCY

function temperatureToFrequency(temperature) {

    const minTemperature = 10;
    const maxTemperature = 35;

    const minFrequency = 220;
    const maxFrequency = 880;

    const normalized =
        (temperature - minTemperature) /
        (maxTemperature - minTemperature);

    const frequency =
        minFrequency +
        normalized * (maxFrequency - minFrequency);

    return Math.max(
        minFrequency,
        Math.min(maxFrequency, frequency)
    );

}


// 9. PLAY ONE TEMPERATURE SOUND

function playTemperatureSound(temperature) {

    initializeAudio();

    const frequency = temperatureToFrequency(temperature);

    const oscillator = audioContext.createOscillator();

    const gain = audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.value = frequency;

    gain.gain.value =
        Number(document.getElementById("volumeControl").value);

    oscillator.connect(gain);

    gain.connect(audioContext.destination);

    oscillator.start();

    gain.gain.setTargetAtTime(
        0,
        audioContext.currentTime + 0.65,
        0.1
    );

    oscillator.stop(audioContext.currentTime + 1);

    currentOscillator = oscillator;

    currentGain = gain;

}


// 10. PLAY THE DATA SEQUENCE

function playNextSound() {

    if (!isPlaying) {
        return;
    }

    if (currentIndex >= temperatureData.length) {

        stopSound();

        document.getElementById("audio-status").textContent =
            "SONIFICATION COMPLETED";

        return;

    }

    const item = temperatureData[currentIndex];

    playTemperatureSound(item.temperature);

    document.getElementById("sound-progress").textContent =
        `${item.date} | ${item.temperature.toFixed(2)}°C`;

    currentIndex++;

    playbackTimer = setTimeout(playNextSound, 1100);

}


// 11. PLAY BUTTON

document.getElementById("playButton").addEventListener("click", () => {

    if (temperatureData.length === 0) {
        return;
    }

    initializeAudio();

    if (isPlaying) {
        return;
    }

    if (currentIndex >= temperatureData.length) {
        currentIndex = 0;
    }

    isPlaying = true;
    isPaused = false;

    document.getElementById("audio-status").textContent =
        "PLAYING EARTH DATA";

    playNextSound();

});


// 12. PAUSE BUTTON

document.getElementById("pauseButton").addEventListener("click", () => {

    if (!isPlaying) {
        return;
    }

    isPlaying = false;
    isPaused = true;

    clearTimeout(playbackTimer);

    if (currentOscillator) {
        try {
            currentOscillator.stop();
        } catch (error) {
            // Oscillator may already have stopped
        }
    }

    document.getElementById("audio-status").textContent =
        "PAUSED";

});


// 13. STOP BUTTON

function stopSound() {

    isPlaying = false;
    isPaused = false;

    clearTimeout(playbackTimer);

    if (currentOscillator) {
        try {
            currentOscillator.stop();
        } catch (error) {
            // Oscillator may already have stopped
        }
    }

    currentIndex = 0;

    document.getElementById("audio-status").textContent =
        "SONIFICATION STOPPED";

    document.getElementById("sound-progress").textContent =
        "Ready to play";

}

document.getElementById("stopButton").addEventListener("click", stopSound);


// 14. VOLUME CONTROL

document.getElementById("volumeControl").addEventListener("input", (event) => {

    if (currentGain && audioContext) {

        currentGain.gain.setTargetAtTime(
            Number(event.target.value),
            audioContext.currentTime,
            0.02
        );

    }

});


// 15. START THE WEBSITE



// 15. START THE WEBSITE

async function initializeWebsite() {
    try {
        await loadChartLibrary();

        const fileInput = document.getElementById("jsonFile");
        const fileStatus = document.getElementById("fileStatus");
        const dataStatus = document.getElementById("data-status");

        if (!fileInput || !fileStatus) {
            throw new Error("Cannot find JSON file input or status element.");
        }

        fileInput.addEventListener("change", async function() {
            const file = fileInput.files[0];

            if (!file) return;

            fileStatus.textContent = "Loading data...";
            dataStatus.textContent = "Reading NASA data...";

            try {
                // 1. Read JSON file
                const text = await file.text();
                const data = JSON.parse(text);

                // 2. Find T2M temperature data
                const parameters = data.properties?.parameter;

                if (!parameters?.T2M) {
                    throw new Error("T2M temperature data not found.");
                }

                const monthlyData = parameters.T2M;

                // 3. Convert JSON into JavaScript array
                temperatureData = Object.entries(monthlyData)
                    .filter(([date, value]) => {
                        const month = Number(date.slice(4, 6));

                        return (
                            /^\d{6}$/.test(date) &&
                            month >= 1 &&
                            month <= 12 &&
                            Number.isFinite(Number(value)) &&
                            Number(value) !== -999
                        );
                    })
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, value]) => ({
                        date: date.slice(0, 4) + "-" + date.slice(4, 6),
                        temperature: Number(value)
                    }));

                if (temperatureData.length === 0) {
                    throw new Error("No valid monthly data found.");
                }

                // 4. Update LOCATION
                    const header =
                        data.properties?.header || data.header || {};

                    const coordinates = data.geometry?.coordinates;

                    const latitude =
                        header.latitude ?? coordinates?.[1];

                    const longitude =
                        header.longitude ?? coordinates?.[0];

                    const locationElement =
                        document.getElementById("locationValue");

                    if (
                        locationElement &&
                        latitude !== undefined &&
                        longitude !== undefined &&
                        Number.isFinite(Number(latitude)) &&
                        Number.isFinite(Number(longitude))
                    ) {
                        // Display coordinates first
                        locationElement.textContent = "Finding location...";

                        // Convert coordinates into a city and country
                        getLocationName(Number(latitude), Number(longitude))
                            .then(locationName => {
                                locationElement.textContent = locationName;
                            });

                    } else if (locationElement) {
                        locationElement.textContent = "Unknown location";
                    }

                // 5. Update TIME RANGE
                const timeElement =
                    document.getElementById("timeRangeValue");

                const firstDate = temperatureData[0].date;
                const lastDate =
                    temperatureData[temperatureData.length - 1].date;

                const startYear = firstDate.slice(0, 4);
                const endYear = lastDate.slice(0, 4);

                if (timeElement) {
                    timeElement.textContent =
                        startYear === endYear
                            ? startYear
                            : `${startYear} – ${endYear}`;
                }

                // 6. Create chart
                createTemperatureChart();

                // 7. Update status
                fileStatus.textContent =
                    `Successfully loaded ${temperatureData.length} records!`;

                dataStatus.textContent =
                    `Loaded ${temperatureData.length} monthly records.`;

                document.getElementById("audio-status").textContent =
                    "READY TO EXPLORE EARTH DATA";

                document.getElementById("sound-progress").textContent =
                    "Ready to play";

                // Reset audio playback for new data
                stopSound();
                document.getElementById("audio-status").textContent =
                "READY TO EXPLORE EARTH DATA";
                console.log("Loaded NASA data:", temperatureData);
            } catch (error) {
                console.error("JSON loading error:", error);

                fileStatus.textContent =
                    "Unable to load data: " + error.message;

                dataStatus.textContent = "Could not load data.";
            }
        });

    } catch (error) {
        console.error("Website initialization error:", error);
    }
}

initializeWebsite();
document.getElementById("xoahetdulieu").addEventListener("click", () => {
    document.getElementById("visualization").scrollIntoView({
        behavior: "smooth"
    });
});
function clearData() {
    stopSound();
    temperatureData.length = 0;
    document.getElementById("jsonFile").value = "";
    document.getElementById("locationValue").textContent =
        "No data";
    document.getElementById("timeRangeValue").textContent =
        "No data";
    document.getElementById("fileStatus").textContent =
        "No file selected";
    document.getElementById("data-status").textContent =
        "Waiting for NASA data...";
    document.getElementById("audio-status").textContent =
        "READY TO EXPLORE EARTH DATA";
    document.getElementById("sound-progress").textContent =
        "Ready to play";
    console.log("NASA data cleared!");
    if (temperatureChart) {
    temperatureChart.destroy();
    temperatureChart = null;
}
}
document.getElementById("xoahetdulieu").addEventListener("click", () => {

    clearData();

    document.getElementById("visualization").scrollIntoView({
        behavior: "smooth"
    });

});
function temperatureToFrequency(temperature) {

    const minTemp = 10;
    const maxTemp = 30;

    const minFrequency = 220;
    const maxFrequency = 660;

    const frequency = Math.max(220, Math.min(660,
        minFrequency +
        ((temperature - minTemp) / (maxTemp - minTemp)) *
        (maxFrequency - minFrequency)
    ));

    return frequency;
}

function playTemperatureSound(temperature) {
    initializeAudio();
    const frequency = temperatureToFrequency(temperature);
    currentOscillator = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    currentGain = audioContext.createGain();
    currentOscillator.type = "triangle";
    currentOscillator.frequency.value = frequency;
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    const now = audioContext.currentTime;
    currentGain.gain.setValueAtTime(0.0001, now);
    currentGain.gain.linearRampToValueAtTime(0.2, now + 0.3);
    currentGain.gain.linearRampToValueAtTime(0.0001, now + 2);
    currentOscillator.connect(filter);
    filter.connect(currentGain);
    currentGain.connect(audioContext.destination);
    currentOscillator.start(now);
    currentOscillator.stop(now + 2);
}

async function getLocationName(latitude, longitude) {

    const url =
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Location request failed");
        }

        const data = await response.json();

        const city =
            data.city ||
            data.locality ||
            data.localityInfo?.administrative?.[0]?.name ||
            "Unknown city";

        const country = data.countryName || "Unknown country";

        return `${city}, ${country}`;

    } catch (error) {
        console.error("Cannot get location:", error);
        return "Location unavailable";
    }
}






