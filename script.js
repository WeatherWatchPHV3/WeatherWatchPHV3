// ==========================================
// 1. INITIALIZE MAP (Buong Pilipinas View)
// ==========================================
const map = L.map('map', {
    zoomControl: false,
    minZoom: 5,
    maxZoom: 15,
    attributionControl: false
}).setView([12.8797, 121.7740], 6);

// OpenStreetMap Standard Map (gaya ng gamit mo)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Global layers & state
let geojsonLayer;
let selectedColor = "#ff0000";

// Color picker listener
document.getElementById("colorPicker").addEventListener("input", function () {
    selectedColor = this.value;
});

// ==========================================
// 2. REGIONAL DATABASE FOR THE DROPDOWNS
// ==========================================
const phRegionsAndProvinces = {
    "NCR": ["Metro Manila"],
    "CAR": ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province"],
    "Region I": ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
    "Region II": ["Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"],
    "Region III": ["Aurora", "Bataan", "Bulacan", "Nueva Ecija", "Pampanga", "Tarlac", "Zambales"],
    "Region IV-A": ["Batangas", "Cavite", "Laguna", "Quezon", "Rizal"],
    "MIMAROPA": ["Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon"],
    "Region V": ["Albay", "Camarines Norte", "Camarines Sur", "Catanduanes", "Masbate", "Sorsogon"],
    "Region VI": ["Aklan", "Antique", "Capiz", "Guimaras", "Iloilo", "Negros Occidental"],
    "Region VII": ["Bohol", "Cebu", "Negros Oriental", "Siquijor"],
    "Region VIII": ["Biliran", "Eastern Samar", "Leyte", "Northern Samar", "Samar", "Southern Leyte"],
    "Region IX": ["Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay"],
    "Region X": ["Bukidnon", "Camiguin", "Lanao del Norte", "Misamis Occidental", "Misamis Oriental"],
    "Region XI": ["Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental"],
    "Region XII": ["Cotabato", "Sarangani", "South Cotabato", "Sultan Kudarat"],
    "Region XIII": ["Agusan del Norte", "Agusan del Sur", "Dinagat Islands", "Surigao del Norte", "Surigao del Sur"],
    "BARMM": ["Basilan", "Lanao del Sur", "Maguindanao del Norte", "Maguindanao del Sur", "Sulu", "Tawi-Tawi"]
};

const regionSelect = document.getElementById('region');
const provinceSelect = document.getElementById('province');
const municipalitySelect = document.getElementById('municipality');

// Kusa nitong pupunuin ang Region Dropdown sa umpisa
for (let region in phRegionsAndProvinces) {
    let opt = document.createElement('option');
    opt.value = region;
    opt.innerText = region;
    regionSelect.appendChild(opt);
}

// ==========================================
// 3. CASCADING REGION TO PROVINCE
// ==========================================
regionSelect.addEventListener('change', function() {
    const selectedRegion = this.value;
    provinceSelect.innerHTML = '<option>Select Province</option>';
    municipalitySelect.innerHTML = '<option>Select Municipality</option>';

    if (selectedRegion === "Select Region" || !phRegionsAndProvinces[selectedRegion]) return;

    phRegionsAndProvinces[selectedRegion].forEach(prov => {
        let opt = document.createElement('option');
        opt.value = prov;
        opt.innerText = prov;
        provinceSelect.appendChild(opt);
    });
});

// ==========================================
// 4. ON-DEMAND DYNAMIC FETCHING
// ==========================================
provinceSelect.addEventListener('change', function() {
    const selectedProvince = this.value;
    municipalitySelect.innerHTML = '<option>Select Municipality</option>';

    if (selectedProvince === "Select Province") return;

    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }

    const formattedProvName = selectedProvince.toLowerCase()
        .replace(/\./g, '')
        .replace(/\s+/g, '-');

    const geoJsonUrl = `https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/municipalities/${formattedProvName}.geojson`;

    fetch(geoJsonUrl)
    .then(response => {
        if (!response.ok) throw new Error("Cannot load GeoJSON.");
        return response.json();
    })
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: function () {
                return {
                    color: "#ffffff",
                    weight: 1,
                    fillColor: "#808080",
                    fillOpacity: 0.8
                };
            },
            onEachFeature: function (feature, layer) {
                const municipality =
                    feature.properties.ADM3_EN ||
                    feature.properties.NAME_2 ||
                    feature.properties.NAME ||
                    feature.properties.name ||
                    "Municipality";

                layer.bindTooltip(municipality, { permanent: false, className: 'map-label' });

                // Hover Effects (Gaya ng orihinal mong code!)
                layer.on("mouseover", function () {
                    layer.setStyle({
                        weight: 3,
                        color: "#000000"
                    });
                });

                layer.on("mouseout", function () {
                    geojsonLayer.resetStyle(layer);
                });

                // Click-to-Color Logic
                layer.on("click", function () {
                    layer.setStyle({
                        fillColor: selectedColor,
                        fillOpacity: 0.9
                    });

                    layer.bindPopup("<b>" + municipality + "</b>").openPopup();
                    municipalitySelect.value = municipality;
                });
            }
        }).addTo(map);

        // Kusa nitong i-zo-zoom ang map sa boundaries ng piniling probinsya
        map.fitBounds(geojsonLayer.getBounds());

        // Dynamic Loading ng Municipalities sa Dropdown list
        const cleanMunList = data.features.map(f => {
            return f.properties.ADM3_EN || f.properties.NAME_2 || f.properties.NAME || f.properties.name || "Municipality";
        }).sort();

        cleanMunList.forEach(mun => {
            let opt = document.createElement('option');
            opt.value = mun;
            opt.innerText = mun;
            municipalitySelect.appendChild(opt);
        });
    })
    .catch(error => {
        console.error(error);
        alert("Failed to load map data for " + selectedProvince);
    });
});

// ==========================================
// 5. MANUAL APPLY BUTTON CLICK
// ==========================================
document.getElementById('applyBtn').addEventListener('click', function() {
    const selectedMun = municipalitySelect.value;
    
    if (selectedMun === "Select Municipality" || !geojsonLayer) {
        alert("Paki-pili muna ang Munisipyo.");
        return;
    }

    geojsonLayer.eachLayer(function(layer) {
        const currentMunName = layer.feature.properties.ADM3_EN || layer.feature.properties.NAME_2 || layer.feature.properties.NAME || layer.feature.properties.name;
        if (currentMunName === selectedMun) {
            layer.setStyle({
                fillColor: selectedColor,
                fillOpacity: 0.9
            });
        }
    });
});

// ==========================================
// 6. GENERATE PNG FUNCTION
// ==========================================
document.getElementById("downloadBtn").addEventListener("click", function () {
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = () => captureScreen();
        document.head.appendChild(script);
    } else {
        captureScreen();
    }

    function captureScreen() {
        html2canvas(document.body, { useCORS: true, allowTaint: true }).then(canvas => {
            let link = document.createElement('a');
            link.download = 'WeatherWatchPH_Advisory.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
});
