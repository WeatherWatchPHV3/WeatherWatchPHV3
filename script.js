// ==========================================
// 1. INITIALIZE MAP (Minimalist Dark Theme)
// ==========================================
const map = L.map('map', {
    zoomControl: false,
    minZoom: 5,
    maxZoom: 15
}).setView([12.8797, 121.7740], 6);

// MINIMALIST DARK BASEMAP (Inalis ang mga kalsada at normal labels para lumutang ang vector data)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '© CartoDB'
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Global layers & state trackers
let geojsonLayer = null;
let selectedColor = "#ff0000";

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

for (let region in phRegionsAndProvinces) {
    let opt = document.createElement('option');
    opt.value = region;
    opt.innerText = region;
    regionSelect.appendChild(opt);
}

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
// 3. DYNAMIC LOADER WITH SMOOTH ZOOM & EVENT TRIGGERS (Gaya ng sa Video)
// ==========================================
provinceSelect.addEventListener('change', function() {
    const selectedProvince = this.value;
    municipalitySelect.innerHTML = '<option value="">Select Municipality</option>';

    if (!selectedProvince) return;

    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }

    // Siguraduhing tama ang pagbasa kahit may whitespace gamit ang underscore (_)
    const formattedProvName = selectedProvince.toLowerCase().replace(/\s+/g, '_');
    const geoJsonUrl = `https://raw.githubusercontent.com/f-andres/philippines-geojson/master/geojson/municities/by-province/municities-province-${formattedProvName}.geojson`;

    fetch(geoJsonUrl)
    .then(response => {
        if (!response.ok) throw new Error("Cannot load GeoJSON.");
        return response.json();
    })
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: {
                color: "#ffffff",            // Puting pinong borders base sa screenshot mo
                weight: 1.2,                 // Tamang kapal para makita ang dibisyon
                fillColor: "#424b5e",        // Slate navy blue base background color
                fillOpacity: 0.9
            },
            onEachFeature: function (feature, layer) {
                const municipality = feature.properties.NAME_2 || feature.properties.name || "Municipality";

                // PERMANENT LABELS: Naka-embed sa gitna ng bawat polygon
                layer.bindTooltip(municipality, {
                    permanent: true,
                    direction: 'center',
                    className: 'map-label'
                });

                // HOVER ACTIONS (Glow accent effect kapag itinapat ang daliri o mouse)
                layer.on("mouseover", function () {
                    layer.setStyle({
                        weight: 3,
                        color: "#00e5ff"     // Cyan highlight outline
                    });
                });

                layer.on("mouseout", function () {
                    layer.setStyle({
                        weight: 1.2,
                        color: "#ffffff"
                    });
                });

                // DYNAMIC CLICK ENGAGEMENT (Gaya ng pag-click sa video record)
                layer.on("click", function () {
                    // 1. Palitan ang kulay ng piniling munisipyo
                    layer.setStyle({
                        fillColor: selectedColor,
                        fillOpacity: 1
                    });

                    // 2. Awtomatikong buksan ang Popup Label sa lokasyon ng click event
                    layer.bindPopup("<b>" + municipality + "</b>").openPopup();

                    // 3. Update sa dropdown selection para mag-match sa kinlik na lugar
                    municipalitySelect.value = municipality;

                    // 4. SMART DYNAMIC ZOOM: Lilipad at mag-fo-focus ang camera sa munisipyong pinili
                    map.fitBounds(layer.getBounds(), {
                        padding: [30, 30],
                        maxZoom: 12,
                        animate: true,        // Sinisigurong makinis ang transition ng lipad ng mapa
                        duration: 0.6         // Bilis ng pag-zoom (segundo)
                    });
                });
            }
        }).addTo(map);

        // Panimulang pag-zoom sa buong probinsya kapag binalitan ang select dropdown
        map.fitBounds(geojsonLayer.getBounds(), { animate: true, duration: 0.8 });

        // Populate sa municipality menu list
        const cleanMunList = data.features.map(f => f.properties.NAME_2 || f.properties.name).sort();
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
// 4. SIDEBAR TRIGGERS (Apply Button)
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
                fillOpacity: 1
            });
            
            // Mag-zo-zoom din kapag pinindot ang Apply button mula sa dashboard panel
            map.fitBounds(layer.getBounds(), { padding: [30, 30], maxZoom: 12, animate: true, duration: 0.6 });
            layer.bindPopup("<b>" + selectedMun + "</b>").openPopup();
        }
    });
});

// ==========================================
// 5. GENERATE HIGH-QUALITY PNG GRAPHIC
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
