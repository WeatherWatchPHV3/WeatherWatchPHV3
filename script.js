// ==========================================
// 1. INITIALIZE MAP (Buong Pilipinas View)
// ==========================================
const map = L.map('map', {
    zoomControl: false,
    minZoom: 5,
    maxZoom: 15
}).setView([12.8797, 121.7740], 6);

// BASE MAP
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Global layers & state
let geojsonLayer = null;
let selectedColor = "#ff0000";

// Color picker listener
document.getElementById("colorPicker").addEventListener("input", function () {
    selectedColor = this.value;
});

// ==========================================
// 2. REGIONAL AT PROVINCIAL DICTIONARY
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

// Punuin ang Region Selector
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
    provinceSelect.innerHTML = '<option value="">Select Province</option>';
    municipalitySelect.innerHTML = '<option value="">Select Municipality</option>';

    if (!selectedRegion || !phRegionsAndProvinces[selectedRegion]) return;

    phRegionsAndProvinces[selectedRegion].forEach(prov => {
        let opt = document.createElement('option');
        opt.value = prov;
        opt.innerText = prov;
        provinceSelect.appendChild(opt);
    });
});

// ==========================================
// 4. HIGH-RESOLUTION DYNAMIC MAP LOADER
// ==========================================
provinceSelect.addEventListener('change', function() {
    const selectedProvince = this.value;
    municipalitySelect.innerHTML = '<option value="">Select Municipality</option>';

    if (!selectedProvince) return;

    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }

    // Pag-format ng pangalan ng file para mag-match sa bagong high-res API (e.g., "Bulacan" -> "bulacan")
    const formattedProvName = selectedProvince.toLowerCase()
        .replace(/\./g, '')
        .replace(/\s+/g, '-');

    // HIGH-RES SOURCE URL (Para makinis at pulido ang mga gilid ng bayan)
    const geoJsonUrl = `https://raw.githubusercontent.com/f-andres/philippines-geojson/master/geojson/municities/by-province/municities-province-${formattedProvName}.geojson`;

    fetch(geoJsonUrl)
    .then(response => {
        if (!response.ok) throw new Error("Cannot load GeoJSON.");
        return response.json();
    })
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: {
                color: "rgba(255, 255, 255, 0.4)", // Pinalambot na border style
                weight: 0.8,
                fillColor: "#808080",
                fillOpacity: 0.8
            },
            onEachFeature: function (feature, layer) {
                const municipality =
                    feature.properties.NAME_2 ||
                    feature.properties.name ||
                    "Municipality";

                // HOVER EFFECTS
                layer.on("mouseover", function () {
                    layer.setStyle({
                        weight: 2.5,
                        color: "#000000"
                    });
                });

                layer.on("mouseout", function () {
                    layer.setStyle({
                        weight: 0.8,
                        color: "rgba(255, 255, 255, 0.4)"
                    });
                });

                // CLICK TO COLOR
                layer.on("click", function () {
                    layer.setStyle({
                        fillColor: selectedColor
                    });

                    layer.bindPopup("<b>" + municipality + "</b>").openPopup();
                    municipalitySelect.value = municipality;
                });
            }
        }).addTo(map);

        // Awtomatikong zoom focus sa probinsya
        map.fitBounds(geojsonLayer.getBounds());

        // Punuin ang dropdown list ng mga bayan
        const cleanMunList = data.features.map(f => f.properties.NAME_2 || f.properties.name).sort();
        cleanMunList.forEach(mun => {
            let opt = document.createElement('option');
            opt.value = mun;
            opt.innerText = mun;
            municipalitySelect.appendChild(opt);
        });
    })
    .catch(error => {
        console.error("Error loading high-res GeoJSON:", error);
        alert("Failed to load smooth map data for " + selectedProvince);
    });
});

// ==========================================
// 5. SIDEBAR APPLY BUTTON ACTION
// ==========================================
document.getElementById('applyBtn').addEventListener('click', function() {
    const selectedMun = municipalitySelect.value;
    
    if (!selectedMun || !geojsonLayer) {
        alert("Paki-pili muna ang Munisipyo.");
        return;
    }

    geojsonLayer.eachLayer(function(layer) {
        const currentMunName = layer.feature.properties.NAME_2 || layer.feature.properties.name;
        if (currentMunName === selectedMun) {
            layer.setStyle({
                fillColor: selectedColor,
                fillOpacity: 0.9
            });
        }
    });
});

// ==========================================
// 6. GENERATE PNG ADVISORY IMAGE
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
        const btn = document.getElementById("downloadBtn");
        btn.innerText = "Generating...";

        html2canvas(document.body, { useCORS: true, allowTaint: true }).then(canvas => {
            let link = document.createElement('a');
            link.download = 'WeatherWatchPH_Advisory.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            btn.innerText = "Generate PNG";
        });
    }
});
