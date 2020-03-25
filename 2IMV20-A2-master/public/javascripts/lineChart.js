

function createLineChart(information){

    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = 850 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Check if it already exist
    if (document.getElementById("lineChartSvg")) {
        document.getElementById("lineChartSvg").remove();
    }
    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
    .append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "lineChartSvg")
    .append("g")
        .attr("id", "updateDur")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
        

    // Link the correct data;
    data = information;
    // Add X axis --> it is a date format
    var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.date; }))
    .range([ 0, width ]);
    xAxis = svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
    // Add Y axis
    var y = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return +d.value/60; })])
    .range([ height, 0 ]);
    yAxis = svg.append("g")
    .call(d3.axisLeft(y))
    .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .attr("fill", "#5D6971")
        .style("font-size", "14px")
        .text("Duration in hours");

    // Add a clipPath: everything out of this area won't be drawn.
    var clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

    // Add brushing
    var brush = d3.brushX()                   // Add the brush feature using the d3.brush function
        .extent( [ [0,0], [width,height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

    // Create the line variable: where both the line and the brush take place
    var line = svg.append('g')
    .attr("clip-path", "url(#clip)")

    // Add the line
    line.append("path")
    .datum(data)
    .attr("class", "line")  // I add the class line to be able to modify this line later on.
    .attr("fill", "none")
    .attr("id", "lineDur")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.2)
    .attr("d", d3.line()
        .x(function(d) { return x(d.date) })
        .y(function(d) { return y(d.value/60) })
        );

    // Add the brushing
    line
    .append("g")
        .attr("class", "brush")
        .call(brush);



    // A function that set idleTimeOut to null
    var idleTimeout
    function idled() { idleTimeout = null; }

    // A function that update the chart for given boundaries
    function updateChart() {

    // What are the selected boundaries?
    extent = d3.event.selection

    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if(!extent){
        if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
        x.domain([ 4,8])
    }else{
        x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
        line.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
    }

    // Update axis and line position
    xAxis.transition().duration(1000).call(d3.axisBottom(x))
    line
        .select('#lineDur')
        .transition()
        .duration(1000)
        .attr("d", d3.line()
            .x(function(d) { return x(d.date) })
            .y(function(d) { return y(d.value/60) })
        )
    }

    // If user double click, reinitialize the chart
    svg.on("dblclick",function(){
    x.domain(d3.extent(data, function(d) { return d.date; }))
    xAxis.transition().call(d3.axisBottom(x))
    line
        .select('#lineDur')
        .transition()
        .attr("d", d3.line()
        .x(function(d) { return x(d.date) })
        .y(function(d) { return y(d.value/60) })
    )
    });
}

function createLineChartFreq(information, informationDuration){

    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = 850 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;


    // Check if it already exist
    if (document.getElementById("lineChartSvgFreq")) {
        document.getElementById("lineChartSvgFreq").remove();
    }
    // append the svg object to the body of the page
    var svg = d3.select("#my_datavizFreq")
    .append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "lineChartSvgFreq")
    .append("g")
    .attr("id", "gFreq")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Link the correct data;
    var data = information;
    // Add X axis --> it is a date format
    var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.date; }))
    .range([ 0, width ]);
    xAxisFreq = svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return +d.value; })])
    .range([ height, 0 ]);
    yAxis = svg.append("g")
    .call(d3.axisLeft(y))
    .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .attr("fill", "#5D6971")
        .style("font-size", "14px")
        .text("Frequency");

    // Add a clipPath: everything out of this area won't be drawn.
    var clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clipFreq")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

    // Add brushing
    var brush = d3.brushX()                   // Add the brush feature using the d3.brush function
        .extent( [ [0,0], [width,height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

    // Create the line variable: where both the line and the brush take place
    var line = svg.append('g')
    .attr("clip-path", "url(#clipFreq)")

    // Add the line
    line.append("path")
    .datum(data)
    .attr("class", "line")  // I add the class line to be able to modify this line later on.
    .attr("id", "lineFreq")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.2)
    .attr("d", d3.line()
        .x(function(d) { return x(d.date) })
        .y(function(d) { return y(d.value) })
        );
    
    // Add the brushing
    line
    .append("g")
        .attr("class", "brush")
        .call(brush);



    // A function that set idleTimeOut to null
    var idleTimeout
    function idled() { idleTimeout = null; }

    // A function that update the chart for given boundaries
    function updateChart() {

    // What are the selected boundaries?
    extent = d3.event.selection

    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if(!extent){
        if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
        x.domain([ 4,8])
    }else{
        x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
        line.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
    }

    // Update axis and line position
    xAxisFreq.transition().duration(1000).call(d3.axisBottom(x))
    line
        .select('#lineFreq')
        .transition()
        .duration(1000)
        .attr("d", d3.line()
            .x(function(d) { return x(d.date) })
            .y(function(d) { return y(d.value) })
        )
    }

    // If user double click, reinitialize the chart
    svg.on("dblclick",function(){
    x.domain(d3.extent(data, function(d) { return d.date; }))
    xAxisFreq.transition().call(d3.axisBottom(x))
    line
        .select('#lineFreq')
        .transition()
        .attr("d", d3.line()
        .x(function(d) { return x(d.date) })
        .y(function(d) { return y(d.value) })
    )
    });
    createLineChart(informationDuration);
}