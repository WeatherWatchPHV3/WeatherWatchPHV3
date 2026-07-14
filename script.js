// ==========================================
// 1. INITIALIZE MAP (STAY SA DARK BASEMAP)
// ==========================================
const map = L.map('map', {
    zoomControl: false,
    minZoom: 5,
    maxZoom: 15
}).setView([12.8797, 121.7740], 6);

// Paborito mong Dark Minimalist Basemap para lumutang ang shapes
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '© CartoDB'
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

let geojsonLayer = null;
let selectedColor = "#ff0000";
let allFeatures = []; // Tagatago ng mga bayan para sa dropdown filters

document.getElementById("colorPicker").addEventListener("input", function () {
    selectedColor = this.value;
});

// ==========================================
// 2. EMBEDDED WHOLE COUNTRY ENGINE (Naka-indicate na lahat sa simula)
// ==========================================
// Kumpletong dataset ng buong bansa para sabay-sabay nang nakalatag ang boung bansa!
const bulkGeoJsonUrl = "https://raw.githubusercontent.com/f-andres/philippines-geojson/master/geojson/municities/philippines-municities-cities.geojson";

fetch(bulkGeoJsonUrl)
    .then(res => {
        if (!res.ok) throw new Error("Hindi ma-load ang buong mapa.");
        return res.json();
    })
    .then(data => {
        allFeatures = data.features;
        populateDropdowns();

        // I-render ang BUONG MAPA nang transparent gray agad sa simula!
        geojsonLayer = L.geoJSON(data, {
            style: {
                color: "#ffffff",         // Puting borders
                weight: 0.8,              // Katamtamang nipis para sa buong bansa
                fillColor: "#4a5568",     // Transparent gray background
                fillOpacity: 0.4          // Naka-transparent gaya ng request mo
            },
            onEachFeature: function (feature, layer) {
                const municipality = feature.properties.NAME_2 || feature.properties.name || "Municipality";
                
                // Gagawa ng permanent dynamic labels kapag lumapit ang zoom
                layer.bindTooltip(municipality, {
                    permanent: false, // Lalabas lang kapag sapat ang zoom para hindi magulo ang buong bansa
                    direction: 'center',
                    className: 'map-label'
                });

                // HOVER ACTIONS
                layer.on("mouseover", function () {
                    if (layer.options.fillOpacity < 1) { 
                        layer.setStyle({ weight: 2, color: "#00e5ff" });
                    }
                });
                layer.on("mouseout", function () {
                    if (layer.options.fillOpacity < 1) {
                        layer.setStyle({ weight: 0.8, color: "#ffffff" });
                    }
                });

                // CLICK TO COLOR LOGIC (Gaya ng sa video mo)
                layer.on("click", function () {
                    // setStyle() action para magkakakulay ng solid!
                    layer.setStyle({
                        fillColor: selectedColor,
                        fillOpacity: 1,
                        weight: 1.5,
                        color: "#ffffff"
                    });

                    // Buksan ang white info popup capsule sa ibabaw ng bayan
                    layer.bindPopup("<b>" + municipality + "</b>").openPopup();
                    
                    // I-update ang UI tracker sa sidebar panel
                    document.getElementById("selectedDisplay").innerText = municipality;
                    document.getElementById("municipality").value = municipality;

                    // Swabeng zoom at automatic camera flight focus
                    map.fitBounds(layer.getBounds(), {
                        padding: [50, 50],
                        maxZoom: 12,
                        animate: true,
                        duration: 0.5
                    });
                });
            }
        }).addTo(map);
    })
    .catch(err => console.error("Error configuration tracer:", err));

