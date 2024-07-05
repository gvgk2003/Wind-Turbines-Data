        let map;
        let marker;

        function initMap() {
            map = new google.maps.Map(document.getElementById('map-area'), {
                center: {lat: 20.5937, lng: 78.9629},
                zoom: 5,
                disableDefaultUI: true, // Disable default map UI
                clickableIcons: false
            });

            map.addListener('click', function(event) {
                placeMarker(event.latLng);
            });

            // Create a tooltip element
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            map.getDiv().appendChild(tooltip);
        }

        function placeMarker(location) {
            if (marker) {
                marker.setPosition(location);
            } else {
                marker = new google.maps.Marker({
                    position: location,
                    map: map
                });
            }
            document.getElementById('latitudeValue').value = location.lat().toFixed(6);
            document.getElementById('longitudeValue').value = location.lng().toFixed(6);
        };