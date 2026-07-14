// Function na tatawagin kapag nagbago ang piniling probinsya sa dropdown
function loadMunicipalBoundaries(provinceName) {
    // 1. Linisin muna ang lumang layer sa mapa para hindi magpatong-patong
    if (currentMunicipalLayer) {
        map.removeLayer(currentMunicipalLayer);
    }

    // 2. I-convert ang pangalan ng probinsya sa format na tugma sa file (hal. "Davao del Sur" -> "davao-del-sur")
    const formattedName = provinceName.toLowerCase().replace(/\s+/g, '-');

    // 3. Kunin ang GeoJSON file live mula sa GitHub repository ng hiwa-hiwang probinsya
    const geoJsonUrl = `https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2023/geojson/municipalities/${formattedName}.geojson`;

    fetch(geoJsonUrl)
        .then(response => {
            if (!response.ok) throw new Error("Hindi mahanap ang file ng probinsyang ito.");
            return response.json();
        })
        .then(data => {
            // 4. I-render ang mga munisipyo sa mapa at i-zoom ang view doon!
            currentMunicipalLayer = L.geoJSON(data, {
                style: defaultStyle,
                onEachFeature: onEachMunicipality
            }).addTo(map);

            // Awtomatikong itutok at i-zoom ang mapa sa mga munisipyo ng probinsyang ito
            map.fitBounds(currentMunicipalLayer.getBounds());
            
            // 5. I-populate ang Municipality Dropdown gamit ang mga totoong pangalan mula sa GeoJSON data
            updateMunicipalityDropdown(data.features);
        })
        .catch(error => {
            console.error("Error fetching municipal data:", error);
            alert("Paumanhin, hindi ma-load ang mga munisipyo para sa lugar na ito.");
        });
}
