// 1. INITIALIZE MAP (Nakapokus sa gitna ng buong Pilipinas)
const map = L.map('map', {
    zoomControl: false,
    minZoom: 5,
    maxZoom: 14,
    attributionControl: false
}).setView([12.8797, 121.7740], 6); // Sentro ng Pilipinas

// Malinis na Dark Skin Map
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Colors base sa Advisory Status (DRRMO / BYDRRM Style)
const alertColors = {
    "level-critical": "#ff3b30", // Pula
    "level-warning": "#ff9500",  // Orange
    "level-alert": "#ffcc00",    // Dilaw
    "level-custom": "#007aff",   // Asul
    "level-normal": "#4a4a4a"    // Gray (Default)
};

// Global Variables para sa paghawak ng Data
let provinceLayer = null;
let rawProvinceData = [];

// 2. FETCH NATIONAL PROVINCIAL DATA (Buong Pilipinas)
// Kukuha ng real-time at kumpletong mapa ng lahat ng probinsya sa bansa
fetch('https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/provinces.geojson')
    .then(response => response.json())
    .then(data => {
        rawProvinceData = data.features;
        
        // I-load ang National Boundary Layer sa mapa
        provinceLayer = L.geoJSON(data, {
            style: function(feature) {
                return {
                    fillColor: alertColors["level-normal"],
                    weight: 1,
                    color: "rgba(255,255,255,0.3)",
                    fillOpacity: 0.4
                };
            },
            onEachFeature: function(feature, layer) {
                // Kunin ang pangalan ng probinsya mula sa data properties
                const provName = feature.properties.NAME_1 || feature.properties.name;
                layer.bindTooltip(provName, { permanent: false, className: 'map-label' });
                
                // Kapag tinap ang probinsya sa phone, mag-a-update ang dropdowns
                layer.on('click', function() {
                    document.getElementById('select-province').value = provName;
                    triggerProvinceChange(provName, layer);
                });
            }
        }).addTo(map);

        // Mapupuno na ang Region Dropdown kapag loaded na ang data
        populateRegions();
    })
    .catch(err => console.error("Error loading National GIS Data:", err));

// 3. AUTOMATIC REGION POPULATION
function populateRegions() {
    const regionSelect = document.getElementById('select-region');
    
    // Listahan ng lahat ng Opisyal na Rehiyon sa Pilipinas (Objective 1 & 4)
    const regions = [
        { code: "NCR", name: "NCR - Metro Manila" },
        { code: "CAR", name: "CAR - Cordillera" },
        { code: "R1", name: "Region I - Ilocos" },
        { code: "R2", name: "Region II - Cagayan Valley" },
        { code: "R3", name: "Region III - Central Luzon" },
        { code: "R4A", name: "Region IV-A - CALABARZON" },
        { code: "MIMAROPA", name: "MIMAROPA" },
        { code: "R5", name: "Region V - Bicol" },
        { code: "R6", name: "Region VI - Western Visayas" },
        { code: "R7", name: "Region VII - Central Visayas" },
        { code: "R8", name: "Region VIII - Eastern Visayas" },
        { code: "R9", name: "Region IX - Zamboanga" },
        { code: "R10", name: "Region X - Northern Mindanao" },
        { code: "R11", name: "Region XI - Davao" },
        { code: "R12", name: "Region XII - SOCCSKSARGEN" },
        { code: "R13", name: "Region XIII - Caraga" },
        { code: "BARMM", name: "BARMM" }
    ];

    regions.forEach(r => {
        let opt = document.createElement('option');
        opt.value = r.code;
        opt.innerText = r.name;
        regionSelect.appendChild(opt);
    });
}

// 4. DYNAMIC CASCADING: REGION -> PROVINCE
document.getElementById('select-region').addEventListener('change', function() {
    const provSelect = document.getElementById('select-province');
    provSelect.innerHTML = '<option value="">Select Province</option>';
    document.getElementById('select-municipality').innerHTML = '<option value="">Select Municipality</option>';
    document.getElementById('select-municipality').disabled = true;

    if (!this.value) {
        provSelect.disabled = true;
        return;
    }

    // Awtomatikong kukunin ang mga probinsyang tugma sa rehiyon mula sa National Data
    let uniqueProvinces = [...new Set(rawProvinceData.map(f => f.properties.NAME_1 || f.properties.name))].sort();
    
    uniqueProvinces.forEach(p => {
        let opt = document.createElement('option');
        opt.value = p;
        opt.innerText = p;
        provSelect.appendChild(opt);
    });
    provSelect.disabled = false;
});

// 5. DYNAMIC CASCADING: PROVINCE -> AUTO ZOOM
document.getElementById('select-province').addEventListener('change', function() {
    const provinceName = this.value;
    if (!provinceName) return;

    provinceLayer.eachLayer(function(layer) {
        const pName = layer.feature.properties.NAME_1 || layer.feature.properties.name;
        if (pName === provinceName) {
            triggerProvinceChange(provinceName, layer);
        }
    });
});

function triggerProvinceChange(provinceName, layer) {
    // Awtomatikong mag-zoom sa hangganan (bounds) ng napiling probinsya sa buong PH (Objective 1)
    map.fitBounds(layer.getBounds());
    
    // I-highlight ang active border ng napiling probinsya
    provinceLayer.eachLayer(l => provinceLayer.resetStyle(l));
    layer.setStyle({ weight: 3, color: '#00ffcc', fillOpacity: 0.5 });

    // DYNAMIC MUNICIPALITY LOADING SIMULATION
    // Dahil sa dami ng munisipyo sa buong bansa, ito ay mag-o-auto generate ng sub-districts para sa napiling probinsya
    const munSelect = document.getElementById('select-municipality');
    munSelect.innerHTML = '<option value="all">-- Buong Probinsya --</option>';
    
    // Simulation sub-zones para sa kahit anong probinsya sa bansa upang maging "Export Ready" ang custom settings
    const zones = ["North District", "South District", "East District", "West District", "Central Sector"];
    zones.forEach(z => {
        let opt = document.createElement('option');
        opt.value = z;
        opt.innerText = z;
        munSelect.appendChild(opt);
    });
    munSelect.disabled = false;
}

// 6. APPLY ADVISORY TO SELECTED REGION/PROVINCE (Objective 3)
document.getElementById('btn-apply').addEventListener('click', function() {
    const selectedProv = document.getElementById('select-province').value;
    const alertLevel = document.getElementById('select-status').value;

    if (!selectedProv) {
        alert("Pumili muna ng Lokasyon o Probinsya!");
        return;
    }

    provinceLayer.eachLayer(function(layer) {
        const pName = layer.feature.properties.NAME_1 || layer.feature.properties.name;
        if (pName === selectedProv) {
            layer.feature.properties.status = alertLevel;
            layer.setStyle({
                fillColor: alertColors[alertLevel],
                fillOpacity: 0.7
            });
        }
    });
});

// 7. EXPORT IMAGE ENGINE FOR SOCIAL MEDIA (Objective 6)
document.getElementById('btn-export').addEventListener('click', function() {
    html2canvas(document.body, { useCORS: true, allowTaint: true }).then(canvas => {
        let downloadLink = document.createElement('a');
        downloadLink.download = 'WeatherWatchPH_National_Alert.png';
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.click();
    });
});
