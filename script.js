// ========================
// CREATE MAP (Buong Pilipinas sa simula)
// ========================
const map = L.map('map').setView([12.8797, 121.7740], 6);

// ========================
// BASE MAP
// ========================
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// ========================
// SELECTED COLOR
// ========================
let selectedColor = "#ff0000";

document.getElementById("colorPicker").addEventListener("input", function () {
    selectedColor = this.value;
});

// Gagamitin natin ito para hawakan ang active map layer
let geojsonLayer;

// ==========================================
// DATA DICTIONARY (Para sa Cascading Dropdowns ng index.html mo)
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

// Kumuha ng references sa iyong dropdowns mula sa HTML
const regionSelect = document.getElementById('region');
const provinceSelect = document.getElementById('province');
const municipalitySelect = document.getElementById('municipality');

// Awtomatikong punuin ang Region Dropdown pagka-load ng page
for (let region in phRegionsAndProvinces) {
    let opt = document.createElement('option');
    opt.value = region;
    opt.innerText = region;
    regionSelect.appendChild(opt);
}

// ==========================================
// CASCADING LOGIC (Region -> Province)
// ==========================================
regionSelect.addEventListener('change', function() {
    const selectedRegion = this.value;
    
    // I-reset ang mga sumunod na dropdowns
    provinceSelect.innerHTML = '<option>Select Province</option>';
    municipalitySelect.innerHTML = '<option>Select Municipality</option>';

    if (selectedRegion === "Select Region" || !phRegionsAndProvinces[selectedRegion]) return;

    // Punuin ang listahan ng mga probinsya
    phRegionsAndProvinces[selectedRegion].forEach(prov => {
        let opt = document.createElement('option');
        opt.value = prov;
        opt.innerText = prov;
        provinceSelect.appendChild(opt);
    });
});

// ==========================================
// DYNAMIC GEOJSON FETCH (Province -> Load Municipalities)
// ==========================================
provinceSelect.addEventListener('change', function() {
    const selectedProvince = this.value;
    municipalitySelect.innerHTML = '<option>Select Municipality</option>';

    if (selectedProvince === "Select Province") return;

    // Alisin ang lumang layer bago magkarga ng bago
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }

    // I-format ang pangalan ng probinsya para sa URL (hal. "Davao del Sur" -> "davao-del-sur")
    const formattedProvName = selectedProvince.toLowerCase()
        .replace(/\./g, '')
        .replace(/\s+/g, '-');

    // Kunin ang mapa mula sa maaasahang online repository (Dynamic Fetching)
    const geoJsonUrl = `https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/municipalities/${formattedProvName}.geojson`;

    fetch(geoJsonUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error("Cannot load GeoJSON.");
        }
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

                // Hover Action gaya ng orihinal mong gawa
                layer.on("mouseover", function () {
                    layer.setStyle({
                        weight: 3,
                        color: "#000000"
                    });
                });

                layer.on("mouseout", function () {
                    geojsonLayer.resetStyle(layer);
                });

                // Click Action (Coloring base sa color picker at selection)
                layer.on("click", function () {
                    layer.setStyle({
                        fillColor: selectedColor,
                        fillOpacity: 0.9
                    });

                    layer.bindPopup("<b>" + municipality + "</b>").openPopup();
                    
                    // Awtomatikong piliin ang munisipyong ito sa Dropdown ng HTML mo
                    municipalitySelect.value = municipality;
                });

            }

        }).addTo(map);

        // Kusa nitong itututok at i-zo-zoom ang mapa sa napiling probinsya!
        map.fitBounds(geojsonLayer.getBounds());

        // Punuin ang Municipality Dropdown gamit ang mga pangalan mula sa kaka-load lang na GeoJSON
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
        alert("Failed to load GeoJSON file for " + selectedProvince);
    });
});

// ==========================================
// APPLY BUTTON (Para sa Manu-manong Pag-pili sa Sidebar)
// ==========================================
document.getElementById('applyBtn').addEventListener('click', function() {
    const selectedMun = municipalitySelect.value;
    
    if (selectedMun === "Select Municipality" || !geojsonLayer) {
        alert("Pumili muna ng Munisipyo!");
        return;
    }

    // Hanapin ang polygon sa mapa at pintahan gamit ang napiling colorPicker
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

// ========================
// DOWNLOAD PNG (Pinalitan natin para maging totoo nang image download)
// ========================
document.getElementById("downloadBtn").addEventListener("click", function () {
    // Kung gusto mo pa rin ng print option ng browser:
    // window.print();

    // Pero kung gusto mo ng totoong PNG export, mag-load tayo ng library live at i-save ang screen:
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
