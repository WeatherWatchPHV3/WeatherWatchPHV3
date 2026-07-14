// ==========================================
// 1. INITIALIZE MAP (Buong Pilipinas View)
// ==========================================
const map = L.map('map', {
    zoomControl: false,
    minZoom: 5,
    maxZoom: 15,
    attributionControl: false
}).setView([12.8797, 121.7740], 6);

// Dark mode map theme para lutang ang kulay ng mga alerto
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Global state controller
let currentMunicipalLayer = null;

// ==========================================
// 2. DATA DICTIONARY (17 Regions & 82 Provinces)
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

// ==========================================
// 3. POPULATE INITIAL DROPDOWNS
// ==========================================
const regionSelect = document.getElementById('region');
const provinceSelect = document.getElementById('province');
const municipalitySelect = document.getElementById('municipality');

// Kusa nitong pupunuin ang Region dropdown pagkabukas ng website
for (let region in phRegionsAndProvinces) {
    let opt = document.createElement('option');
    opt.value = region;
    opt.innerText = region;
    regionSelect.appendChild(opt);
}

// ==========================================
// 4. CASCADING LOGIC (Region -> Province)
// ==========================================
regionSelect.addEventListener('change', function() {
    const selectedRegion = this.value;
    
    // I-reset at linisin ang mga kasunod na dropdowns
    provinceSelect.innerHTML = '<option>Select Province</option>';
    municipalitySelect.innerHTML = '<option>Select Municipality</option>';

    if (selectedRegion === "Select Region" || !phRegionsAndProvinces[selectedRegion]) return;

    // Punuin ang Province dropdown base sa piniling rehiyon
    phRegionsAndProvinces[selectedRegion].forEach(prov => {
        let opt = document.createElement('option');
        opt.value = prov;
        opt.innerText = prov;
        provinceSelect.appendChild(opt);
    });
});

// ==========================================
// 5. ON-DEMAND GIS PIPELINE (Province -> Municipality)
// ==========================================
provinceSelect.addEventListener('change', function() {
    const selectedProvince = this.value;
    municipalitySelect.innerHTML = '<option>Select Municipality</option>';

    if (selectedProvince === "Select Province") return;

    // Linisin ang lumang layer sa mapa bago magkarga ng bago
    if (currentMunicipalLayer) {
        map.removeLayer(currentMunicipalLayer);
    }

    // I-format ang pangalan para tumugma sa open-source API structure (e.g., "Davao del Sur" -> "davao-del-sur")
    const formattedProvName = selectedProvince.toLowerCase()
        .replace(/\./g, '')
        .replace(/\s+/g, '-');

    const geoJsonUrl = `https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/municipalities/${formattedProvName}.geojson`;

    // Kunin ang mapa mula sa internet on-demand
    fetch(geoJsonUrl)
        .then(response => {
            if (!response.ok) throw new Error("Hindi mahanap ang file ng probinsyang ito.");
            return response.json();
        })
        .then(data => {
            // I-render ang mga borders ng bayan/lungsod sa mapa
            currentMunicipalLayer = L.geoJSON(data, {
                style: function() {
                    return {
                        fillColor: "#4a4a4a", // Default/No Advisory background
                        weight: 1.2,
                        opacity: 1,
                        color: "rgba(255, 255, 255, 0.4)",
                        fillOpacity: 0.5
                    };
                },
                onEachFeature: function(feature, layer) {
                    const munName = feature.properties.NAME_2 || feature.properties.name || "Unknown";
                    
                    // Kapag itinapat ang cursor o tinap sa phone, lalabas ang pangalan ng bayan
                    layer.bindTooltip(munName, { permanent: false, direction: 'center' });

                    // Map Interaction Listener: Kapag tinap ang bayan sa mapa, kusa itong pipiliin sa dropdown
                    layer.on('click', function() {
                        municipalitySelect.value = munName;
                        
                        // Bahagyang i-highlight ang aktibong bayan
                        currentMunicipalLayer.eachLayer(l => currentMunicipalLayer.resetStyle(l));
                        layer.setStyle({ weight: 2.5, color: '#00ffcc', fillOpacity: 0.6 });
                    });
                }
            }).addTo(map);

            // Awtomatikong i-zoom at ipokus ang mapa sa boundaries ng probinsya
            map.fitBounds(currentMunicipalLayer.getBounds());

            // Punuin ang Municipality selector gamit ang mga totoong pangalan mula sa JSON data
            const cleanMunList = data.features.map(f => f.properties.NAME_2 || f.properties.name).sort();
            cleanMunList.forEach(mun => {
                let opt = document.createElement('option');
                opt.value = mun;
                opt.innerText = mun;
                municipalitySelect.appendChild(opt);
            });
        })
        .catch(err => {
            console.error(err);
            alert("Paumanhin, hindi maikarga ang mapa para sa probinsyang ito. Pakisuri ang internet connection.");
        });
});

// ==========================================
// 6. ADVISORY COLOR CONTROLLER
// ==========================================
document.getElementById('applyBtn').addEventListener('click', function() {
    const selectedMun = municipalitySelect.value;
    const pickedColor = document.getElementById('colorPicker').value;

    if (selectedMun === "Select Municipality" || !currentMunicipalLayer) {
        alert("Mangyaring pumili muna ng Munisipyo sa listahan o sa mapa.");
        return;
    }

    // Hanapin ang hugis sa mapa at baguhin ang kulay base sa colorPicker
    currentMunicipalLayer.eachLayer(function(layer) {
        const currentMunName = layer.feature.properties.NAME_2 || layer.feature.properties.name;
        if (currentMunName === selectedMun) {
            layer.setStyle({
                fillColor: pickedColor,
                fillOpacity: 0.75
            });
        }
    });
});

// ==========================================
// 7. PNG IMAGE GENERATOR FOR SOCIAL MEDIA
// ==========================================
document.getElementById('downloadBtn').addEventListener('click', function() {
    // Sisiguraduhin natin na kasama ang html2canvas library sa HTML para gumana ito.
    // Dahil phone ang gamit mo, mag-i-inject tayo ng temporary script wrapper kung sakaling wala pa ito sa HTML mo
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = () => executeCapture();
        document.head.appendChild(script);
    } else {
        executeCapture();
    }

    function executeCapture() {
        const originalText = document.getElementById('downloadBtn').innerText;
        document.getElementById('downloadBtn').innerText = "Generating...";

        html2canvas(document.body, {
            useCORS: true,
            allowTaint: true
        }).then(canvas => {
            let link = document.createElement('a');
            link.download = 'WeatherWatchPH_Infographic.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            document.getElementById('downloadBtn').innerText = originalText;
        });
    }
});
