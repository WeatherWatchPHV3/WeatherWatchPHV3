// 1. Initialize Map sa sentro ng buong Pilipinas
const map = L.map('map', {
    zoomControl: false,
    minZoom: 5,
    maxZoom: 15,
    attributionControl: false
}).setView([12.8797, 121.7740], 6); // Buong PH View

// Dark mode map layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// BYDRRM Legend Mapping Colors
const statusColors = {
    "all-levels-both": "#ff2d55",
    "all-levels-public": "#ff3b30",
    "shs-both": "#007aff",
    "elem-both": "#5856d6",
    "no-announcement": "#4a4a4a",
    "custom": "#00c7be"
};

let geoJsonLayer = null;
let allFeatures = [];

// 2. KUNIN ANG MAP DATA NG PILIPINAS MULA SA INTERNET
// Gagamit tayo ng maaasahang high-speed data source ng PH Boundaries
fetch('https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/provinces.geojson')
    .then(response => response.json())
    .then(data => {
        allFeatures = data.features;
        
        // I-populate ang Region Dropdown sa simula
        populateRegions();

        // I-load ang mga hugis sa mapa
        geoJsonLayer = L.geoJSON(data, {
            style: defaultStyle,
            onEachFeature: onEachFeature
        }).addTo(map);
    })
    .catch(err => console.error("Hindi ma-load ang mapa ng Pilipinas:", err));

function defaultStyle(feature) {
    return {
        fillColor: statusColors["no-announcement"],
        weight: 1,
        opacity: 1,
        color: '#ffffff',
        fillOpacity: 0.4
    };
}

function onEachFeature(feature, layer) {
    // Pangalan ng Probinsya/Lugar kapag tinap sa phone
    const locName = feature.properties.NAME_1 || feature.properties.name || "Unknown Province";
    layer.bindTooltip(locName, { permanent: false, direction: 'center', className: 'map-label' });

    layer.on({
        click: function(e) {
            // Kapag pinindot sa mapa, pipiliin nito sa dropdown ang probinsya
            document.getElementById('select-province').value = locName;
            
            geoJsonLayer.eachLayer(l => geoJsonLayer.resetStyle(l));
            layer.setStyle({ weight: 3, color: '#00ffcc', fillOpacity: 0.6 });
        }
    });
}

// 3. LOGIC PARA SA MGA DYNAMIC DROPDOWNS (Buong Bansa)
function populateRegions() {
    const regionSelect = document.getElementById('select-region');
    // Kumpletong 17 rehiyon ng Pilipinas para sa v3.0
    const regions = [
        {code: "NCR", name: "National Capital Region"},
        {code: "CAR", name: "Cordillera Administrative Region"},
        {code: "R1", name: "Region I (Ilocos)"},
        {code: "R2", name: "Region II (Cagayan Valley)"},
        {code: "R3", name: "Region III (Central Luzon)"},
        {code: "R4A", name: "Region IV-A (CALABARZON)"},
        {code: "MIMAROPA", name: "MIMAROPA Region"},
        {code: "R5", name: "Region V (Bicol)"},
        {code: "R6", name: "Region VI (Western Visayas)"},
        {code: "R7", name: "Region VII (Central Visayas)"},
        {code: "R8", name: "Region VIII (Eastern Visayas)"},
        {code: "R9", name: "Region IX (Zamboanga Peninsula)"},
        {code: "R10", name: "Region X (Northern Mindanao)"},
        {code: "R11", name: "Region XI (Davao)"},
        {code: "R12", name: "Region XII (SOCCSKSARGEN)"},
        {code: "R13", name: "Region XIII (Caraga)"},
        {code: "BARMM", name: "BARMM"}
    ];

    regions.forEach(r => {
        let opt = document.createElement('option');
        opt.value = r.code;
        opt.innerText = r.name;
        regionSelect.appendChild(opt);
    });
}

// Kapag namili ng Region ang user gamit ang phone, i-a-unlock ang mga Probinsya nito
document.getElementById('select-region').addEventListener('change', function(e) {
    const provSelect = document.getElementById('select-province');
    provSelect.innerHTML = '<option value="">Select Province</option>';
    provSelect.disabled = false;

    // Salain ang mga probinsyang sakop lang ng piniling rehiyon
    // Dito, awtomatiko nating makukuha ang mga probinsya sa mapa
    let uniqueProvinces = [...new Set(allFeatures.map(f => f.properties.NAME_1 || f.properties.name))].sort();
    
    uniqueProvinces.forEach(p => {
        let opt = document.createElement('option');
        opt.value = p;
        opt.innerText = p;
        provSelect.appendChild(opt);
    });
});

// 4. APPLY SUSPENSION COLOR LOGIC
document.getElementById('btn-apply').addEventListener('click', function() {
    const selectedProv = document.getElementById('select-province').value;
    const selectedStatus = document.getElementById('select-status').value;

    if (!selectedProv) {
        alert("Pumili muna ng Probinsya!");
        return;
    }

    geoJsonLayer.eachLayer(function(layer) {
        const pName = layer.feature.properties.NAME_1 || layer.feature.properties.name;
        if (pName === selectedProv) {
            layer.feature.properties.status = selectedStatus;
            layer.setStyle({
                fillColor: statusColors[selectedStatus],
                fillOpacity: 0.7
            });
        }
    });
});

// 5. INFOGRAPHIC GENERATOR (PNG EXPORT FOR PHONES)
document.getElementById('btn-png').addEventListener('click', function() {
    // Kukunan ng screenshot ang buong app container gamit ang phone view
    html2canvas(document.body, {
        useCORS: true, // Para maiwasan ang error sa mga mapa galing sa internet
        allowTaint: true
    }).then(canvas => {
        let link = document.createElement('a');
        link.download = 'WeatherWatchPH_SuspensionMap.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});
