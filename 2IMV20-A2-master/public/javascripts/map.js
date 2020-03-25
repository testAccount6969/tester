$(document).ready(function() { 
    // On load get all stationNames and Coordinates and store all stationData
    var stationNames;
    var stationCoordinates;
    var stationData;
    var railRoadDisruptions;
    var railRoadCauses;
    var cause_groups;
    var railtracks = {};
    var dataTable;
    var startTimeLocal;
    var endTimeLocal;
    var dataLoop;

    $("#resetMapButton").click(function() {showCountry()});
    $("#switch1").click(function() {dayRangeInit()});
    $("#switch2").click(function() {showStationsSwitch()});
    $('#switch1').prop('checked', false);
    $('#switch2').prop('checked', true);
    $("#closeButton").click(function() {closeInfo()});
    $("#dayRangeSlider").on('input', function() {toggleSteps(document.getElementById("dayRangeSlider"))});
    $("#amtDisrSliderLarger").on('input', function() {disrSlider()});
    $("#amtDisrSliderSmaller").on('input', function() {disrSlider()});

    $('[data-toggle="cause-select-tooltip"]').tooltip(); 
    $('[data-toggle="statistics-tooltip"]').tooltip(); 

    document.getElementById("spinner").style.display = "none";

    $('#cause-select').multiselect({
        includeSelectAllOption: true,
        enableClickableOptGroups: true,
        enableCollapsibleOptGroups: true,  
        buttonWidth: '50%',
        enableCaseInsensitiveFiltering: true,
        collapseOptGroupsByDefault: true,
        selectAllJustVisible: false,
    });

    $('#cause-select').change(function() {
        disrSlider(); 
    })

    // DateRange picker
    $(function() {

        var start = moment();
        var end = moment();
        
        function cb(start, end) {
            $('#reportrange span').html('From: '.bold() + start.format('MMMM D, YYYY') + ' To: '.bold() + end.format('MMMM D, YYYY'));
        }

        $('#reportrange').daterangepicker({
            startDate: start,
            endDate: end,
            ranges: {
            '2019': [moment([2019]), moment([2020]).subtract(1, 'seconds')],
            '2018': [moment([2018]), moment([2019]).subtract(1, 'seconds')],
            '2017': [moment([2017]), moment([2018]).subtract(1, 'seconds')],
            '2017-2019': [moment([2017]), moment([2020]).subtract(1, 'seconds')],
            },
            minDate: new Date(2017,0,1),
        }, cb);

        cb(start, end);

    });

    // Get the stations data
    getStations();

    function getStations() {
        var params = {
        };
    
        $.ajax({
            url: "https://gateway.apiportal.ns.nl/public-reisinformatie/api/v2/stations?" + $.param(params),
            beforeSend: function(xhrObj){

                // Request headers
                xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","c30d573b4455430480948bffea6a52a7");
            },
            type: "GET",

            // Request body
            data: "{body}",
        })
        .done(function(data) {
            var station = {};
            var coordinates = [];
            stationData = data;
            for (var i = 0; i < data.payload.length; i++) {
                station[data.payload[i].code] = data.payload[i].namen.lang
                coordinates.push([data.payload[i].namen.lang, data.payload[i].lat, data.payload[i].lng]);
            }
            stationNames = station;
            stationCoordinates = coordinates;

            showCountry();
        })
        .fail(function() {
            alert("Could not get the data");
        });
    }

    // Function that loads GeoJSON of the Netherlands and surrounding countries to display in an SVG
    function showCountry() {
        // In case we reset, remove the old map
        if (document.getElementById("svgMap")) {
            document.getElementById("svgMap").remove()
        }

        //Width and height of the map
        var w = 1200;
        var h = 1000;

        //Define map projection
        var projection = d3.geoMercator()
                                // Translate determines the positioning of the location of the map, this translation focusses on the Netherlands
                            .translate([w/2 - 950, h/2 + 10750])
                                // How far we want to zoom in on the map    
                            .scale([10100]);

        //Define path generator
        var path = d3.geoPath()
                        .projection(projection);

        //Create SVG element
        var svg = d3.select("#svg2")
                    .append("svg")
                    .call(d3.zoom().scaleExtent([1, 8])
                        .on("zoom", function () {
                            svg.attr("transform", d3.event.transform)
                        }))
                        .attr("id", "svgMap");

        //Load in GeoJSON data for the Netherlands, Belgium, Germany and France.

        d3.json("../geojson/nsareatotal.geojson", function(json) {
            //Bind data and create one path per GeoJSON feature
            svg.selectAll("path")
            .data(json.features, function(d){return d;})
            .enter()
            .merge(svg)
            .append("path")
            .attr("d", path)
            .attr("fill", function(d) {
                    if (d.properties.cca2 == "nl") {
                        return "#222222";
                    } else {
                        return "#aaaaaa";
                    }
            });
        });

        // Call function that shows all railroads and inside shows stations
        showRailRoads(projection, svg, path);
    }

    // Function that displays all rail roads
    function showRailRoads(projection, svg, path){
        railRoadDisruptions = {};
        var fillTracks = false;
        if (Object.keys(railtracks).length == 0 ) {
            fillTracks = true;
        }

        // Load in GeoJSON data for the train tracks
        d3.json("../geojson/spoorkaart.geojson", function(json) {
            //Bind data and create one path per GeoJSON feature
            svg.selectAll("path")
            .data(json.features, function(d){return d.properties.to;})
            .enter()
            .append("path")
            .attr("id", function(d) {
                if (fillTracks && stationNames[d.properties.to.toUpperCase()] != undefined && stationNames[d.properties.from.toUpperCase()] != undefined) {
                    railtracks[(d.properties.from + '-' + d.properties.to).toString()] = true;
                }
                return ((d.properties.from + '-' + d.properties.to).toString());
            })
            .attr("d", path)
            .attr("style", "fill:none;stroke:#0000ff;stroke-width:2.5px;")
            .on("mouseover", function(d) {
                    d3.select(this).style(
                        'stroke-width', '6px'

                    )
                    d3.select(this).style('cursor', 'pointer');
                    var text = stationNames[d.properties.from.toUpperCase()] + " - " + stationNames[d.properties.to.toUpperCase()];

                    // Get amount of disruption on the railway track, if there are any in the selected date range
                    var disruptions = getDisruptionAmountRailTrack((d.properties.from + '-' + d.properties.to).toString());
                    // Add the amount of disruptions to the tooltip text
                    if (disruptions) {
                        text += "<br> Amount of disruptions: " + disruptions
                    }
                    displayTooltip(text);
                })                  
                .on("mouseout", function(d) {
                    d3.select(this).style(
                        'stroke-width', '2.5px'
                    )
                    hideTooltip();
                })
                .on("click", function(d) {
                    localStorage.setItem("railtrack", (d.properties.from + '-' + d.properties.to).toString());
                    window.location.replace("/railtracks");
                });
                showStations(projection, svg);
        });
                    
    }


    function showStations(projection, svg){
        // add stations all the stations

        for (var i = 0; i < stationCoordinates.length; i++) {
            var stationCode;
            var hasTracks = false;
            for (var key in stationNames) {
                if (stationNames[key] == stationCoordinates[i][0]) {
                    stationCode = key;
                }
            }
            for (var track in railtracks) {
                if (track.split("-")[0] == stationCode.toLowerCase() || track.split("-")[1] == stationCode.toLowerCase()) {
                    hasTracks = true;
                    break;
                }
            }

            if (hasTracks) {
                coordinates = projection([stationCoordinates[i][2], stationCoordinates[i][1]]);
                svg.append("circle")
                    .attr("cx", coordinates[0])
                    .attr("cy", coordinates[1])
                    .attr("r", 2)
                    .attr("d", stationCoordinates[i])
                    .attr("id", stationCode)
                    .text(function() {
                        return stationCoordinates[i][0];
                    })
                    .attr("fill", "#dddddd")
                    .on("mouseover", function(d) { 
                        var element = d3.select(this);
                        displayTooltip(element._groups[0][0].attributes.d.value.split(',')[0]);
                        element.style("cursor", "pointer");
                    })                  
                    .on("mouseout", function(d) {
                        hideTooltip();
                    })
                    .on("click", function(d) {
                        var text = d3.select(this);
                        if (!document.getElementById("stationInfo").classList.contains('show')) {
                            document.getElementById("stationInfoCollapseButton").click();
                        }
                        var locationAndCoordinates = text._groups[0][0].attributes.d.value;
                        var location =  locationAndCoordinates.split(','[0]);
                        var specificStationInfo = getStationInfo(location[0]);
                        document.getElementById("station").innerHTML = "Station " + location[0];
                        document.getElementById("type").innerHTML = "Type of the station: " +  specificStationInfo.stationType;
                        document.getElementById("sporen").innerHTML = "Amount of rail tracks: " +  specificStationInfo.sporen.length;
                        var trackList = document.getElementById('trackList');
                        $(trackList).empty()
                        for (var i = 0; i < specificStationInfo.sporen.length; i++) {
                            var entry = document.createElement('li');
                            entry.appendChild(document.createTextNode("Track " + specificStationInfo.sporen[i].spoorNummer));
                            trackList.appendChild(entry);
                        }
                        document.getElementById("land").innerHTML = "Location of the station (country): " +  specificStationInfo.land;
                        document.getElementById("informatie").style.display = "block";
                    });
                }
            }
        getDisruptions();
        disrSlider(); 
        showStationsSwitch();
    }

    function getStationInfo(stationName) {
        for (var i = 0; i < stationData.payload.length; i++){
            if (stationData.payload[i].namen.lang == stationName){
                return stationData.payload[i];
            }
        }

    };


    function getDisruptions(dayRangeStartDate) {
        // Reset the disruptions (if ran multiple times)
        resetMap()

        document.getElementById("spinner").style.display = "block";

        document.getElementById("amtDisr").innerHTML = 0;
        document.getElementById("avgDisr").innerHTML = 0;

        var startDate;
        var endDate;

        if (dayRangeStartDate != null) {
            startDate = dayRangeStartDate;
            endDate = dayRangeStartDate;
        } else {
            var dateRangePicker = $('#reportrange').data('daterangepicker');
            startTimeLocal = dateRangePicker.startDate;
            endTimeLocal = dateRangePicker.endDate;
            var startDate = dateRangePicker.startDate._d;
            var endDate = dateRangePicker.endDate._d
        }
        var durationSum = 0;
        railRoadDisruptions = {};
        railRoadCauses = {};
        cause_groups = {};

        var datasets = getDataset(startDate, endDate);
        dataLoop = 0;

        for (var d = 0; d < datasets.length; d++) {
            d3.csv(datasets[d], function(data){
                for (var y = 0; y < data.length; y++) {
                    var subsets = [];

                    // At end of file when all data is read, quit the loop
                    if (data[y].ns_lines == "") {
                        break;
                    }

                    // Skip data that is missing
                    if (data[y].start_time == "" || data[y].end_time == "") {
                        continue;
                    }

                    // Get start date of disruption
                    var startDisr = data[y].start_time.split('-');

                    // Convert to Date format
                    startDisr = new Date(startDisr[2].split(' ')[0], startDisr[1] - 1, startDisr[0]);

                    // Get end date of disruption
                    var endDisr = data[y].end_time.split('-');
                    // Convert to Date format
                    endDisr = new Date(endDisr[2].split(' ')[0], endDisr[1] - 1, endDisr[0]);

                    // Check if disruption happened between selected date range
                    if (startDate >= startDisr && endDate <= endDisr || startDate <= startDisr && endDate >= endDisr ||
                        startDate >= startDisr && startDate <= endDisr || endDate >= startDisr && endDate <= endDisr) {
                        // Update amount of disruptions found on page
                        document.getElementById("amtDisr").innerHTML = parseInt(document.getElementById("amtDisr").innerHTML) + 1;
                        durationSum = durationSum + parseInt(data[y].duration_minutes);
                        var stations = data[y].rdt_station_codes.split(', ');

                        for(var i = 0; i < stations.length; i++) {
                            for(var x = i+1; x < stations.length; x++) {
                                if (railtracks[(stations[i] + '-' + stations[x]).toString().toLowerCase()]){
                                    subsets.push((stations[i] + '-' + stations[x]).toString().toLowerCase());
                                } else if (railtracks[(stations[x] + '-' + stations[i]).toString().toLowerCase()]) {
                                    subsets.push((stations[x] + '-' + stations[i]).toString().toLowerCase());
                                }
                            }
                        }
                        for (var i = 0; i < subsets.length; i++) {
                            // Count number of disruptions per railway track
                            if (railRoadDisruptions[subsets[i]]) {
                                railRoadDisruptions[subsets[i]] = railRoadDisruptions[subsets[i]] + 1;
                                if (!railRoadCauses[subsets[i]][data[y].cause_group]) {
                                    railRoadCauses[subsets[i]][data[y].cause_group] = [data[y].cause_en];
                                } else if (!railRoadCauses[subsets[i]][data[y].cause_group].includes(data[y].cause_en)) {
                                    railRoadCauses[subsets[i]][data[y].cause_group].push(data[y].cause_en);
                                }
                            } else {
                                railRoadDisruptions[subsets[i]] = 1;
                                railRoadCauses[subsets[i]] = {};
                                railRoadCauses[subsets[i]][data[y].cause_group] = [data[y].cause_en];
                            }
                        }
                        if (durationSum > 0) {
                            document.getElementById("avgDisr").innerHTML = (durationSum / parseInt(document.getElementById("amtDisr").innerHTML)).toFixed(2) + " minutes";
                        }
                    }
                }

                updateSliders();
                fillTable();
                fillSelectCauses();
                dataLoop += 1;
                if (dataLoop == datasets.length) {
                    disrSlider();
                    document.getElementById("spinner").style.display = "none";
                }
            });
        }
    }

    function getDataset(startDate, endDate) {
        datasets = []
        document.getElementById("live").style.display = "none";
        document.getElementById("past").style.display = "inline";

        // If start date or end date is in between 01-07-2019 <---> 30-09-2019, take 2019 Q3
        if (startDate <= new Date(2019, 11, 31) && endDate >= new Date(2019,0,01)) {
            datasets.push("../csv/disruptions-2019.csv");
        } 
        // If start date or end date is in between 01-01-2017 <---> 31-12-2018, take 2019 Q1
        if (startDate <= new Date(2018, 11, 31) && endDate >= new Date(2017,0,01)) {
            datasets.push("../csv/disruptions-2017-2018.csv");
        }

        // check if startdate is from today to future (look at actual disruptions)
        if (startDate >= (new Date() - 86400000)) {
            document.getElementById("live").style.display = "inline";
            document.getElementById("past").style.display = "none";
            var params = {
                // Request parameters
                "type": "{string}",
                "actual": "{boolean}",
                "lang": "{string}",
            };
        
            $.ajax({
                url: "https://gateway.apiportal.ns.nl/public-reisinformatie/api/v2/disruptions?" + $.param(params),
                beforeSend: function(xhrObj){
                    // Request headers
                    xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","c30d573b4455430480948bffea6a52a7");
                },
                type: "GET",
                // Request body
                data: "{body}",
            })
            .done(function(data) {
                var actualDisruptionDataset = [];
                var disruption = {}
                for (var i = 0; i < data.payload.length; i++) {
                    if (data.payload[i].verstoring) {
                        var startDate1;
                        var endDate1;
                        if (data.payload[i].verstoring.type == "STORING") {
                            startDate1 = data.payload[i].verstoring.trajecten[0].begintijd;
                            endDate1 = data.payload[i].verstoring.trajecten[0].eindtijd;
                            disruption.stations = [];
                            var stations = []
                            for (var x = 0; x < data.payload[i].verstoring.baanvakken.length; x++) {
                                for (var y = 0; y < data.payload[i].verstoring.baanvakken[x].stations.length; y++) {
                                    stations.push(data.payload[i].verstoring.baanvakken[x].stations[y]);
                                }
                                disruption.stations.push(stations);
                                stations = [];
                            }
                        } else {
                            startDate1 = data.payload[i].verstoring.geldigheidsLijst[0].startDatum;
                            endDate1 = data.payload[i].verstoring.geldigheidsLijst[0].eindDatum;
                            disruption.stations = [];
                            var stations = []
                            for (var x = 0; x < data.payload[i].verstoring.trajecten.length; x++) {
                                for (var y = 0; y < data.payload[i].verstoring.trajecten[x].stations.length; y++) {
                                    stations.push(data.payload[i].verstoring.trajecten[x].stations[y]);
                                }
                                disruption.stations.push(stations);
                                stations = [];
                            }
                        }
                        disruption.startDate = startDate1;
                        disruption.endDate = endDate1;
                        
                    }
                    actualDisruptionDataset.push(disruption);
                    disruption = {};
                }
                drawMapActualDisruptions(actualDisruptionDataset, startDate, endDate);
                
            })
            .fail(function() {
                alert("error");
            });
        }
        if(datasets.length == 0) {
            document.getElementById("spinner").style.display = "none";
        }

        if (startDate >= new Date(2020,0,1) || endDate >= new Date(2020,0,1)) {
            document.getElementById("moreStat").disabled = true; 
            document.getElementById("moreStat").style.cursor = "not-allowed"; 
        }
        else {
            document.getElementById("moreStat").disabled = false; 
            document.getElementById("moreStat").style.cursor = "pointer";
        }
        return datasets;
    }

    function drawMapActualDisruptions(disruptions, startDate, endDate) {
        var subsets;
        var durationSum = 0;
        var colorStations = [];
        if (startDate == endDate) {
            var endDate = new Date(endDate);
            endDate.setDate(endDate.getDate() + 1);
        }

        for (var y = 0; y < disruptions.length; y++) {
            startDisr = new Date(disruptions[y].startDate);
            endDisr = new Date(disruptions[y].endDate);
            duration_minutes = (endDisr - startDisr)/60000;
            subsets = [];

            // Check if disruption happened between selected date range
            if (startDate >= startDisr && endDate <= endDisr || startDate <= startDisr && endDate >= endDisr ||
                startDate >= startDisr && startDate <= endDisr || endDate >= startDisr && endDate <= endDisr) {
                // Update amount of disruptions found on page
                document.getElementById("amtDisr").innerHTML = parseInt(document.getElementById("amtDisr").innerHTML) + 1;
                durationSum = durationSum + duration_minutes;
                var stations = disruptions[y].stations;
                for (var i = 0; i < stations.length; i++) {
                    for (var u = 0; u < stations[i].length; u++) {
                        // Color disrupted stations red
                    paths = d3.selectAll("#" + stations[i][u].toUpperCase());
                    paths.style(
                        'stroke', '#ff0000');
                    colorStations.push(paths);
                    for(var x = u+1; x < stations[i].length; x++) {
                        if (railtracks[(stations[i][u] + '-' + stations[i][x]).toString().toLowerCase()]) {
                            subsets.push((stations[i][u] + '-' + stations[i][x]).toString().toLowerCase());
                        } else if (railtracks[(stations[i][x] + '-' + stations[i][u]).toString().toLowerCase()]) {
                            subsets.push((stations[i][x] + '-' + stations[i][u]).toString().toLowerCase());
                        }
                    }
                    }
                }
                subsets = [...new Set(subsets)];
                for (var i = 0; i < subsets.length; i++) {
                    // Count number of disruptions per railway track
                    if (railRoadDisruptions[subsets[i]]) {
                        railRoadDisruptions[subsets[i]] = railRoadDisruptions[subsets[i]] + 1;
                    } else {
                        railRoadDisruptions[subsets[i]] = 1;
                    }
                    // Color disrupted railways red
                    paths = d3.selectAll("#" + subsets[i]);
                    paths.style(
                        'stroke', "#ff0000")
                    paths.style("stroke-width", '2px');
                    paths.each(function() {
                        this.parentNode.appendChild(this);
                    });
                }
                if (durationSum > 0) {
                    document.getElementById("avgDisr").innerHTML = (durationSum / parseInt(document.getElementById("amtDisr").innerHTML)).toFixed(2) + " minutes";
                }
            }
        }

        for (paths in colorStations) {
            colorStations[paths].each(function() {
                this.parentNode.appendChild(this);
            });
        }
        updateSliders();
        fillTable();
        document.getElementById("spinner").style.display = "none";
    }
      


    // Function that will display a tooltip with the given text
    function displayTooltip(text) {
        // Create a tooltip div element
        var tooltip = d3.select("body")
                        .append("div")	
                        .attr("class", "tooltip")				
                        .style("opacity", 0);

        // Show the tooltip with a slight transition
        tooltip.transition()
                .duration(200)		
                .style("opacity", .9);	

        // Display the text in the tooltip
        tooltip.html(text)
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");
    }

    // Hides tooltips
    function hideTooltip() {
        // Select all tooltip element from the page
        var tooltip = d3.selectAll(".tooltip");

        // Set tooltip opacity to 0 with transition
        tooltip.transition()		
            .duration(500)		
            .style("opacity", 0);
    }

    // Check if railtrack has disruptions in the selected date range, if it does, return the amount, otherwise return false
    function getDisruptionAmountRailTrack(id) {
        if (railRoadDisruptions[id]) {
            return railRoadDisruptions[id]
        } else {
            return false;
        }
    }


    // Returns an array of dates between the two dates
    var getDates = function(startDate, endDate) {
        var dates = [],
            currentDate = startDate,
            addDays = function(days) {
            var date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
            };
        while (currentDate <= endDate) {
        dates.push(currentDate);
        currentDate = addDays.call(currentDate, 1);
        }
        return dates;
    };


    function toggleSteps(element) {
        var dateRangePicker = $('#reportrange').data('daterangepicker');
        var startDate = new Date(dateRangePicker.startDate._d);
        var endDate = new Date(dateRangePicker.endDate._d);

        var values = getDates(startDate, endDate);
        var output = document.getElementById('output');
        var date = values[element.value];
        getDisruptions(date);
        date = moment(date).format('MMMM D, YYYY');
        output.innerHTML = date;
    }

    function dayRangeInit() {
        var daySwitch = document.getElementById("switch1");

        if (daySwitch.checked) {
            var dateRangePicker = $('#reportrange').data('daterangepicker');
            var startDate = new Date(dateRangePicker.startDate._d);
            var endDate = new Date(dateRangePicker.endDate._d);

            var values = getDates(startDate, endDate);
            $('#dayRangeSlider').prop({
                'max': values.length - 1,
                'value': 0
            });
            var output = document.getElementById('output');
            var date = values[0];
            getDisruptions(date);
            date = moment(date).format('MMMM D, YYYY');
            output.innerHTML = date;
        } else {
            getDisruptions();
        }
    }

    function resetMap() {
        for(var track in railtracks) {
            d3.selectAll("#" + track).attr("style", "fill:none;stroke:#0000ff;stroke-width:2.5px;");
        }

        for(key in stationNames) {
            d3.selectAll("#" + key).style(
                'stroke', '#0000ff')
        }
    }

    function showStationsSwitch() {
        var stationSwitch = document.getElementById("switch2");
        if (stationSwitch.checked) {
            for(key in stationNames) {
                d3.selectAll("#" + key).attr("display", "inline");
            }
        } else {
            for(key in stationNames) {
                d3.selectAll("#" + key).attr("display", "none");
            }
        }
    }

    function disrSlider() {
        var sliderLarger = document.getElementById("amtDisrSliderLarger");
        var outputLarger = document.getElementById('outputAmtDisrSliderLarger');
        outputLarger.innerHTML = sliderLarger.value + " disruption(s)";

        var sliderSmaller = document.getElementById("amtDisrSliderSmaller");
        var outputSmaller = document.getElementById('outputAmtDisrSliderSmaller');
        outputSmaller.innerHTML = sliderSmaller.value + " disruption(s)";

        // Get selected options for causes.
        var selectedOptions = $('#cause-select option:selected');
        var selectedCauses = []
        selectedOptions.each(function() {
            selectedCauses.push(this.value);
        });
        var railroadInCauseSelection = false;

        railRoadDisruptions = sort_object(railRoadDisruptions);

        // Loop for drawing disruptions on rail tracks first
        for (key in railRoadDisruptions) {
            railroadInCauseSelection = false;
            for (cause_group in railRoadCauses[key]) {
                if (selectedCauses.filter(value => railRoadCauses[key][cause_group].includes(value)).length > 0) {
                    railroadInCauseSelection = true;
                }
            }
            if (railRoadDisruptions[key] < sliderLarger.value || railRoadDisruptions[key] > sliderSmaller.value || !railroadInCauseSelection) {
                var paths = d3.selectAll("#" + key);
                    paths.style(
                        'stroke', '#0000ff')
                    paths.style("stroke-width", '2px');            
            } else {
                var color = colorRailTracks(railRoadDisruptions[key]);
                var paths = d3.selectAll("#" + key);
                    paths.style(
                        'stroke', color)
                    paths.style("stroke-width", '2px');
                    paths.each(function() {
                        this.parentNode.appendChild(this);
                    });
            }
        }

        // Loop for drawing disruptions of disrupted stations on the railtracks

        var stationsInRange = [];
        var stationsOutOfRange = [];
        for (key in railRoadDisruptions) {
            railroadInCauseSelection = false;
            for (cause_group in railRoadCauses[key]) {
                if (selectedCauses.filter(value => railRoadCauses[key][cause_group].includes(value)).length > 0) {
                    railroadInCauseSelection = true;
                }
            }
            if (railRoadDisruptions[key] < sliderLarger.value || railRoadDisruptions[key] > sliderSmaller.value || !railroadInCauseSelection) {
                stationsOutOfRange.push(key.split('-')[0]);
                stationsOutOfRange.push(key.split('-')[1]);
            } else {
                stationsInRange.push([key.split('-')[0], colorRailTracks(railRoadDisruptions[key])]);
                stationsInRange.push([key.split('-')[1], colorRailTracks(railRoadDisruptions[key])]);
            }
        }

        console.log(stationsOutOfRange);

        stationsOutOfRange = stationsOutOfRange.filter( ( el ) => !stationsInRange.includes( el ) );

        for (var i = 0; i < stationsInRange.length; i++) {
            var station = d3.selectAll("#" + stationsInRange[i][0].toUpperCase());
            station.style('stroke', stationsInRange[i][1]);
            station.each(function() {
                this.parentNode.appendChild(this);
            });
        }
        console.log(stationsOutOfRange);
        for (var i = 0; i < stationsOutOfRange.length; i++) {
            var station = d3.selectAll("#" + stationsOutOfRange[i].toUpperCase());
            station.style('stroke', '#0000ff');
        }

        drawColorLegend();

    }

    function updateSliders() {
        var max = 1;
        var min = 9999;

        for (key in railRoadDisruptions) {
            if (railRoadDisruptions[key] > max) {
                max = railRoadDisruptions[key];
            }

            if (railRoadDisruptions[key] < min) {
                min = railRoadDisruptions[key];
            }
        }

        var sliderLarger = document.getElementById('amtDisrSliderLarger');
        var outputLarger = document.getElementById('outputAmtDisrSliderLarger');
        sliderLarger.max = max;
        sliderLarger.value = 1;
        outputLarger.innerHTML = sliderLarger.value + " disruption(s)";

        var sliderSmaller = document.getElementById('amtDisrSliderSmaller');
        var outputSmaller = document.getElementById('outputAmtDisrSliderSmaller');
        sliderSmaller.max = max;
        sliderSmaller.value = max;
        outputSmaller.innerHTML = sliderSmaller.value + " disruption(s)";

        if (max == 1) {
            sliderLarger.disabled = true;
            sliderSmaller.disabled = true;
        } else {
            sliderLarger.disabled = false;
            sliderSmaller.disabled = false;
        }
    }

    function colorRailTracks(disruptions) {
        var max = 1;
        var min = 9999;

        for (track in railRoadDisruptions) {
            if (railRoadDisruptions[track] > max) {
                max = railRoadDisruptions[track];
            }

            if (railRoadDisruptions[track] < min) {
                min = railRoadDisruptions[track];
            }
        }

        var color = d3.scaleLinear()
        .domain([0, 1])
        .range(["#ffbb00", "#dd0000"]);

        var percTotal = disruptions / max;
        // var amtGreen = Math.pow(Math.floor((1-percTotal)*15), 2);
        // return rgbToHex(255, amtGreen, 0);
        // var amtGreen = Math.pow(Math.floor((1-percTotal)*4),2);
        // return "#ff" + amtGreen + amtGreen + "00";
        var c = color(percTotal);
        var colors = c.toString().split(", ");
        var red = colors[0].split("(")[1];
        var green = colors[1];
        var blue = colors[2].split(")")[0];
        return rgbToHex(red, green, blue);
    }
      
      function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + ((+r) << 16) + ((+g) << 8) + (+b)).toString(16).slice(1);
      }
      

    function sort_object(obj) {
        items = Object.keys(obj).map(function(key) {
            return [key, obj[key]];
        });
        items.sort(function(first, second) {
            return first[1] - second[1];
        });
        sorted_obj={}
        $.each(items, function(k, v) {
            use_key = v[0]
            use_value = v[1]
            sorted_obj[use_key] = use_value
        })
        return(sorted_obj)
    } 

    function drawColorLegend() {
        var width  = 20;
        var height = 200;
        var maxDomain = railRoadDisruptions[Object.keys(railRoadDisruptions)[Object.keys(railRoadDisruptions).length -1]];  
        if (!maxDomain || maxDomain <= 1) {
            htmlDiv.style.display = "none";
        } else {
            if (d3.select("#colorLegend")._groups[0][0] == null) {

                // Create the SVG element and set its dimensions.
                var htmlDiv = document.getElementById("colorLegendContainer");
                htmlDiv.innerHTML = '<div class="h6 mb-0 font-weight-bold text-gray-500" style="padding-bottom: 13px;">Number of disruptions</div>';
                htmlDiv.style.display = "block";

                var div = d3.select("#colorLegendContainer");
                var svg = div.append('svg');          
                svg.attr('width', width).attr('height', height).attr("id", "colorLegend")
                    .append('rect')
                        .attr("fill", "#0000ff")
                        .attr('width', width)
                        .attr('height', height/10);

                // Create the svg:defs element and the main gradient definition.
                var svgDefs = svg.append('defs');

                var mainGradient = svgDefs.append('linearGradient')
                    .attr('id', 'mainGradient')
                    .attr("x1", "0%")
                    .attr("x2", "0%")
                    .attr("y1", "0%")
                    .attr("y2", "100%");

                // Create the stops of the main gradient. Each stop will be assigned
                // a class to style the stop using CSS.
                mainGradient.append('stop')
                    .attr('class', 'start')
                    .attr("offset", "0%")
                    .attr("stop-color", "#ffbb00")
                    .attr("stop-opacity", 1);

                mainGradient.append('stop')
                    .attr('class', 'end')
                    .attr("offset", "100%")
                    .attr("stop-color", "#dd0000")
                    .attr("stop-opacity", 1);


                svg.append('rect')
                    .attr("fill", "url(#mainGradient)")
                    .attr('width', width)
                    .attr('height', 9*height/10)
                    .attr('x', 0)
                    .attr('y', height/10);
                }
            var div = d3.select("#colorLegendContainer");
            // create svg element


            if (!document.getElementById("colorLegendAxis")) {
               legend = div.append("svg").attr("width", 30).attr("height", height).attr("id", "colorLegendAxis");
            }
            // Create the scale
            var y0 = d3.scaleLinear()
            .domain([0, 1])         // This is what is written on the Axis: from 0 to 100
            .range([0, height/10]);       // This is where the axis is placed: from 100px to 200px

            d3.select("#legendAxis0").remove();

            // Draw the axis
            legend
            .append("g")
            .attr("id", "legendAxis0")
            .call(d3.axisRight(y0).tickValues([0])
            .tickFormat(function(d){
                console.log(d);
                if (Number.isInteger(d)) {
                    return d;
                }
            }));

            var y = d3.scaleLinear()
            .domain([1, maxDomain])         // This is what is written on the Axis: from 0 to 100
            .range([height/10, 200]);       // This is where the axis is placed: from 100px to 200px

            d3.select("#legendAxis").remove();

            var tickValues;
            
            if (maxDomain == 2) {
                tickValues = [1, 2];
            } else if (maxDomain > 2 && maxDomain < 10) {
                tickValues = [1, Math.floor(maxDomain/2), maxDomain]
            } else {
                tickValues = [1, Math.floor(maxDomain/4), Math.floor(maxDomain/2), Math.floor(3*maxDomain/4), maxDomain];
            }

            // Draw the axis
            legend
            .append("g")
            .attr("id", "legendAxis")
            .call(d3.axisRight(y).tickValues(tickValues));
            // .tickFormat(function(d){
            //     console.log(d);
            //     if (Number.isInteger(d)) {
            //         return d;
            //     }
            // }));

        }
    }

    function fillTable() {
        var dataset = [];

        for (var track in railtracks) {
            if (railRoadDisruptions[track] == undefined) {
                dataset.push([stationNames[track.split('-')[0].toUpperCase()] + ' - ' + stationNames[track.split('-')[1].toUpperCase()], 0]);
            }
        }
        
        for (var key in railRoadDisruptions) {
            dataset.push([stationNames[key.split('-')[0].toUpperCase()] + ' - ' + stationNames[key.split('-')[1].toUpperCase()], railRoadDisruptions[key], ])
        }


        // $("#tableDisruptions tbody tr").remove();
        dataTable.clear();
        dataTable.rows.add(dataset);
        dataTable.draw();
        dataTable.order();
    }

    function fillSelectCauses() {
        var select = document.getElementById("cause-select");

        while (select.hasChildNodes()) {
            select.removeChild(select.lastChild);
          }

        for(railRoad in railRoadCauses) {
            for (cause_group in railRoadCauses[railRoad]) {
                if (!cause_groups[cause_group]) {
                    cause_groups[cause_group] = [];
                }
                for (var i = 0; i < railRoadCauses[railRoad][cause_group].length; i++) {
                    if (!cause_groups[cause_group].includes(railRoadCauses[railRoad][cause_group][i])) {
                        cause_groups[cause_group].push(railRoadCauses[railRoad][cause_group][i])
                    }
                }
            }
        }

        for (cause_group in cause_groups) {
            var optgroup = document.createElement("optgroup");
            optgroup.label = cause_group;
            for (var i = 0; i < cause_groups[cause_group].length; i++) {
                var option = document.createElement("option");
                option.text = cause_groups[cause_group][i];
                option.checked = true;
                optgroup.appendChild(option);
            }
            select.add(optgroup);
        }

        $("#cause-select").multiselect('rebuild');
        $("#cause-select").multiselect('selectAll', false);
        $("#cause-select").multiselect('updateButtonText');
    }

    $("#moreStat").click( function(e) {
        e.preventDefault();
        var daySwitch = document.getElementById("switch1");

        if (daySwitch.checked) {
            var dateRangePicker = $('#reportrange').data('daterangepicker');
            var startDate = new Date(dateRangePicker.startDate._d);
            var endDate = new Date(dateRangePicker.endDate._d);

            var values = getDates(startDate, endDate);
            var date = values[document.getElementById("dayRangeSlider").value];
            localStorage.setItem("start", date);
            localStorage.setItem("end", date);
        } else {
            localStorage.setItem("start", startTimeLocal);
            localStorage.setItem("end", endTimeLocal);
        }
        window.location.href = 'http://localhost:8080/statistics';
    });


    // Open/close button change direction when clicked
    $( ".toggle" ).click( function() { 
        $(this).children().toggleClass('flip'); 
    }); 

    $('#reportrange').on('apply.daterangepicker', function(ev, picker) {
        dayRangeInit();
      });

    $('.container-fluid').height($('.container-fluid').height() - $('.navbar').outerHeight());

    dataTable = $('#tableDisruptions').DataTable({
        "order": [[ 1, "desc" ]],
        "pagingType": "full"
    });

    $('#tableDisruptions tbody').on('mouseenter', 'tr', function () {
        var data = dataTable.row( this ).data();
        for (var track in railtracks) {
            if(stationNames[track.split('-')[0].toUpperCase()] + ' - ' + stationNames[track.split('-')[1].toUpperCase()] === data[0]) {
                paths = d3.selectAll("#" + track);
                paths.style("stroke-width", '10px');
                d3.selectAll("#" + track.split('-')[0].toUpperCase()).attr("r", 5);
                d3.selectAll("#" + track.split('-')[1].toUpperCase()).attr("r", 5);
            }
        }
    });

    $('#tableDisruptions tbody').on('mouseleave', 'tr', function () {
        var data = dataTable.row( this ).data();
        for (var track in railtracks) {
            if(stationNames[track.split('-')[0].toUpperCase()] + ' - ' + stationNames[track.split('-')[1].toUpperCase()] === data[0]) {
                paths = d3.selectAll("#" + track);
                paths.style("stroke-width", '3px');
                d3.selectAll("#" + track.split('-')[0].toUpperCase()).attr("r", 2);
                d3.selectAll("#" + track.split('-')[1].toUpperCase()).attr("r", 2);
            }
        }
    });

    $('#tableDisruptions tbody').on('click', 'tr', function () {
        var data = dataTable.row( this ).data();
        for (var track in railtracks) {
            if(stationNames[track.split('-')[0].toUpperCase()] + ' - ' + stationNames[track.split('-')[1].toUpperCase()] === data[0]) {
                localStorage.setItem("railtrack", track);
                window.location.replace("/railtracks");
            }
        }
    });
});
