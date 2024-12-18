// Global variable to store current location
let currentLocation = null;

// Function to show current location
function showCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;

            // Add marker for the current location
            L.marker([latitude, longitude], { icon: locationIcon })
                .addTo(map)
                .bindPopup("You are here!")
                .openPopup();

            // Center the map on the current location
            map.setView([latitude, longitude], 15);

            // Store current location for further use
            currentLocation = { latitude, longitude };
            
        },
        (error) => {
            console.error("Error getting location:", error);
            alert("Unable to retrieve your location.");
        }
    );
}

// Function to show the nearest community center
function showNearestCommunityCenter() {
    // Ensure current location is available
    if (!currentLocation) {
        alert("Current location is not available. Please ensure location services are enabled.");
        return;
    }

    const { latitude: currentLat, longitude: currentLon } = currentLocation;

    // Load help centers from CSV
    loadHelpCenters((helpCenters) => {
        let nearestCenter = null;
        let minDistance = Infinity;

        helpCenters.forEach((center) => {
            const { latitude, longitude, type } = center;
            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);
            const distance = calculateDistance(currentLat, currentLon, lat, lon);

            if (distance < minDistance) {
                minDistance = distance;
                nearestCenter = { lat, lon, type };
            }
        });
        if(minDistance > 5) {
            alert("Could not find community center nearby!");
            return ;
        }
        

        if (nearestCenter) {
            const icon = nearestCenter.type.toLowerCase() === "hospital" ? hospitalIcon : policeStationIcon;

            // Add a marker for the nearest community center
            L.marker([nearestCenter.lat, nearestCenter.lon], { icon })
                .addTo(map)
                .bindPopup(`Nearest ${nearestCenter.type} is here!`)
                .openPopup();

            // Fit map bounds to show both locations
            const bounds = L.latLngBounds([[currentLat, currentLon], [nearestCenter.lat, nearestCenter.lon]]);
            map.fitBounds(bounds);
        } else {
            alert("No community centers found in the data.");
        }
    });
}

// Function to load CSV file and parse it using PapaParse
function loadHelpCenters(callback) {
    Papa.parse('./Data/community.csv', {
        download: true,
        header: true,
        complete: (results) => {
            callback(results.data);
        },
        error: (error) => {
            console.error("Error loading CSV:", error);
        }
    });
}

// Function to calculate the distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

// Custom icons for markers
const locationIcon = L.icon({
    iconUrl: './Data/location.png',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
});

const hospitalIcon = L.icon({
    iconUrl: './Data/hospital.png',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
});

const policeStationIcon = L.icon({
    iconUrl: './Data/police-station.png',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
});


// Call the function to show current location
showCurrentLocation();

const name = "Chaitanya";
const email = "chaitanya@gmail.com";
function sendEmergencyNotification(){
    Papa.parse('./Data/details.csv', {
        download: true,
        header: true,
        complete: (results) => {
            // Filter the rows to find the one matching the email
            const matchingRow = results.data.find(row => row.email === email);

            if (matchingRow) {
                const contact1 = matchingRow["emergency-contact-1"];
                const contact2 = matchingRow["emergency-contact-2"];
                console.log(contact1);
                console.log(contact2);
                

                if (contact1 || contact2) {
                    // Compose the emergency message
                    const message = `
                        Name: ${name}
                        Email: ${email}
                        Location: [Fetching current location...]
                    `;

                } else {
                    alert("No emergency contacts found for the given email.");
                }
            } else {
                alert("No matching email found in the CSV file.");
            }
        },
        error: (error) => {
            console.error("Error loading CSV:", error);
            alert("Failed to load emergency contact details.");
        }
    });
}

document.querySelector('#sos').addEventListener('click', ()=>{
    showNearestCommunityCenter();
    sendEmergencyNotification();
    alert('Alert sent to nearest community centers and emergency contacts');
});
