// Custom icon for current location
const locationIcon = L.icon({
    iconUrl: './Data/location.png', // Path to the location.png file
    iconSize: [50, 50], // Size of the icon [width, height]
    iconAnchor: [25, 50], // Anchor point of the icon [left, bottom]
    popupAnchor: [0, -50] // Popup position relative to the icon
});

// Function to display current location
function showCurrentLocation() {
    // Check if geolocation is available
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    // Get current position
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;

            // Add a marker for the current location
            const marker = L.marker([latitude, longitude], { icon: locationIcon })
                .addTo(map)
                .bindPopup("You are here!")
                .openPopup();

            // Center the map on the current location
            map.setView([latitude, longitude], 12);
        },
        (error) => {
            console.error("Error getting location:", error);
            alert("Unable to retrieve your location.");
        }
    );
}

// Call the function to show current location
showCurrentLocation();