

+function (google, $, win) {


        this.ErrorCount = 0

        try {
            if (this.ErrorCount >= 1) {
                return;
            }

            var GoogleStreetView = function (el) {

                // Data objects.
                this.Data = {
                    Latitude: formatCoordinate($(el).data("start-latitude"), 51.525836),
                    Longitude: formatCoordinate($(el).data("start-longitude"), -0.096393),
                    Heading: formatCoordinate($(el).data("start-heading"), 22.365403),
                    Pitch: formatCoordinate($(el).data("start-pitch"), -13.422331),
                    Pano: formatCoordinate($(el).data("start-pano"), ""),
                    Zoom: formatCoordinate($(el).data("start-zoom"), 1)
                }
				
				function formatCoordinate(data, def) {
					if (data != null && data != "" && !isNaN(data)) {
						return data;
					}
					return def;
				}
				

                // Get elements
                this.Element = {
                    Main: el,
                    Coordinates: {
                        $Latitude: $(el).find("#Latitude"),
                        $Longitude: $(el).find("#Longitude"),
                        $Heading: $(el).find("#Heading"),
                        $Pitch: $(el).find("#Pitch"),
                        $Zoom: $(el).find("#Zoom"),
                        $Pano: $(el).find("#Pano"),
                    },
                    Map: {
                        $NormalMap: $(el).find("[data-street-view-normal-map]"),
                        $Panorama: $(el).find("[data-street-view-map]")
                    },
                    Search: {
                        $Input: $(el).find("[name='StreetViewSearch']"),
                        $Button: $(el).find("[name='StreetViewSearchSubmit']"),
                        $ResultsLayout: $(el).find("[data-google-map-search-results-layout]"),
                        $ResultsList: $(el).find("[data-streetview-search-results]"),
                        $ResultsTemplate: $(el).find("[data-streetview-search-results-template]")
                    }
                }

                var that = this;

                this.GooglePlacesSearchBox = new google.maps.places.SearchBox(that.Element.Search.$Input[0]); // Link the search box with Google Places search.
                this.StreetViewService = new google.maps.StreetViewService();

                // Initalise the normal map.
                this.NormalMap = new google.maps.Map(that.Element.Map.$NormalMap[0], {
                    zoom: 16,
                    center: new google.maps.LatLng(that.Data.Latitude, that.Data.Longitude),
                    panControl: true,
                    zoomControl: true,
                    scaleControl: true,
                    mapTypeId: google.maps.MapTypeId.HYBRID
                });

                // Initalise the Panorama.
                this.Panorama = new google.maps.StreetViewPanorama(
                    that.Element.Map.$Panorama[0], {
                        position: { lat: that.Data.Latitude, lng: that.Data.Longitude },
                        pov: {
                            heading: that.Data.Heading,
                            pitch: that.Data.Pitch
                        },
                        visible: true,
                        pano: that.Data.Pano,
                        zoom: that.Data.Zoom
                    });

            }

            GoogleStreetView.prototype = {
                init: function () {
                    this.NormalMap.setStreetView(this.Panorama); // Link the map with the panorama.

                },
                changeCoordinates: function () {
                    // Update the element textboxes with the results from the panorma.
                    this.Element.Coordinates.$Latitude.val(this.Panorama.getPosition().lat());
                    this.Element.Coordinates.$Longitude.val(this.Panorama.getPosition().lng());
                    this.Element.Coordinates.$Heading.val(this.Panorama.getPov().heading);
                    this.Element.Coordinates.$Pitch.val(this.Panorama.getPov().pitch);
                    this.Element.Coordinates.$Pano.val(this.Panorama.pano);
                    this.Element.Coordinates.$Zoom.val(this.Panorama.zoom);
                },
                changeLatitude: function(e) {
                    if (e) {
                        // Latitude textbox has been updated.
                        this.updateMapWithCoordinates(e);
                    }
                },
                changeLongitude: function (e) {
                    if (e) {
                        // Longitude textbox has been updated.
                        this.updateMapWithCoordinates(e);
                    }
                },
                changeMapBounds: function () {
                    // Set boundary
                    this.GooglePlacesSearchBox.setBounds(this.NormalMap.getBounds());
                },
                changePanoramaPosition: function () {
                    // When moving the panorama, update the textbox coordinates.
                    this.changeCoordinates();
                },
                changePanoramaPov: function () {
                    // When moving around, update the textbox coordinates.
                    this.changeCoordinates();
                },
                formatSearchResult: function(name, formatted_address) {
                    // Format the search result. Sometimes the name is included in the formatted_address variable.
                    if (formatted_address.indexOf(name) > -1) {
                        return formatted_address;
                    }
                    return name + ", " + formatted_address;
                },
                getSearchResults: function () {
                    // Get search results.
                    var places = this.GooglePlacesSearchBox.getPlaces();

                    if (places.length == 0) {
                        // No results found, so alert the user.
                        alert("No addresses could be found from your search.");
                    }

                    if (places.length == 1) {
                        // Only one result, so update the map.
                        var place = places[0];

                        // Format the result in the search box.
                        this.Element.Search.$Input.val(this.formatSearchResult(place.name, place.formatted_address));

                        // Update the map  with the search result.
                        this.NormalMap.setCenter(place.geometry.location);

                        // Update the panorama with the search result.
                        this.Panorama.setPosition(new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng()));
                    }
                    else {
                        // Hide search results.
                        this.hideSearchResults();
                        var that = this;

                        // List each search result.
                        places.forEach(function (place) {
                            var template = that.Element.Search.$ResultsTemplate.html();
							$output = template;
							
							$output = $output.replace(/\{\{name\}\}/ig, place.name);
							$output = $output.replace(/\{\{formattedAddress\}\}/ig, place.formatted_address);
							$output = $output.replace(/\{\{latitude\}\}/ig, place.geometry.location.lat());
							$output = $output.replace(/\{\{longitude\}\}/ig, place.geometry.location.lng());
							$output = $output.replace(/\{\{formattedResult\}\}/ig, that.formatSearchResult(place.name, place.formatted_address));

                            that.Element.Search.$ResultsList.append($output);
                        });

                        // When search results are populated, display to the user.
                        this.Element.Search.$ResultsLayout.show();
                    }
                },
                hideSearchResults: function () {
                    // Hide search results.
                    this.Element.Search.$ResultsLayout.hide();
                    this.Element.Search.$ResultsList.empty();
                },
                streetViewSearchInputClick: function (e) {
                    if (e) {
                        if (e.keyCode == 10 || e.keyCode == 13) {
                            // When enter is pressed, update the search results.
                            e.preventDefault();
                            this.Element.Search.$Button.trigger("click");
                        }
                    }
                },
                streetViewSearchButtonClick: function (e) {
                    if (e) {
                        // Don't allow the page to refresh when search button is clicked.
                        e.preventDefault();
                    }
                },
                updateMapWithCoordinates: function (e) {
                    if (e) {
                        // Uses the latitude and longitude textbox coordinates to update the map.
                        var that = this;

                        if (!isNaN(this.Element.Coordinates.$Latitude.val()) && !isNaN(this.Element.Coordinates.$Longitude.val())) {
                            this.NormalMap.setCenter(new google.maps.LatLng(that.Element.Coordinates.$Latitude.val(), that.Element.Coordinates.$Longitude.val()));
                            this.Panorama.setPosition(new google.maps.LatLng(that.Element.Coordinates.$Latitude.val(), that.Element.Coordinates.$Longitude.val()));
                        }
                    }
                },
                updateMapWithSearchResult: function (e) {
                    if (e && e.target) {
                        // If one of the search results is clicked, it will update the map.
                        e.preventDefault();

                        $this = $(e.target);

                        this.Element.Search.$Input.val(this.formatSearchResult($this.data("name"), $this.data("formatted-address")));

                        this.NormalMap.setCenter(new google.maps.LatLng($this.data("latitude"), $this.data("longitude")));
                        this.Panorama.setPosition(new google.maps.LatLng($this.data("latitude"), $this.data("longitude")));

                        this.hideSearchResults();
                    }
                }
            }

            $("[data-google-street-view-map]").each(function () {
                var instance = new GoogleStreetView(this);

                instance.Element.Search.$Input.on("keydown", function (e) {
                    instance.streetViewSearchInputClick(e);
                });
                instance.Element.Search.$Button.on("click", function (e) {
                    instance.streetViewSearchButtonClick(e);
                });
                instance.Element.Search.$ResultsLayout.on("click", "li a", function (e) {
                    instance.updateMapWithSearchResult(e);
                });
                instance.GooglePlacesSearchBox.addListener('places_changed', function () {
                    instance.getSearchResults();
                });
                instance.NormalMap.addListener('bounds_changed', function () {
                    instance.changeMapBounds();
                });
                instance.Panorama.addListener('position_changed', function () {
                    instance.changePanoramaPosition();
                });
                instance.Panorama.addListener('pov_changed', function () {
                    instance.changePanoramaPov();
                });
                instance.Element.Coordinates.$Latitude.on("blur", function (e) {
                    instance.changeLatitude(e);
                });
                instance.Element.Coordinates.$Longitude.on("blur", function (e) {
                    instance.changeLongitude(e);
                });

                instance.init();

            });

        }
        catch(err) {
            console.error(err);
            ErrorCount = ErrorCount + 1;
        }

}(window.google, window.jQuery, window);