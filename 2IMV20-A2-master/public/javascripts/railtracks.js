// Dictionary containing stations codes as keys and station names as values
var stationNames;
// The railtrack we are interested in
var railtrack;
// The list of all railtracks
var railtracks = [];

var loopCounter = 0;

$(document).ready(function() {

    // Load the stations
    getStations();

    // JSON statistics object for selected track
    var trackStat;
    // Total duration of all disruptions in selected date range
    var totalDurationAll = 0;
    // Total amount of all disruptions in selected date range  
    var totalAmountAll = 0;

    // DateRange picker
    $(function() {

        var start = moment([2017]);
        var end = moment([2020]).subtract(1, 'seconds');

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
            maxDate: new Date(2019,11,31),
        }, cb);

        cb(start, end);

    });

    // Get station data + names
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
            stationData = data;
            for (var i = 0; i < data.payload.length; i++) {
                station[data.payload[i].code] = data.payload[i].namen.lang
            }
            stationNames = station;
            initializeTrack();
            initializeSelectInput();
        })
        .fail(function() {
            alert("Could not get the data");
        });
    }


    function initializeSelectInput() {
        // Load in GeoJSON data for the train tracks
        d3.json("../geojson/spoorkaart.geojson", function(json) {
            var selectRailtrack = document.getElementById("selectRailtrack");
            
            for (var i = 0; i < json.features.length; i++) {
                var station = json.features[i];
                if (stationNames[station.properties.to.toUpperCase()] != undefined && stationNames[station.properties.from.toUpperCase()] != undefined) {
                    railtracks.push(station.properties.to + "-" + station.properties.from);
                    var option = document.createElement("option");
                    option.text = stationNames[station.properties.to.toUpperCase()] + " - " + stationNames[station.properties.from.toUpperCase()];
                    option.value = station.properties.to + "-" + station.properties.from;
                    selectRailtrack.add(option); 
                }
            }
            // Create searchable select
            $('.searchableSelect').select2();
        });
    }

    function getRailTrackInfo() {
        trackStat =
        {
            "track": "",
            "times": 0,
            "duration" : 0,
            "causes" : [
            ],
        };

        totalAmountAll = 0;
        totalDurationAll = 0;
        loopCounter = 0;

        var dateRangePicker = $('#reportrange').data('daterangepicker');

        var startDate = dateRangePicker.startDate._d;
        var endDate = dateRangePicker.endDate._d

        var datasets = getDataset(startDate, endDate);

        for (var d = 0; d < datasets.length; d++) {
            d3.csv(datasets[d], function(dataset){
                for (var i = 0; i < dataset.length; i++) {
                    // At end of file when all data is read, quit the loop
                    if (dataset[i].ns_lines == "") {
                        break;
                    }

                    // Skip data that is missing
                    if (dataset[i].start_time == "" || dataset[i].end_time == "") {
                        continue;
                    }

                     // Get start date of disruption
                     var startDisr = dataset[i].start_time.split('-');

                     // Convert to Date format
                     startDisr = new Date(startDisr[2].split(' ')[0], startDisr[1] - 1, startDisr[0]);
 
                     // Get end date of disruption
                     var endDisr = dataset[i].end_time.split('-');
                     // Convert to Date format
                     endDisr = new Date(endDisr[2].split(' ')[0], endDisr[1] - 1, endDisr[0]);
 

                    if (startDate >= startDisr && endDate <= endDisr || startDate <= startDisr && endDate >= endDisr ||
                        startDate >= startDisr && startDate <= endDisr || endDate >= startDisr && endDate <= endDisr) {

                        totalAmountAll += 1;
                        totalDurationAll += parseInt(dataset[i].duration_minutes);

                        getTrackInformation(dataset[i], railtrack.toUpperCase());
                    }
                }
               
                fillDataHTML();

                loopCounter += 1;
                if (loopCounter == datasets.length) { 
                    createAllSunburst(trackStat);
                }   
            });
        }   
    }

    function getTrackInformation(data, railtrack) {
        trackStat.track = railtrack;


        var trackName = data.rdt_station_codes.split(", ");
        var station1Railtrack = railtrack.split("-")[0];
        var station2Railtrack = railtrack.split("-")[1];

        if (trackName.includes(station1Railtrack) && trackName.includes(station2Railtrack)){
            var currentTrack = data;

            var currentInformation = trackStat;

            var causeFound = false;

            if (trackStat.causes.length == 0) {
                trackStat.track = trackName;
                trackStat.times = 1;
                trackStat.duration = parseInt(data.duration_minutes);

                var temp = {
                    "cause_group" : data.cause_group,
                    "duration" : trackStat.duration,
                    "times": 1,
                    "causes" : [
                        {
                            "stat_cause" : data.cause_en,
                            "duration" : trackStat.duration,
                            "times": 1
                        }
                    ]
            
                }
                trackStat.causes.push(temp);
            } else {

                // Check if cause already exist
                for(var z = 0; z < trackStat.causes.length; z++){

                    // Cause exist
                    if (trackStat.causes[z].cause_group == currentTrack.cause_group){
                        causeFound = true;
                        // We have found that our variable already contains that cause group
                        var tempCauses = currentInformation.causes[z];
                        var found = false;
                        for (var x = 0; x < tempCauses.causes.length; x++){


                            // Check for specific cause
                            if (tempCauses.causes[x].stat_cause == currentTrack.cause_en){
                                // increase info for that specific stat_cause
                                trackStat.causes[z].causes[x].duration = trackStat.causes[z].causes[x].duration + parseInt(currentTrack.duration_minutes);
                                trackStat.causes[z].causes[x].times = trackStat.causes[z].causes[x].times + 1;
                                trackStat.causes[z].duration = trackStat.causes[z].duration + parseInt(currentTrack.duration_minutes);
                                trackStat.causes[z].times = trackStat.causes[z].times + 1;
                                trackStat.duration = trackStat.duration + parseInt(currentTrack.duration_minutes);
                                trackStat.times = trackStat.times + 1;
                                found = true;
                            }

                        }
                        if (!found){
                                // Add that specific stat_cause
                                var tempDuration = parseInt(currentTrack.duration_minutes);
                                var temp = {
                                    "stat_cause" : currentTrack.cause_en,
                                    "duration" : tempDuration,
                                    "times": 1
                                };
                                (trackStat.causes[z].causes).push(temp);
                                trackStat.duration = trackStat.duration + parseInt(currentTrack.duration_minutes);
                                trackStat.times = trackStat.times + 1;                            
                                trackStat.causes[z].duration = trackStat.causes[z].duration + parseInt(currentTrack.duration_minutes);
                                trackStat.causes[z].times = trackStat.causes[z].times + 1;
                        }
                    }
                }

                if (!causeFound){
                    var tempDuration = parseInt(currentTrack.duration_minutes);

                    // variable does not yet contain info about that cause group
                    var temp = {
                        "cause_group" : currentTrack.cause_group,
                        "duration" : tempDuration,
                        "times" : 1,
                        "causes" : [
                            {
                                "stat_cause" : currentTrack.cause_en,
                                "duration" : tempDuration,
                                "times": 1
                            }
                        ]
                
                    };

                    trackStat.causes.push(temp);
                    trackStat.times =  trackStat.times + 1;
                    //duration
                    trackStat.duration =  trackStat.duration + tempDuration;
                }
            }   
        }
    }

    function getDataset(startDate, endDate) {
        var datasets = []

        // If start date or end date is in between 01-07-2019 <---> 30-09-2019, take 2019 Q3
        if (startDate <= new Date(2019, 11, 31) && endDate >= new Date(2019,0,01)) {
            datasets.push("../csv/disruptions-2019.csv");
        } 
        // If start date or end date is in between 01-01-2017 <---> 31-12-2018, take 2019 Q1
        if (startDate <= new Date(2018, 11, 31) && endDate >= new Date(2017,0,01)) {
                datasets.push("../csv/disruptions-2017-2018.csv");
        }

        return datasets;
    }

    function fillDataHTML() {
        // Total amount of disruption for the track
        document.getElementById("totalDisruptions").innerHTML = trackStat.times + " disruptions";

        // Total duration of disruptions for the track
        var days = Math.floor(trackStat.duration / (24*60));
        var hours = Math.floor((trackStat.duration % (24*60)) / 60);
        var minutes = (trackStat.duration % (24*60)) % 60;

        document.getElementById("totalDuration").innerHTML = days + " days, " + hours + " hours, " + minutes + " minutes";


        var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
        var dateRangePicker = $('#reportrange').data('daterangepicker');
        var startDate = dateRangePicker.startDate._d;
        var endDate = dateRangePicker.endDate._d
        var diffDays = Math.round(Math.abs((endDate - startDate) / oneDay)); 
        
        document.getElementById("dailyAvgAmt").innerHTML = (trackStat.times / diffDays).toFixed(3) + " disruptions";
        document.getElementById("dailyAvgDuration").innerHTML = (trackStat.duration / diffDays).toFixed(3) + " minutes";
        document.getElementById("avgDurationMins").innerHTML = (trackStat.duration / trackStat.times).toFixed(3) + " minutes";
        document.getElementById("avgDurationHours").innerHTML = "(= " + (trackStat.duration / (trackStat.times * 60)).toFixed(3) + " hours)";
        document.getElementById("percDisrOfTot").innerHTML = "Amount: " + (trackStat.times / totalAmountAll).toFixed(5) + "%";
        document.getElementById("percDurOfTot").innerHTML = "Duration: " + (trackStat.duration / totalDurationAll).toFixed(5) + "%";
    }

    $("#selectTrack").click(function() {
        localStorage.setItem("railtrack", document.getElementById("selectRailtrack").value);
        initializeTrack();
    });
    
    function initializeTrack() {
        if (localStorage.getItem("railtrack")) {
            railtrack = localStorage.getItem("railtrack");
            var station1 = stationNames[railtrack.split('-')[0].toUpperCase()];
            var station2 = stationNames[railtrack.split('-')[1].toUpperCase()];
            localStorage.removeItem("railtrack");
            document.getElementById("titleRailtrack").innerHTML = '<i class="fas fa-train"></i> ' + station1 + " - " + station2;
            getRailTrackInfo();
        } else {
            $("#railtrackSelection").modal("show");
        }
    }

    $('#reportrange').on('apply.daterangepicker', function(ev, picker) {
        getRailTrackInfo();
      });
});