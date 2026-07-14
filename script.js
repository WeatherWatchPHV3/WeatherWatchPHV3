// Map Initialization (Bulacan area center bilang simula)
const map = L.map('map', {
    zoomControl: false, // Inalis ang default zoom controls para malinis ang UI tulad ng sa reference mo
    minZoom: 5,
    maxZoom: 18
}).setView([14.8526, 120.8160], 11); // Center sa Bulacan area para match sa reference mo

// Base Layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Lagyan natin ng zoom controls sa ibaba/kanan para hindi humarang sa panel
L.control.zoom({
    position: 'bottomright'
}).addTo(map);

// Simulation ng boundary shape para may ma-click ka agad sa screen habang pinag-aaralan natin
const bulacanSampleData = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "name": "Bulacan Area", "status": "All Levels" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [120.75, 14.80],
                        [120.95, 14.80],
                        [120.95, 14.95],
                        [120.75, 14.95],
                        [120.75, 14.80]
                    ]
                ]
            }
        }
    ]
};

// I-style ang hugis sa mapa
function styleFeature(feature) {
    return {
        fillColor: '#808080', // Gray tulad ng kulay sa screenshot mo
        weight: 1.5,
        opacity: 1,
        color: '#ffffff',
        fillOpacity: 0.6
    };
}

const geoJsonLayer = L.geoJSON(bulacanSampleData, {
    style: styleFeature,
    onEachFeature: function(feature, layer) {
        layer.bindPopup(`<strong>${feature.properties.name}</strong><br>Status: ${feature.properties.status}`);
    }
}).addTo(map);
