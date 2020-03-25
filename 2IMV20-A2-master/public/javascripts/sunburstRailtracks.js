// FROM HERE THE VISUALTION CODE STARTS
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

var sideColorsFreq = {

};


var partition = d3.partition()
    .size([2 * Math.PI, radius * radius]);

var arc = d3.arc()
    .startAngle(function(d) { return d.x0; })
    .endAngle(function(d) { return d.x1; })
    .innerRadius(function(d) { return Math.sqrt(d.y0); })
    .outerRadius(function(d) { return Math.sqrt(d.y1); });

var infostatistics;

var currentSelect;

function createAllSunburst(json){

    if (document.getElementById("sunburstSVGDUR")) {
        document.getElementById("sunburstSVGDUR").remove();
        document.getElementById("sunburstSVGFREQ").remove();
        document.getElementById("trailFreq").remove();
        document.getElementById("trailDur").remove();
    }

    infostatistics= json;

    jsonData = transformData(json, true);
    
    // Visualization based on duration
    createVisualization(jsonData);

    jsonData = transformData(json, false);

    createVisualizationFreq(jsonData);

    // Call Bartchart

    getBarChartSunRail(infostatistics);

}
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

    //var durationUpdate = d.value.toString();
    //durationUpdate = durationUpdate.concat(" Minutes");
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

// Update the breadcrumb trail to show the current sequence and percentage for frequency
function updateBreadcrumbsFreq(nodeArray, percentageString) {

    // Data join; key function combines name and depth (= position in sequence).
    var trailFreq = d3.select("#trailFreq")
        .selectAll("g")
        .data(nodeArray, function(d) { return d.data.name + d.depth; });
    
    // Remove exiting nodes. TODO FIX LEAVING KEEP TIMES AND DURATION
    trailFreq.exit().remove();


    // Add breadcrumb and label for entering nodes.
    var enteringFreq = trailFreq.enter().append("svg:g");

    var currentSelectFreq;

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
    // Now move and update the percentage at the end. TODO
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

        // Loop over every track
        for (var i = 0; i < data.causes.length; i++){
            
            var hierarchyExample = {
                children: [
        
                ],
                name: data.causes[i].cause_group
                
            };

            // For every cause, loop over there specific statistical cause
            for (var j = 0; j < data.causes[i].causes.length; j++){
                var intermediateData = data.causes[i];
                var hierarchyEnd = {
                    name : intermediateData .causes[j].stat_cause,
                    size : intermediateData .causes[j].times
                };

                // Add info for specific statistical cause to json object
                hierarchyExample.children.push(hierarchyEnd);

                
                // Check if this specific clause exist in subset
                if (!colorSet.includes(intermediateData.causes[j].stat_cause)){

                    // generate a random color
                    var randomColor ='#'+Math.random().toString(16).substr(2,6);
                    var stat_cause = intermediateData.causes[j].stat_cause;
                    // sideColorsFreq[stat_cause] = randomColor;

                }

            };

            sunburstData.children.push(hierarchyExample);
        }
    }
    else {
        // Loop over every cause
        for (var i = 0; i < data.causes.length; i++){

            var hierarchyExample = {
                children: [
        
                ],
                name: data.causes[i].cause_group
                
            };

            // For every cause, loop over there specific statistical cause
            for (var j = 0; j < data.causes[i].causes.length; j++){
                var intermediateData = data.causes[i];
                var hierarchyEnd = {
                    name : intermediateData .causes[j].stat_cause,
                    size : intermediateData .causes[j].duration
                };

                // Add info for specific statistical cause to json object
                hierarchyExample.children.push(hierarchyEnd);

                
                // Check if this specific clause exist in subset
                if (!colorSet.includes(intermediateData.causes[j].stat_cause)){

                    // generate a random color
                    var randomColor ='#'+Math.random().toString(16).substr(2,6);
                    var stat_cause = intermediateData.causes[j].stat_cause;
                    sideColors[stat_cause] = randomColor;

                }

            };

            sunburstData.children.push(hierarchyExample);
        }
    }

    return sunburstData;

}