document.addEventListener("DOMContentLoaded", () => {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) return;

  const lng = parseFloat(mapDiv.dataset.lng);
  const lat = parseFloat(mapDiv.dataset.lat);
  const apiKey = mapDiv.dataset.key;
  const title = mapDiv.dataset.title;
  const price = mapDiv.dataset.price;

  console.log("Map data:", { lng, lat, apiKey });

  const map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
    center: [lng, lat],
    zoom: 10
  });

  map.addControl(new maplibregl.NavigationControl());

  const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
    <strong>${title}</strong><br/>
    ₹${Number(price).toLocaleString("en-IN")}
  `);

  const marker = new maplibregl.Marker({
    color: "red",
    anchor: "bottom"
  })
    .setLngLat([lng, lat])
    .setPopup(popup)
    .addTo(map);

  map.on("load", () => {
    map.resize();
   
  });

  // ✅ RECENTER LOGIC (FIXED)
  const recenterBtn = document.getElementById("recenter-btn");

  if (recenterBtn) {
    recenterBtn.addEventListener("click", () => {
      console.log("Recenter clicked");
      map.flyTo({
        center: [lng, lat],
        zoom: 10,
        essential: true
      });
    });
  } else {
    console.warn("Recenter button not found");
  }
});