// ==========================================
// 3. DROPDOWN SYNCHRONIZER
// ==========================================
function populateDropdowns() {
    const provinceSelect = document.getElementById("province");
    
    // Kumuha ng unique list ng mga probinsya sa bansa
    const provinces = [...new Set(allFeatures.map(f => f.properties.NAME_1 || f.properties.province))].sort();
    
    provinces.forEach(prov => {
        if(prov) {
            let opt = document.createElement("option");
            opt.value = prov;
            opt.innerText = prov;
            provinceSelect.appendChild(opt);
        }
    });

    // Kapag binago ang probinsya, i-filter ang munisipyo at mag-zoom doon nang mabilis
    provinceSelect.addEventListener("change", function() {
        const selectedProv = this.value;
        const municipalitySelect = document.getElementById("municipality");
        municipalitySelect.innerHTML = '<option value="">Select Municipality</option>';

        if (!selectedProv) return;

        // Punuin ang listahan ng bayan ng napiling probinsya
        const filteredMun = allFeatures
            .filter(f => (f.properties.NAME_1 || f.properties.province) === selectedProv)
            .map(f => f.properties.NAME_2 || f.properties.name)
            .sort();

        filteredMun.forEach(mun => {
            let opt = document.createElement("option");
            opt.value = mun;
            opt.innerText = mun;
            municipalitySelect.appendChild(opt);
        });

        // Mag-zoom ang camera sa buong sakop ng piniling probinsya nang hindi naglo-load ng bago!
        let tempBounds = L.featureGroup();
        geojsonLayer.eachLayer(function(layer) {
            const pName = layer.feature.properties.NAME_1 || layer.feature.properties.province;
            if (pName === selectedProv) {
                tempBounds.addLayer(layer);
            }
        });
        if (tempBounds.getLayers().length > 0) {
            map.fitBounds(tempBounds.getBounds(), { animate: true, duration: 0.6 });
        }
    });
}

// ==========================================
// 4. MANUAL SIDEBAR BUTTONS
// ==========================================
document.getElementById('applyBtn').addEventListener('click', function() {
    const selectedMun = document.getElementById("municipality").value;
    
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
            map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 12, animate: true, duration: 0.5 });
            layer.bindPopup("<b>" + selectedMun + "</b>").openPopup();
            document.getElementById("selectedDisplay").innerText = selectedMun;
        }
    });
});

// RESET TRIGGER: Ibalik lahat sa transparent gray layout
document.getElementById('resetBtn').addEventListener('click', function() {
    if (geojsonLayer) {
        geojsonLayer.setStyle({
            fillColor: "#4a5568",
            fillOpacity: 0.4,
            weight: 0.8,
            color: "#ffffff"
        });
        document.getElementById("selectedDisplay").innerText = "None";
        map.setView([12.8797, 121.7740], 6);
    }
});

// ==========================================
// 5. SCREENSHOT EXPORTER (Generate PNG)
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
                    if (layer.options.fillColor === "#4a5568") {
                        layer.setStyle({ weight: 2, color: "#00e5ff" });
                    }
                });

                layer.on("mouseout", function () {
                    if (layer.options.fillColor === "#4a5568") {
                        layer.setStyle({ weight: 1, color: "#ffffff" });
                    }
                });

                // CLICK ACTIONS (Dito siya magkakakulay ng solid gaya ng sa video!)
                layer.on("click", function () {
                    // Palitan ang kulay ng specific na bayan na ni-click mo gamit ang color picker value
                    layer.setStyle({
                        fillColor: selectedColor,
                        fillOpacity: 1,              // Solid na kulay para litaw na litaw
                        weight: 1.5,
                        color: "#ffffff"             // Mananatiling puti ang border line niya
                    });

                    // Lalabas ang popup indicator na may pangalan ng bayan
                    layer.bindPopup("<b>" + municipality + "</b>").openPopup();
                    
                    // Mag-a-update ang pangalan sa dashboard select sidebar mo
                    municipalitySelect.value = municipality;

                    // Mag-zo-zoom nang swabe papunta sa bayan na pinindot mo
                    map.fitBounds(layer.getBounds(), {
                        padding: [50, 50],
                        maxZoom: 12,
                        animate: true,
                        duration: 0.5
                    });
                });
            }
        }).addTo(map);

        // Awtomatikong zoom view sa buong probinsya kapag bago pa lang nilo-load
        map.fitBounds(geojsonLayer.getBounds(), { animate: true, duration: 0.6 });

        // Punuin ang dropdown selections
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
// 4. SIDEBAR ACTIONS (Kapag pinindot ang Apply button)
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
            
            map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 12, animate: true, duration: 0.5 });
            layer.bindPopup("<b>" + selectedMun + "</b>").openPopup();
        }
    });
});

// ==========================================
// 5. GENERATE IMAGE ADVISORY
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
