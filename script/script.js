$(document).ready(function () {
    //variable to store the map
    var map;
    //original address for NE1 8ST
    var origin = { lat: 54.97696325833566, lng: -1.6074366645438352 };
    // variable to store the destination
    var destination;
    //define bounds for automatic resize to accomodate all markers on the map
    var bounds = new google.maps.LatLngBounds();
    //create an instance of direction renderer
    var directionsDisplay = new google.maps.DirectionsRenderer();

    //initialise the map on the browser
    initialise();

    //function to initialise the map
    function initialise() {
        //set the lat and lng to set the center of the map
        let LatLng = { lat: 54.977820, lng: -1.618388 };
        //map settings
        var mapOptions = {
            center: new google.maps.LatLng(LatLng), //set the lat and long
            zoom: 4, // set zoom
            mapTypeId: google.maps.MapTypeId.ROADMAP,//set the  map type
            streetViewControl: true,// view control true to show the little man
            overviewMapControl: false,
            rotateControl: false,
            scaleControl: false,
            panControl: false,
        };
        //initiate the map here
        map = new google.maps.Map(document.getElementById("map-area"), mapOptions);
        //set the weather of the Living Planet HQ
        getWeather(origin.lat, origin.lng, "Living Planet HQ");
    }

    //loadData function to load the twitter data on the browser
    function loadData() {
        //variable to store the lat and lng of each tweet
        var latLng;
        //store the tweets found in an array
        var items = [];
        //get the JSON data from the assignment file
        $.getJSON("data/kf6013_assignment_data.json", function (data) {
            //iterate over each tweet
            $.each(data.statuses, function (key, val) {
                //get only the tweets containing #climatechange & #netzero
                if (val.text.toLowerCase().includes("#climatechange") || val.text.toLowerCase().includes("#netzero")) {
                    // Create a new instance of the Geocoder
                    let geocoder = new google.maps.Geocoder();
                    //store all tweets found with the above hashtags
                    items.push("<dt>" + val.user.name + "</dt>"); // store the tweet username
                    items.push("<dd>" + val.text + "</dd>");//store the tweet text

                    //check for the user location first
                    if (val.user.location) {
                        // convert the user location into coordinates using geocoder
                        //pass an object location and a callback function as params
                        geocoder.geocode({ 'address': val.user.location }, function (results, status) {
                            if (status === google.maps.GeocoderStatus.OK) {
                                // Get the latitude and longitude from the results
                                let latitude = results[0].geometry.location.lat();
                                let longitude = results[0].geometry.location.lng();

                                // store the lat&lng in the variable and use parseFloat for a more precised mapping
                                latLng = new google.maps.LatLng(parseFloat(latitude), parseFloat(longitude));
                                //create the marker by passing the lat&lng and the val of the tweet
                                createMarker(latLng, val);
                            }
                        });

                    }
                    //search for the geo location in the tweets
                    if (val.user.geo_enabled && val.geo) {
                        //get the lat and lng coordinate of the val.geo
                        latLng = new google.maps.LatLng(val.geo.coordinates[0], val.geo.coordinates[1]);
                        //create the marker by passing the lat&lng and the val of the tweet
                        createMarker(latLng, val);
                    }

                    //search for place and bounding_box
                    if (val.place && val.place.bounding_box) {
                        /**
                         * Tweeter return data in a multi dimensional array.
                         * Index 0 returns the the corners of the bounding box as 4 arrays : bottom-left, bottom-right, top-right, top-left.
                         * We will calculate the center of the south-west corner and  nort-east corner using LatLngBounds and find out the lat and lng.
                         */

                        //get the first element from the multi dimensional array
                        let coordinates = val.place.bounding_box.coordinates[0];

                        //create LatLng objects for the south-west & north-east corners of the bounding box
                        //the tweeter data is returned as longitute-latitude and we pass the coordinates the other way arround(lat-lng)
                        let southWestCorner = new google.maps.LatLng(coordinates[0][1], coordinates[0][0]);
                        let northEastCorner = new google.maps.LatLng(coordinates[2][1], coordinates[2][0]);

                        //create a LatLngBounds on the map
                        let bounds = new google.maps.LatLngBounds(southWestCorner, northEastCorner);

                        //calculate the center of the bounding box and store the cooridinates in latLng
                        latLng = bounds.getCenter();

                        //create the marker by passing the lat&lng and the val of the tweet
                        createMarker(latLng, val);
                    }
                }
            });
            //display tweets on the browser
            $("<dl/>", {
                "class": "tweet-list",
                html: items.join("")
            }).appendTo("#tweets");
            //error handling
        }).fail(function () {
            console.log("An error has occurred.");
        });
    }

    //reusable function to create markers on the map
    function createMarker(latLng, val) {

        //store the marker icons
        let markerIcon;

        //get the tweet types and assign marker icons to their relevant hashtags.
        if (val.text.toLowerCase().includes("#climatechange")) {
            markerIcon = climatechangeImg;
        }
        if (val.text.toLowerCase().includes("#netzero")) {
            markerIcon = netzeroImg;
        }
        if (val.text.toLowerCase().includes("#climatechange") && val.text.toLowerCase().includes("#netzero")) {
            markerIcon = combinedImg;
        }

        //initialise the marker, pass the latLng param, the icon, map and animation
        let marker = new google.maps.Marker({
            position: latLng,
            icon: markerIcon,
            map: map,
            animation: google.maps.Animation.DROP
        });

        //cxtend the bounds to include the new marker position
        bounds.extend(marker.getPosition());

        //fit the bounds on the map for automatic resize
        map.fitBounds(bounds);

        //initialise the info window and pass the username and text value of the tweet
        let infoWindow = new google.maps.InfoWindow({
            content: "<strong>Username:</strong> " + val.user.name + "<br><strong>Tweet:</strong> " + val.text
        });

        //add mouseover listener to display the infoWidow
        google.maps.event.addListener(marker, "mouseover", function () {
            infoWindow.open(map, marker);
            //bounce when mouseover
            marker.setAnimation(google.maps.Animation.BOUNCE);
        });

        //add mouseout listener to remove the infoWindow
        google.maps.event.addListener(marker, "mouseout", function () {
            infoWindow.close();
            //stop bouncing when mouseout
            marker.setAnimation(null);
        });

        /**
         * Add a click event to each marker.
         * When marker clicked, get the direction and set the routes on google map
         */
        google.maps.event.addListener(marker, "click", function () {

            //set marker position as destination
            destination = { lat: marker.getPosition().lat(), lng: marker.getPosition().lng() };

            //following, set the route on the map and get the direction details
            //create the request that stores the origin, destination and the traveling mode driving,walking etc
            let request = {
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING
            };

            //add a variable to call the directions service
            let directionsService = new google.maps.DirectionsService();

            /** 
             * Set directionDisplay to null.
             * This will update the map by removing the previous legs/route from origin to a marker,
             * and update it with a new route when a different marker is clicked.
            */
            directionsDisplay.setMap(null);

            //send the request to the directionService to get the route
            directionsService.route(request, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {

                    //set the directionsDisplay to the map object
                    directionsDisplay.setMap(map);

                    //set the directionsDisplay Panel to be a div element created in index.html
                    //.setPanel is a function within the Directions Service that is available from teh Google Maps API
                    //.setPanel doesnt recognise jQuery so we use plane javascript to call the directionPanel and set it as Panel
                    directionsDisplay.setPanel(document.getElementById("directionsPanel"));

                    //get the response data from direction service request and display it on the directions panel as a route
                    directionsDisplay.setDirections(response);
                } else {
                    //check the error messages if the direction could not be completed
                    let errorMessage;
                    //get the status and matchet with any google maps direction status errors in a switch case
                    switch (status) {
                        case google.maps.DirectionsStatus.NOT_FOUND:
                            errorMessage = "Origin or destination not found. Please try again.";
                            break;
                        case google.maps.DirectionsStatus.INVALID_REQUEST:
                            errorMessage = "Invalid request. Please try again later.";
                            break;
                        case google.maps.DirectionsStatus.ZERO_RESULTS:
                            errorMessage = "No result found. Please try again later.";
                            break;
                        case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
                            errorMessage = "Too many waypoints. Maximum allowed is 25 plus origin and destination.";
                            break;
                        case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                            errorMessage = "You have exceeded your daily request quota.";
                            break;
                        case google.maps.DirectionsStatus.REQUEST_DENIED:
                            errorMessage = "The request was denied.";
                            break;
                        case google.maps.DirectionsStatus.UNKNOWN_ERROR:
                            errorMessage = "An unknown error occurred. Please try again.";
                            break;
                        default:
                            errorMessage = "An error occurred. Please try again.";
                    }
                    //append the error message
                    $("#directionsPanel").html("<p>" + errorMessage + "</p>");
                }
            });

            //get the weather of the markers when markers are clicked.
            getWeather(marker.getPosition().lat(), marker.getPosition().lng(), val.user.name);
        });
    }

    //get the weather from GeoNames API
    function getWeather(lat, lng, username) {
        //pass the lat and lng to the URL
        $.getJSON("http://api.geonames.org/findNearByWeatherJSON?lat=" + lat + "&lng=" + lng + "&username=YOURUSERNAME", function (result) {

            //store the weather object
            var myObj = result.weatherObservation;

            //if weather object exists, append the weather to the html ids
            if (myObj) {
                $("#username").text(username);
                $("#clouds").text(myObj.clouds);
                $("#humidity").text(myObj.humidity);
                $("#windspeed").text(myObj.windSpeed);
            } else {
                console.log("No weather data found.");
            }
            console.log(myObj);
        })
    }


    //origin marker for Living Planet HQ
    new google.maps.Marker({
        position: origin,
        map: map,
    });

    //climatechange img
    const climatechangeImg = {
        url: "images/climatechange.png",
        scaledSize: new google.maps.Size(50, 50), //scaled size
        origin: new google.maps.Point(0, 0), //origin
        anchor: new google.maps.Point(0, 0)
    };
    //netzero img
    const netzeroImg = {
        url: "images/netzero.png",
        scaledSize: new google.maps.Size(50, 50), //scaled size
        origin: new google.maps.Point(0, 0), //origin
        anchor: new google.maps.Point(0, 0)
    };
    //combined img
    const combinedImg = {
        url: "images/combined.png",
        scaledSize: new google.maps.Size(50, 50), //scaled size
        origin: new google.maps.Point(0, 0), //origin
        anchor: new google.maps.Point(0, 0)
    };

    /*********Load the Tweeter data before the icons ***********/
    loadData();

    //wheb button 'get-direction' clicked, display the distance from origin to destination
    $("#get-direction").click(function () {

        //variable service to store the DistanceMatrixService
        let service;

        //if the marker is not being clicked, set an alert
        if (!destination) {
            alert("Please select a marker!");
        } else {
            //else create the instance of matrix service
            service = new google.maps.DistanceMatrixService();

            //call the getDistanceMatrix method on the DistanceMatrixService
            service.getDistanceMatrix(
                {
                    //pass in the origin and destination values and set the other values such as travelmode, miles etc
                    origins: [origin],
                    destinations: [destination],
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.IMPERIAL,
                    avoidHighways: false,
                    avoidTolls: false

                    //when the service responds, run the callback function
                }, callback);

            /***get the response and status details from the call to the getDistanceMatrix***/
            function callback(response, status) {

                //if the status is OK then procedd to get the journey details 
                if (status == google.maps.DistanceMatrixStatus.OK) {

                    //get the origin and destination information from the service
                    let origins = response.originAddresses;
                    let destinations = response.destinationAddresses;

                    //iterate thorugh the orgins
                    $.each(origins, function (originIndex) {
                        //get the elements of the origins and store them as  results
                        let results = response.rows[originIndex].elements;
                        //iterate through the results
                        $.each(results, function (resultIndex) {
                            //get the result at index
                            let element = results[resultIndex];
                            //if distance and durations are true
                            if (element.distance && element.duration) {
                                //get the distance
                                //get the duration
                                //get the origin
                                //get the destination
                                let distance = element.distance.text;
                                let duration = element.duration.text;
                                let from = origins[originIndex];
                                let to = destinations[resultIndex];

                                //for each journey create a div element using jQuery to display the journey information 
                                $("#distance-info").html("<dl id='distance-dl'><dt>Distance: </dt><dd>" + distance + "</dd> <dt>Duration: </dt><dd>" + duration + "</dd> <dt>From: </dt><dd>" + from + "</dd> <dt>To: </dt><dd>" + to + "</dd> </dl>");

                            } else {
                                //error handling
                                let errorMessage = "No result found for the given origin and destination.";
                                $("#distance-info").html("<p>" + errorMessage + "</p>");
                            }
                        });
                    }); //end

                //else handle the status messages of the distance matrix accordingly
                } else {
                    let errorMessage;
                    //status error handling checked in a switch-case statement
                    switch (status) {
                        case google.maps.DistanceMatrixStatus.NOT_FOUND:
                            errorMessage = "Origin or destination not found. Please check your input and try again.";
                            break;
                        case google.maps.DistanceMatrixStatus.INVALID_REQUEST:
                            errorMessage = "Invalid request. Check the input values.";
                            break;
                        case google.maps.DistanceMatrixStatus.MAX_ELEMENTS_EXCEEDED:
                            errorMessage = "The request contains too many elements.";
                            break;
                        case google.maps.DistanceMatrixStatus.OVER_QUERY_LIMIT:
                            errorMessage = "You have exceeded your daily request quota.";
                            break;
                        case google.maps.DistanceMatrixStatus.REQUEST_DENIED:
                            errorMessage = "The request was denied.";
                            break;
                        case google.maps.DistanceMatrixStatus.UNKNOWN_ERROR:
                            errorMessage = "An unknown error occurred. Please try again.";
                            break;
                        default:
                            errorMessage = "An error occurred. Please try again.";
                    }

                    // Update the error message div with the appropriate message
                    $("#distance-info").html("<p>" + errorMessage + "</p>");
                }
            } //end of callback function
        }
    });

    //clear the direction info & routes
    $("#clear-direction").click(function () {
        directionsDisplay.setMap(null);
        directionsDisplay.setPanel(null);
        $("#distance-info").html("");
        $("directionsPanel").html("");
    });

});
