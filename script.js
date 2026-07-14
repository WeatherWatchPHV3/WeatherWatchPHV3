// 1. Initialize Map targeting the Philippines
const map = L.map('map', {
    zoomControl: false,
    minZoom: 5,
    maxZoom: 15,
    attributionControl: false
}).setView([14.95, 120.90], 9); // Naka-focus sa Central Luzon/NCR axis para sa visual testing

// Disaster Command Center Dark Map Skin
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Color Hex Codes Base Map para sa Core Module 3 (Geographic Visualization)
const alertColors = {
    "level-critical": "#ff3b30", // Red
    "level-warning": "#ff9500",  // Orange
    "level-alert": "#ffcc00",    // Yellow
    "level-custom": "#007aff",   // Blue
    "level-normal": "#4a4a4a"    // Dark Gray (Default Background)
};

// 2. DATA DICTIONARY PARA SA MODULE 4 (Cascading Selection Simulation Data)
const geoDataRepository = {
    "r3": {
        name: "Region III (Central Luzon)",
        provinces: {
            "bulacan": {
                name: "Bulacan",
                center: [14.95, 121.00],
                zoom: 10,
                municipalities: ["Malolos", "Hagonoy", "Calumpit", "Paombong", "San Miguel"]
            },
            "pampanga": {
                name: "Pampanga",
                center: [15.05, 120.65],
                zoom: 10,
                municipalities: ["San Fernando", "Angeles", "Guagua", "Lubao"]
            }
        }
    },
    "ncr": {
        name: "NCR (National Capital Region)",
        provinces: {
            "metro-manila": {
                name: "Metro Manila",
                center: [14.5995, 120.9842],
                zoom: 11,
                municipalities: ["Manila", "Quezon City", "Pasig", "Taguig", "Makati"]
            }
        }
    }
};

// Lumikha ng Target Vector Shapes para sa Pagpapakita ng Advisory sa Mapa
const localBoundaries = {
    "type": "FeatureCollection",
    "features": [
        { "type": "Feature", "properties": { "name": "Hagonoy", "parent": "bulacan", "status": "level-normal" }, "geometry": { "type": "Polygon", "coordinates": [[[120.65, 14.80], [120.75, 14.80], [120.75, 14.88], [120.65, 14.88], [120.65, 14.80]]] } },
        { "type": "Feature", "properties": { "name": "Calumpit", "parent": "bulacan", "status": "level-normal" }, "geometry": { "type": "Polygon", "coordinates": [[[120.65, 14.88], [120.75, 14.88], [120.75, 14.96], [120.65, 14.96], [120.65, 14.88]]] } },
        { "type": "Feature", "properties": { "name": "Paombong", "parent": "bulacan", "status": "level-normal" }, "geometry": { "type": "Polygon", "coordinates": [[[120.75, 14.80], [120.82, 14.80], [120.82, 14.88], [120.75, 14.88], [120.75, 14.80]]] } },
        { "type": "Feature", "properties": { "name": "Malolos", "parent": "bulacan", "status": "level-normal" }, "geometry": { "type": "Polygon", "coordinates": [[[120.82, 14.80], [120.92, 14.80], [120.92, 14.88], [120.82, 14.88], [120.82, 14.80]]] } }
    ]
};

// Style Controller Engine
function styleEngine(feature) {
    return {
        fillColor: alertColors[feature.properties.status],
        weight: 1.5,
        opacity: 1,
        color: '#ffffff',
        fillOpacity: 0.6
    };
}

// Render dynamic vectors to the GIS plane
const geoJsonLayer = L.geoJSON(localBoundaries, {
    style: styleEngine,
    onEachFeature: function(feature, layer) {
        layer.bindTooltip(feature.properties.name, { permanent: true, direction: 'center', className: 'map-label' });
        
        // Map Click Event Listener (Objective 1)
        layer.on('click', function() {
            document.getElementById('select-municipality').value = feature.properties.name;
            geoJsonLayer.eachLayer(l => geoJsonLayer.resetStyle(l));
            layer.setStyle({ weight: 3, color: '#00ffcc' });
        });
    }
}).addTo(map);

// 3. CASCADING ENGINE IMPLEMENTATION (Objective 4: Region -> Province -> Municipality)
const regionSelect = document.getElementById('select-region');
const provinceSelect = document.getElementById('select-province');
const municipalitySelect = document.getElementById('select-municipality');

regionSelect.addEventListener('change', function() {
    const selectedRegion = this.value;
    provinceSelect.innerHTML = '<option value="">Select Province</option>';
    municipalitySelect.innerHTML = '<option value="">Select Municipality</option>';
    municipalitySelect.disabled = true;

    if (!selectedRegion || !geoDataRepository[selectedRegion]) {
        provinceSelect.disabled = true;
        return;
    }

    const provinces = geoDataRepository[selectedRegion].provinces;
    for (let key in provinces) {
        let opt = document.createElement('option');
        opt.value = key;
        opt.innerText = provinces[key].name;
        provinceSelect.appendChild(opt);
    }
    provinceSelect.disabled = false;
});

provinceSelect.addEventListener('change', function() {
    const selectedRegion = regionSelect.value;
    const selectedProvince = this.value;
    municipalitySelect.innerHTML = '<option value="">Select Municipality</option>';

    if (!selectedProvince) {
        municipalitySelect.disabled = true;
        return;
    }

    const targetProvData = geoDataRepository[selectedRegion].provinces[selectedProvince];
    
    // Auto-Zoom and Pan Map System Action (Objective 1 & 4)
    map.setView(targetProvData.center, targetProvData.zoom);

    // Populate Municipalities
    targetProvData.municipalities.forEach(mun => {
        let opt = document.createElement('option');
        opt.value = mun;
        opt.innerText = mun;
        municipalitySelect.appendChild(opt);
    });
    municipalitySelect.disabled = false;
});

// 4. APPLY ADVISORY CONTROLLER (Objective 2 & 3)
document.getElementById('btn-apply').addEventListener('click', function() {
    const targetMun = municipalitySelect.value;
    const alertLevel = document.getElementById('select-status').value;

    if (!targetMun) {
        alert("Paki-pili ang Munisipyo/Lungsod na nais mong lapatan ng advisory.");
        return;
    }

    geoJsonLayer.eachLayer(function(layer) {
        if (layer.feature.properties.name === targetMun) {
            layer.feature.properties.status = alertLevel;
            geoJsonLayer.resetStyle(layer);
        }
    });
});

// 5. SOCIAL MEDIA EXPORT TOOL ENGINE (Objective 6: Export Ready PNG)
document.getElementById('btn-export').addEventListener('click', function() {
    const buttonElement = this;
    buttonElement.innerText = "Processing Map Image...";
    
    // Gamit ang library na isinama natin sa HTML, kukunan nito ng snapshot ang screen
    html2canvas(document.body, {
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
        let downloadHook = document.createElement('a');
        downloadHook.download = 'WeatherWatchPH_OfficialAdvisory.png';
        downloadHook.href = canvas.toDataURL('image/png');
        downloadHook.click();
        buttonElement.innerHTML = '<i class="fa-solid fa-download"></i> Export Graphic (PNG)';
    });
});
