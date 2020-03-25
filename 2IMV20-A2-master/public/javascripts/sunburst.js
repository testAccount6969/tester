// Keep track of start and end date
var globalStartDate;
var globalEndDate;

// Global infoStat array
var infoStat = [];
// Keeps track if visualisation based on duration will need to be made
var durationBool;
// Keep track if sunburst had been removed
var removed = false;
// Total size of all segments; we set this later, after loading the data.
var totalSize = 0; 

// DateRange picker
$(function() {
    var localStart = localStorage.getItem("start");
    var localEnd = localStorage.getItem("end");
    var localStartDate = moment(new Date(localStart));
    var localEndDate = moment(new Date(localEnd));
    var start = moment();
    var end = moment();

    var start = moment([2017]);
    var end = moment([2020]).subtract(1, 'seconds');

    // Check if there is local storage
    if(localStart != null){
        start = localStartDate;
        end = localEndDate; 
    }

    function cb(start, end) {
        $('#reportrange span').html('From: '.bold() + start.format('MMMM D, YYYY') + ' To: '.bold() + end.format('MMMM D, YYYY'));

        // Call the getData function to get Sunburst
        createSunburst(true);

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

// SUNBURST VARIABLES
// Dimensions of sunburst.
var width = 750;
// Set to 950 to get breadcrump to work better
var height = 600;
var radius = Math.min(width, height) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
    w: 250, h: 30, s: 3, t: 10
};

// Mapping of step names to colors.
var colors = {
    "accidents": "#bbbbbb",
    "engineering work": "#a173d1",
    "external": "#5687d1",
    "infrastructure": "#de783b",
    "logistical": "#7b615c",
    "staff" : "#e4f111",
    "rolling stock": "#6ab975",
    "weather": "#c7c3f5",
    "unknown" : "#babe69"
};

// Global variable to keep track of sideCOlors, hence not the main causes but more specific
var sideColors = {

};

var partition = d3.partition()
    .size([2 * Math.PI, radius * radius]);

var arc = d3.arc()
    .startAngle(function(d) { return d.x0; })
    .endAngle(function(d) { return d.x1; })
    .innerRadius(function(d) { return Math.sqrt(d.y0); })
    .outerRadius(function(d) { return Math.sqrt(d.y1); });

// Function that get's sunburst based on 1 date
function getSunburst(date){
    if (date == 2017){
        globalStartDate = new Date(2017, 0, 01);
        globalEndDate = new Date(2017, 11, 31);
    }
    else if (date == 2018){
        globalStartDate = new Date(2018, 0, 01);
        globalEndDate = new Date(2018, 11, 31);       
    }
    else if (date == 2019) {
        globalStartDate = new Date(2019, 0, 01);
        globalEndDate = new Date(2019, 11, 31);
    }
    else if (date == 20172019) {
        globalStartDate = new Date(2017, 0, 01);
        globalEndDate = new Date(2019, 11, 31);
    }
    createSunburst(true);
}

// Function that creates sunburst based on bool, so duration or freq
function createSunburst(bool){

    // Check if we need to remove existing sunburst
    if (document.getElementById("sunburstSVGDUR")) {
        document.getElementById("sunburstSVGDUR").remove();
        document.getElementById("sunburstSVGFREQ").remove();
        document.getElementById("trailFreq").remove();
        document.getElementById("trailDur").remove();

        // Set removed to true to redraw legend
        removed = true;
    }

    // Function that will createSunburst
    getData(bool);
    
}

// Function that transforms json object to correct formate
function transformData(data, bool){

    // Variable that will be returned, base of the data file
    var sunburstData = {
        children : [
        ],

        name: 'root'
    };

    var colorSet = [];

    // based on frequency
    if (!bool){

        // Loop over every cause
        for (var i = 0; i < data.length; i++){
            
            var hierarchyExample = {
                children: [
        
                ],
                name: data[i].cause
                
            };

            // For every cause, loop over there specific statistical cause
            for (var j = 0; j < data[i].causes.length; j++){
                var intermediateData = data[i];
                var hierarchyEnd = {
                    name : intermediateData .causes[j].statistical_cause,
                    size : intermediateData .causes[j].times
                };

                // Add info for specific statistical cause to json object
                hierarchyExample.children.push(hierarchyEnd);

                
                // Check if this specific clause exist in subset
                if (!colorSet.includes(intermediateData.causes[j].statistical_cause)){

                    // generate a random color
                    var randomColor ='#'+Math.random().toString(16).substr(2,6);
                    var stat_cause = intermediateData.causes[j].statistical_cause;
                    //sideColors[stat_cause] = randomColor;

                }

            };

            sunburstData.children.push(hierarchyExample);
        }
    }
    else {
        // Loop over every cause
        for (var i = 0; i < data.length; i++){

            var hierarchyExample = {
                children: [
        
                ],
                name: data[i].cause
                
            };

            // For every cause, loop over there specific statistical cause
            for (var j = 0; j < data[i].causes.length; j++){
                var intermediateData = data[i];
                var hierarchyEnd = {
                    name : intermediateData .causes[j].statistical_cause,
                    size : intermediateData .causes[j].duration
                };

                // Add info for specific statistical cause to json object
                hierarchyExample.children.push(hierarchyEnd);

                
                // Check if this specific clause exist in subset
                if (!colorSet.includes(intermediateData.causes[j].statistical_cause)){

                    // generate a random color
                    var randomColor ='#'+Math.random().toString(16).substr(2,6);
                    var stat_cause = intermediateData.causes[j].statistical_cause;
                    sideColors[stat_cause] = randomColor;

                }

            };

            sunburstData.children.push(hierarchyExample);
        }
    }

    return sunburstData;

}

// Function that makes data Object for d3

function getData(bool) {

    var localStart = localStorage.getItem("start");
    var localEnd = localStorage.getItem("end");
    var startDate;
    var endDate;

    if(localStart != null){
        var startDate = new Date(localStart);
        var endDate = new Date(localEnd); 
        localStorage.clear();
    }
    else if (globalStartDate != null){
        startDate = globalStartDate;
        endDate = globalEndDate;
    }
    else {
        var dateRangePicker = $('#reportrange').data('daterangepicker');
        var startDate = dateRangePicker.startDate._d;
        var endDate = dateRangePicker.endDate._d
    }

    // Update text from stat page
    document.getElementById("amtDisr").innerHTML = 0;
    document.getElementById("avgDisr").innerHTML = 0;
    document.getElementById("totDisr").innerHTML = 0;
    document.getElementById("avgDisrDays").innerHTML = 0;
    document.getElementById("dayAvgDisr").innerHTML = 0;
    
    var json;
    infoStat = [];
    var datasetCheck = 0;

    var amountCheck = 0;
    var datasets = getDataset(startDate, endDate);
    
    for (var d = 0; d < datasets.length; d++) {
        datasetCheck++;
        var datasetBool = false;

        if (datasets.length == datasetCheck){
            var datasetBool = true;
            
        }
        d3.csv(datasets[d], function(data){
            for (var y = 0; y < data.length; y++) {
                if (data[y].cause_group == ""){
                    data[y].cause_group = "unknown"
                }
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
                
                // Keep track of total duration
                var totalDuration = 0;

                // Check if disruption happened between selected date range
                if (startDate >= startDisr && endDate <= endDisr || startDate <= startDisr && endDate >= endDisr ||
                    startDate >= startDisr && startDate <= endDisr || endDate >= startDisr && endDate <= endDisr) {

                    // Create data object
                    var cause = data[y].cause_group;
                    var stat_cause = data[y].cause_en;
                    var duration = parseInt(data[y].duration_minutes);
                    var normalCauseCheck = true;
                    var statCauseCheck = true;
                    var statCauseNumber;

                    for (var i = 0; i< infoStat.length; i++) {
                        // Check if the cause already exist
                        if (infoStat[i].cause == cause){
                            normalCauseCheck = false;

                            // Current amount of times this cause happened
                            amount = infoStat[i].times;

                            // Update the amount
                            infoStat[i].times = amount + 1;

                            // Get current duration
                            current_duration = infoStat[i].duration;
                            
                            // Update the duration for that cause
                            infoStat[i].duration = current_duration + duration;

                            // Remember place of that cause
                            statCauseNumber = i;
                            
                            for (var j = 0; j< infoStat[i].causes.length; j++){

                                // Check if specific cause is also present
                                if (infoStat[i].causes[j].statistical_cause == stat_cause){
                                    
                                    statCauseCheck = false;

                                    // Update specific times amount
                                    var specificCause = infoStat[i].causes[j].times;
                                    infoStat[i].causes[j].times = specificCause + 1;

                                    // Update specific duration amount
                                    var cause_duration = infoStat[i].causes[j].duration;
                                    infoStat[i].causes[j].duration = cause_duration + duration;
                                    

                                }

                            }
                        }
                    }

                    // IF the overal cause does not yet exist, add it with specific cause
                    if (normalCauseCheck) {
                        
                        var push_info = {
                            "cause" : cause,
                            "times" : 1,
                            "duration" : duration,
                            "causes" : [
                                {   
                                    "statistical_cause" : stat_cause,
                                    "times" : 1,
                                    "duration" : duration,
                                }
                            ]

                        }
                        infoStat.push(push_info);
                    }

                    // If cause exist , but not the specific cause, add that specific cause
                    else if (statCauseCheck){
                        var push_info = {
                            "statistical_cause" : stat_cause,
                            "times" : 1,
                            "duration" : duration,
                        }
                        infoStat[statCauseNumber].causes.push(push_info);
                    }

                    infoStat[0].total_duration = totalDuration;
                }
            }

            // Check if done
            if (datasetBool){
                amountCheck++;

                // Check if amount is met
                if (amountCheck == datasetCheck){
                    
                    var total_duration = 0;

                    var frequency = 0;

                    // Update frequency and total_duration
                    for (var i = 0; i< infoStat.length; i++){
                        total_duration = total_duration + infoStat[i].duration; 
                        frequency = frequency + infoStat[i].times;                       
                    }

                    infoStat[0].total_duration = total_duration;

                    
                    var durationS = total_duration.toString();
                    
                    durationS = durationS.concat(" minutes");

                    var averageS = (total_duration / frequency).toString();
                    averageS = averageS.slice(0,5);
                    averageS = averageS.concat(" minutes");

                    durationBool = bool;
                    // Get correct json format based on our json object
                    json = transformData(infoStat, bool);  
       
                    // Create Sunburst based on duration
                    createVisualization(json); 

                    // Get correct json format based on our json object
                    json = transformData(infoStat, false);  

                    // Create Sunburst based on duration on frequency
                    createVisualizationFreq(json); 

                    // Call BarChart from other file

                    getBarChartSun(startDate, endDate);

                    globalStartDate = null;
                    globalEndDate = null;
                }
            }     
        });
    }
}

// FROM HERE THE VISUALTION CODE STARTS

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {

    var vis = d3.select("#chartDur").append("svg:svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "sunburstSVGDUR")
        .attr("style", "margin-left: 7.5%")
        .append("svg:g")
        .attr("id", "container")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Basic setup of page elements.
    initializeBreadcrumbTrail();

    // Check if legend needs to be updated
    if (!removed){
        drawLegend();
    }

    d3.select("#togglelegendDur").on("click", toggleLegend);

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    vis.append("svg:circle")
        .attr("r", radius)
        .style("opacity", 0);

    // Turn the data into a d3 hierarchy and calculate the sums.
    var root = d3.hierarchy(json)
        .sum(function(d) { return d.size; })
        .sort(function(a, b) { return b.value - a.value; });
    
    // For efficiency, filter nodes to keep only those large enough to see.
    var nodes = partition(root).descendants()
        .filter(function(d) {
            return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
        });

    //var colorLegend1 = {colors, sideColors};
    jQuery.extend(colors, sideColors);


    var path = vis.data([json]).selectAll("path")
        .data(nodes)
        .enter().append("svg:path")
        .attr("display", function(d) { return d.depth ? null : "none"; })
        .attr("id", "pathDur")
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", function(d) { return colors[d.data.name]; })
        .style("opacity", 1)
        .on("mouseover", mouseover);

    // Add the mouseleave handler to the bounding circle.
    d3.select("#container").on("mouseleave", mouseleave);

    // Get total size of the tree = value of root node from partition.
    totalSize = path.datum().value;
    };

function createVisualizationFreq(json){
    var visFreq = d3.select("#chartFreq").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "sunburstSVGFREQ")
    .attr("style", "margin-left: 7.5%")
    .append("svg:g")
    .attr("id", "containerFreq")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Basic setup of page elements.
    initializeBreadcrumbTrailFreq();

    // Check if legend needs to be updated
    if (!removed){
        drawLegendFreq();
    }

    d3.select("#togglelegendFreq").on("click", toggleLegendFreq);

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    visFreq.append("svg:circle")
        .attr("r", radius)
        .style("opacity", 0);

    // Turn the data into a d3 hierarchy and calculate the sums.
    var rootFreq = d3.hierarchy(json)
        .sum(function(d) { return d.size; })
        .sort(function(a, b) { return b.value - a.value; });

    // For efficiency, filter nodes to keep only those large enough to see.
    var nodes = partition(rootFreq).descendants()
        .filter(function(d) {
            return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
        });

    //var colorLegend1 = {colors, sideColors};
    jQuery.extend(colors, sideColors);


    var pathFreq = visFreq.data([json]).selectAll("path")
        .data(nodes)
        .enter().append("svg:path")
        .attr("id", "pathFreq")
        .attr("display", function(d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", function(d) { return colors[d.data.name]; })
        .style("opacity", 1)
        .on("mouseover", mouseoverFreq);

    // Add the mouseleave handler to the bounding circle.
    d3.select("#containerFreq").on("mouseleave", mouseleaveFreq);

    // Get total size of the tree = value of root node from partition.
    totalSizeFreq = pathFreq.datum().value;
};


    // Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

    var vis = d3.select("#chartDur");
    var percentage = (100 * d.value / totalSize).toPrecision(3);
    var percentageString = percentage + "%";
    if (percentage < 0.1) {
        percentageString = "< 0.1%";
    }

    d3.select("#percentageDur")
        .text(percentageString);

    d3.select("#explanationDur")
        .style("visibility", "");

    var sequenceArray = d.ancestors().reverse();
    sequenceArray.shift(); // remove root node from the array


    updateBreadcrumbs(sequenceArray, d.value);

    // Fade all the segments.
    d3.selectAll("#pathDur")
        .style("opacity", 0.3);

    // Then highlight only those that are an ancestor of the current segment.
    vis.selectAll("#pathDur")
        .filter(function(node) {
                    return (sequenceArray.indexOf(node) >= 0);
                })
        .style("opacity", 1);
}

function mouseoverFreq(d) {

    var visFreq = d3.select("#chartFreq");
    var percentageFreq = (100 * d.value / totalSizeFreq).toPrecision(3);

    var percentageStringFreq = percentageFreq + "%";
    if (percentageFreq < 0.1) {
        percentageStringFreq = "< 0.1%";
    }

    d3.select("#percentageFreq")
        .text(percentageStringFreq);

    d3.select("#explanationFreq")
        .style("visibility", "");

    var sequenceArrayFreq = d.ancestors().reverse();
    sequenceArrayFreq.shift(); // remove root node from the array

    var frequencyUpdate = d.value.toString();
    frequencyUpdate = frequencyUpdate.concat(" disruption(s)");
    updateBreadcrumbsFreq(sequenceArrayFreq, frequencyUpdate);

    // Fade all the segments.
    d3.selectAll("#pathFreq")
        .style("opacity", 0.3);

    // Then highlight only those that are an ancestor of the current segment.
    visFreq.selectAll("#pathFreq")
        .filter(function(node) {
                    return (sequenceArrayFreq.indexOf(node) >= 0);
                })
        .style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

    // Hide the breadcrumb trail
    d3.select("#trailDur")
        .style("visibility", "hidden");

    // Deactivate all segments during transition.
    d3.selectAll("#pathDur").on("mouseover", null);

    // Transition each segment to full opacity and then reactivate it.
    d3.selectAll("#pathDur")
        .transition()
        .duration(1000)
        .style("opacity", 1)
        .on("end", function() {
                d3.select(this).on("mouseover", mouseover);
                });

    d3.select("#explanationDur")
        .style("visibility", "hidden");
}

function mouseleaveFreq(d) {

    // Hide the breadcrumb trail
    d3.select("#trailFreq")
        .style("visibility", "hidden");

    // Deactivate all segments during transition.
    d3.selectAll("#pathFreq").on("mouseover", null);

    // Transition each segment to full opacity and then reactivate it.
    d3.selectAll("#pathFreq")
        .transition()
        .duration(1000)
        .style("opacity", 1)
        .on("end", function() {
                d3.select(this).on("mouseover", mouseoverFreq);
                });

    d3.select("#explanationFreq")
        .style("visibility", "hidden");
}

function initializeBreadcrumbTrail() {
    // Add the svg area.
    var trail = d3.select("#sequenceDur").append("svg:svg")
        .attr("width", width)
        .attr("height", 50)
        .attr("id", "trailDur");
    // Add the label at the end, for the percentage.
    trail.append("svg:text")
        .attr("id", "endlabelDur")
        .style("fill", "#000");
}

function initializeBreadcrumbTrailFreq() {
    // Add the svg area.
    var trailFreq = d3.select("#sequenceFreq").append("svg:svg")
        .attr("width", width)
        .attr("height", 50)
        .attr("id", "trailFreq");
    // Add the label at the end, for the percentage.
    trailFreq.append("svg:text")
        .attr("id", "endlabelFreq")
        .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
    var points = [];
    points.push("0,0");
    points.push(b.w + ",0");
    points.push(b.w + b.t + "," + (b.h / 2));
    points.push(b.w + "," + b.h);
    points.push("0," + b.h);
    if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
        points.push(b.t + "," + (b.h / 2));
    }
    return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

    // Data join; key function combines name and depth (= position in sequence).
    var trail = d3.select("#trailDur")
        .selectAll("g")
        .data(nodeArray, function(d) { return d.data.name + d.depth; });
    
    // Remove exiting nodes. TODO FIX LEAVING KEEP TIMES AND DURATION
    trail.exit().remove();


    // Add breadcrumb and label for entering nodes.
    var entering = trail.enter().append("svg:g");

    var currentSelect;

    entering.append("svg:polygon")
        .attr("points", breadcrumbPoints)
        .style("fill", function(d) { return colors[d.data.name]; });

    entering.append("svg:text")
        .attr("x", (b.w + b.t) / 2)
        .attr("y", b.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(function(d) { 
            currentSelect = d.data.name;
            return d.data.name; });
    
    // Merge enter and update selections; set position for all nodes.
    entering.merge(trail).attr("transform", function(d, i) {
        return "translate(" + i * (b.w + b.s) + ", 0)";
    });
    // Now move and update the percentage at the end. TODO
    d3.select("#trailDur").select("#endlabelDur")
        .attr("x", (nodeArray.length + 0.1) * (b.w + b.s) )
        .attr("y", b.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "left")
        .text(function(d){
            var days = Math.floor(percentageString / (24*60));
            var hours = Math.floor((percentageString % (24*60)) / 60);
            var minutes = (percentageString % (24*60)) % 60;

            days = days.toString();
            hours = hours.toString();
            minutes = minutes.toString();
            percentageString = days.concat(" days, ").concat(hours).concat(" hours, ").concat(minutes).concat(" minutes");

            return percentageString;
        });
    
    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trailDur")
        .style("visibility", "");

    }

var currentSelectFreq;

var previousSelectFreq;

// Update the breadcrumb trail to show the current sequence and percentage for frequency
function updateBreadcrumbsFreq(nodeArray, percentageString) {
    console.log(nodeArray);
    // Data join; key function combines name and depth (= position in sequence).
    var trailFreq = d3.select("#trailFreq")
        .selectAll("g")
        .data(nodeArray, function(d) { return d.data.name + d.depth; });
    
    // Remove exiting nodes. TODO FIX LEAVING KEEP TIMES AND DURATION
    trailFreq.exit().remove();
    

    // Add breadcrumb and label for entering nodes.
    var enteringFreq = trailFreq.enter().append("svg:g");



    enteringFreq.append("svg:polygon")
        .attr("points", breadcrumbPoints)
        .style("fill", function(d) { return colors[d.data.name]; });

    enteringFreq.append("svg:text")
        .attr("x", (b.w + b.t) / 2)
        .attr("y", b.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(function(d) { 
            currentSelectFreq = d.data.name;
            return d.data.name; });
        
    // Merge enter and update selections; set position for all nodes.
    enteringFreq.merge(trailFreq).attr("transform", function(d, i) {
        return "translate(" + i * (b.w + b.s) + ", 0)";
    });

    console.log('test');
    // Now move and update the percentage at the end.
    d3.select("#trailFreq").select("#endlabelFreq")
        .attr("x", (nodeArray.length + 0.1) * (b.w + b.s) )
        .attr("y", b.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "left")
        .text(function(d){
            return percentageString;
        });
    
    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trailFreq")
        .style("visibility", "");

    }

// Function that will draw legend for Duration
function drawLegend() {

    // Dimensions of legend item: width, height, spacing, radius of rounded rect.
    var li = {
        w: 135, h: 35, s: 3, r: 5
    };

    var legend = d3.select("#legendDur").append("svg:svg")
        .attr("width", li.w)
        .attr("height", d3.keys(colors).length * (li.h + li.s));

    var g = legend.selectAll("g")
        .data(d3.entries(colors))
        .enter().append("svg:g")
        .attr("transform", function(d, i) {
                return "translate(0," + i * (li.h + li.s) + ")";
            });

    g.append("svg:rect")
        .attr("rx", li.r)
        .attr("ry", li.r)
        .attr("width", li.w)
        .attr("height", li.h)
        .style("fill", function(d) { return d.value; });

    g.append("svg:text")
        .attr("x", li.w / 2)
        .attr("y", li.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.key; });
}

// Function that will draw legend for frequency
function drawLegendFreq() {

    // Dimensions of legend item: width, height, spacing, radius of rounded rect.
    var li = {
        w: 135, h: 35, s: 3, r: 5
    };

    var legend = d3.select("#legendFreq").append("svg:svg")
        .attr("width", li.w)
        .attr("height", d3.keys(colors).length * (li.h + li.s));

    var g = legend.selectAll("g")
        .data(d3.entries(colors))
        .enter().append("svg:g")
        .attr("transform", function(d, i) {
                return "translate(0," + i * (li.h + li.s) + ")";
            });

    g.append("svg:rect")
        .attr("rx", li.r)
        .attr("ry", li.r)
        .attr("width", li.w)
        .attr("height", li.h)
        .style("fill", function(d) { return d.value; });

    g.append("svg:text")
        .attr("x", li.w / 2)
        .attr("y", li.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.key; });
}


// Function that will toggle legend for Duration
function toggleLegend() {
    var legend = d3.select("#legendDur");
    if (legend.style("visibility") == "hidden") {
        legend.style("visibility", "");
    } else {
        legend.style("visibility", "hidden");
    }
}

// Function that will toggle legend for freq
function toggleLegendFreq() {
    var legend = d3.select("#legendFreq");
    if (legend.style("visibility") == "hidden") {
        legend.style("visibility", "");
    } else {
        legend.style("visibility", "hidden");
    }
}

// function that gets correct datasets

function getDataset(startDate, endDate) {
    datasets = []
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

$('[data-toggle="cause-select-tooltip"]').tooltip(); 