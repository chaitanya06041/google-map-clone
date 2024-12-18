// Initialize the map
const map = L.map('map').setView([18.5204, 73.8567], 13); // Pune coordinates and zoom level

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);



// Collect user-selected crimes
let selectedCrimes = new Set(["rape", "murder", "robbery", "carjacking", "stalking", "kidnapping"]);

// Function to update selected crimes
function updateSelectedCrimes() {
    selectedCrimes.clear();
    document.querySelectorAll('.crime-filter:checked').forEach((checkbox) => {
        selectedCrimes.add(checkbox.dataset.crime);
    });
    console.log("Selected crimes:", Array.from(selectedCrimes));
    loadCrimeData(); //added
}

// Handle "Select All" logic
document.getElementById('selectAll').addEventListener('change', function () {
    const allCheckboxes = document.querySelectorAll('.crime-filter');
    if (this.checked) {
        allCheckboxes.forEach((checkbox) => checkbox.checked = true);
        selectedCrimes = new Set(["rape", "murder", "robbery", "carjacking", "stalking", "kidnapping"]);
    } else {
        allCheckboxes.forEach((checkbox) => checkbox.checked = false);
        selectedCrimes.clear();
    }
    console.log("Selected crimes:", Array.from(selectedCrimes));
    loadCrimeData() //added
});

// Handle individual crime checkbox logic
document.querySelectorAll('.crime-filter').forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
        updateSelectedCrimes();
        const allCheckbox = document.getElementById('selectAll');
        if (selectedCrimes.size === 6) {
            allCheckbox.checked = true;
        } else {
            allCheckbox.checked = false;
        }
    });
});








// Custom danger icon
const dangerIcon = L.icon({
    iconUrl: './Data/pin.png', // Example danger icon
    iconSize: [30, 30], // Icon size
    iconAnchor: [15, 30], // Anchor point
});

// Crime coordinates array
let crimeCoordinates = [];


// Load and parse crime data (crime.csv)
function loadCrimeData() {
    // Clear existing crime data and markers
    crimeCoordinates = [];
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker && layer.options.icon === dangerIcon) {
            map.removeLayer(layer);
        }
    });

    Papa.parse('./Data/crimes.csv', {
        download: true,
        header: true, // Treat the first row as headers
        complete: function (results) {
            const crimeData = results.data;
            crimeData.forEach(crime => {
                if (crime.latitude && crime.longitude && crime.type) {
                    if (selectedCrimes.has(crime.type)) {
                        const lat = parseFloat(crime.latitude);
                        const lon = parseFloat(crime.longitude);
                        crimeCoordinates.push([lat, lon]);

                        // Add a marker for each crime location
                        L.marker([lat, lon], { icon: dangerIcon })
                            .addTo(map)
                            .bindPopup(`<b>Crime Location</b><br>Details: ${crime.details || 'N/A'}`);
                    }
                }
            });
        },
        error: function (error) {
            console.error('Error loading the CSV file:', error);
        }
    });
}


loadCrimeData(); // Load crime data on page load

// Function to fetch coordinates and suggestions for a place name (using Nominatim)
function getPlaceSuggestions(query, callback) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`)
        .then(response => response.json())
        .then(data => {
            callback(data);
        })
        .catch(error => console.error('Error fetching place suggestions:', error));
}


// Function to fetch coordinates for a place name
function getCoordinates(place) {
    return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${place}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                return [parseFloat(lat), parseFloat(lon)];
            }
            return null; // No coordinates found
        });
}

// Function to check if the path passes through any crime coordinates
function checkPathForCrimes(route) {
    const dangerThreshold = 200; // 200 meters radius
    let dangerDetected = false;

    route.forEach(waypoint => {
        const [lat1, lon1] = waypoint;

        crimeCoordinates.forEach(([lat2, lon2], index) => {
            const crimeLocation = L.latLng(lat2, lon2);
            const waypointLocation = L.latLng(lat1, lon1);
            const distance = waypointLocation.distanceTo(crimeLocation); // Distance in meters

            // Check if the waypoint is within 200 meters of a crime location
            if (distance <= dangerThreshold) {
                dangerDetected = true;
            }
        });
    });

    return dangerDetected;
}


let currentRouteControl = null; // To hold the current route control
let routeLayer = null;


// Handle the search button click event
document.getElementById('searchButton').addEventListener('click', () => {
    const source = document.getElementById('source').value;
    const destination = document.getElementById('destination').value;

    if (!source || !destination) {
        alert("Please enter both source and destination!");
        return;
    }

    // Fetch coordinates for source and destination
    Promise.all([getCoordinates(source), getCoordinates(destination)]).then(([sourceCoords, destCoords]) => {
        if (!sourceCoords || !destCoords) {
            alert("Unable to find one or both locations!");
            return;
        }

        // Clear the previous route if it exists
        if (currentRouteControl) {
            map.removeControl(currentRouteControl);
            currentRouteControl = null;
        }
        if (routeLayer) {
            map.removeLayer(routeLayer);
            routeLayer = null;
        }


        // Add routing control to display the route
        currentRouteControl = L.Routing.control({
            waypoints: [
                L.latLng(sourceCoords[0], sourceCoords[1]),
                L.latLng(destCoords[0], destCoords[1])
            ],
            routeWhileDragging: true,
            createMarker: function () { return null; }, // Prevent creating markers
            show: false, // Prevent showing default instructions box
            collapsible: true, // Hide the panel completely
            fitSelectedRoutes: true, // Automatically fit route in view
            router: L.Routing.osrmv1({
                serviceUrl: "https://router.project-osrm.org/route/v1", // Ensure it works without issues
            }),
            itineraryFormatter: null
        })
            .on('routesfound', function (e) {
                const routes = e.routes[0]; // Get the first route
                const waypoints = routes.coordinates.map(coord => [coord.lat, coord.lng]);

                // Check if the path contains any crime locations within 200m
                const isDangerous = checkPathForCrimes(waypoints);
                console.log(isDangerous);
                
                // Remove the default route layer
                if (routeLayer) {
                    map.removeLayer(routeLayer);
                }

                const routeColor = 'blue'; // Always green

                // Create a polyline for the route with the specified color
                routeLayer = L.polyline(waypoints, { color: routeColor, weight: 5 }).addTo(map);

                // Optionally alert the user
                if (isDangerous) {
                    alert("Warning: Your path passes through a crime-prone area!");
                }
            })
            .addTo(map);
    });
});



