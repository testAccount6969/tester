// Array containing final data to be pushed to lineChart
var lineChartJson = [];
// Arrays containing date information in Json format, inluding freq/dur
var dateJson = [];
var dateJsonFreq = [];
// Global infoStat array
var infoStat = [];

// Global railStat object (for railtracks)
var railStat = {};

// Global Start and End date
var globalStartDate;
var globalEndDate;

// Global array containing all dates for line Chart
var allDates = new Array();
// Global loopcounter to keep track of how many times dataset are iterated
var loopCounter = 0;

function example(data){
    var result = [];
    for(let entry of data){
        result.push({"area" : entry.cause, "value": entry.dataDuration});
        result = doSomething(result);
    }
    return result;
}

function example2(data){
            result = [];
    for(let entry of data)
        {
    result.push({"area" : entry.cause, "value": entry.dataDuration});
}
return result;
    }

// Function that transform the data to correct format, duration or freq based on bool

function transFormFormat(data, bool){
    var barChartData = [
    ];
    if (bool){
        for(var i = 0; i< data.length; i++){
            barChartData.push({"area" : data[i].cause, "value": data[i].times});
        }
    }
    else {
        for(var i = 0; i< data.length; i++){
            var dataDuration = data[i].duration/60;
            dataDuration = (Math.round(dataDuration * 100)/100).toFixed(2);
            dataDuration = parseFloat(dataDuration, 10);
            barChartData.push({"area" : data[i].cause, "value": dataDuration});
        }
    }

    barChartData.sort(function(a, b) {
        return compareStrings(a.area, b.area);
      })
    return barChartData;

}

function transFormFormatRail(data, bool){
    var barChartData = Array;
    if (bool){
        for(var i = 0; i< data.length; i++){
            barChartData.push({"area" : data[i].cause_group, "value": data[i].times});
        }
    }
    else {
        for(var i = 0; i< data.length; i++){
            var dataDuration = data[i].duration/60;
            dataDuration = (Math.round(dataDuration * 100)/100).toFixed(2);
            dataDuration = parseFloat(dataDuration, 10);
            barChartData.push({"area" : data[i].cause_group, "value": dataDuration});
        }
    }

    barChartData.sort(function(a, b) {
        return compareStrings(a.area, b.area);
      })
    return barChartData;

}

// Function that sorts the array object 
function compareStrings(a, b) {
    // Assuming you want case-insensitive comparison
    a = a.toLowerCase();
    b = b.toLowerCase();
  
    return (a < b) ? -1 : (a > b) ? 1 : 0;
}
  
// Function that gets the correct datasets
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

// Function that is called to get the barChart based on start and end date
function getBarChartSun(start, end){
    globalStartDate = start;
    globalEndDate = end;
    getBarChart(true);
}

function getBarChartSunRail(data){
    infoStat = data.causes;
    railStat = data;

    // Get all data and indicate we come for railstat info
    getBarChart(false);
}

// Function that is called to get the barChart, but based 1 global year
function getBarChartDate(date){
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
    getBarChart(true);
}

// Function to get table of dates base on start and end, bool indicates
// if we need to push the data to global variables
function getDates(start, end, bool) {
    var arr = new Array();
    var arr2 = new Array();
    var arr3 = new Array();
    var dt = new Date(start);
    while (dt <= end) {
        arr.push(new Date(dt));
        // Check if we need total array
        if (bool){
            var lineChartEntry = {
                date : new Date(dt),
                value : 0
            };
            var lineChartEntryFreq = {
                date : new Date(dt),
                value : 0
            };
            arr2.push(lineChartEntry);
            arr3.push(lineChartEntryFreq);
        }
        dt.setDate(dt.getDate() + 1);
    }
    if (bool){
        dateJson = arr2;
        dateJsonFreq = arr3;
    }
    return arr;
}

// Function that makes correct json for lineChart
function pushDateLineChart(data){

    var days = new Array();

    var allDaysFormat = new Array();

    for (var i = 0; i < allDates.length; i++){
        var day = allDates[i].getTime();
        allDaysFormat.push(day);
    }

    var startDisruption = data.start_time;
    var endDisruption = data.end_time;

    // Check length, due to different format of time
    if (startDisruption.length == 19){

        // Start
        var dayStart = startDisruption.slice(0,2);
        var monthStart = startDisruption.slice(3,5);
        var yearStart = startDisruption.slice(6,10);
        var integerStartDay = parseInt(dayStart, 10);
        var integerStartMonth = parseInt(monthStart, 10);
        var integerStartYear = parseInt(yearStart, 10);

        var hourStart = startDisruption.slice(11,13);
        var minutesStart = startDisruption.slice(14,16);

        hourStart = parseInt(hourStart, 10);
        minutesStart = parseInt(minutesStart, 10);

        // End
        var dayEnd = endDisruption.slice(0,2);
        var monthEnd = endDisruption.slice(3,5);
        var yearEnd = endDisruption.slice(6,10);
        var integerEndDay = parseInt(dayEnd, 10);
        var integerEndMonth = parseInt(monthEnd, 10);
        var integerEndYear = parseInt(yearEnd, 10);

        var hourEnd = endDisruption.slice(11,13);
        var minutesEnd = endDisruption.slice(14,16);

        hourEnd = parseInt(hourEnd, 10);
        minutesEnd = parseInt(minutesEnd, 10); 
    }
    else{
        var dayStart = startDisruption.slice(0,2);
        
        if (dayStart.includes("-")){
            var dayStart = startDisruption.slice(0,1);
            var monthStart = startDisruption.slice(2,4);
            if (monthStart.includes("-")){
                var monthStart = startDisruption.slice(2,3);
                var yearStart = startDisruption.slice(4,8);

                var hourStart = startDisruption.slice(9,11);
                if (hourStart.includes(":")){
                    var hourStart = startDisruption.slice(9,10);
                    var minutesStart = startDisruption.slice(11,13);
                }
                else{
                    var minutesStart = startDisruption.slice(12,14);
                }
            }
            else {
                var yearStart = startDisruption.slice(5,9);

                var hourStart = startDisruption.slice(10,12);

                if (hourStart.includes(":")){
                    var hourStart = startDisruption.slice(10,11);
                    var minutesStart = startDisruption.slice(12,14);
                }
                else{
                    var minutesStart = startDisruption.slice(13,15);
                }
            }
        }
        else {
            var monthStart = startDisruption.slice(3,5);
            if (monthStart.includes("-")){
                var monthStart = startDisruption.slice(3,4);
                var yearStart = startDisruption.slice(5,9);

                var hourStart = startDisruption.slice(10,12);

                if (hourStart.includes(":")){
                    var hourStart = startDisruption.slice(10,11);
                    var minutesStart = startDisruption.slice(12,14);
                }
                else{
                    var minutesStart = startDisruption.slice(13,15);
                }
            }
            else {
                var yearStart = startDisruption.slice(6,10);

                var hourStart = startDisruption.slice(11,13);

                if (hourStart.includes(":")){
                    var hourStart = startDisruption.slice(11,12);
                    var minutesStart = startDisruption.slice(13,15);
                }
                else{
                    var minutesStart = startDisruption.slice(14,16);
                }
            }
        }
        var integerStartDay = parseInt(dayStart, 10);
        var integerStartMonth = parseInt(monthStart, 10);
        var integerStartYear = parseInt(yearStart, 10);

        hourStart = parseInt(hourStart, 10);
        minutesStart = parseInt(minutesStart, 10);
        
    }


    integerStartMonth = integerStartMonth -1;

    var inputStartDate = new Date(integerStartYear, integerStartMonth, integerStartDay);

    // Check format to correctly format
    if (endDisruption.length != 19){
        var dayEnd = endDisruption.slice(0,2);

        if (dayEnd.includes("-")){
            var dayEnd = endDisruption.slice(0,1);
            var monthEnd = endDisruption.slice(2,4);

            if (monthEnd.includes("-")){
                var monthEnd = endDisruption.slice(2,3);
                var yearEnd = endDisruption.slice(4,8);

                var hourEnd = endDisruption.slice(9,11);
                if (hourEnd.includes(":")){
                    var hourEnd = endDisruption.slice(9,10);
                    var minutesEnd = endDisruption.slice(11,13);
                }
                else{
                    var minutesEnd = endDisruption.slice(12,14);
                }
            }
            else {
                var yearEnd = endDisruption.slice(5,9);

                var hourEnd = endDisruption.slice(10,12);
                if (hourEnd.includes(":")){
                    var hourEnd = endDisruption.slice(10,11);
                    var minutesEnd = endDisruption.slice(12,14);
                }
                else{
                    var minutesEnd = endDisruption.slice(13,15);
                }
            }
        }
        else {
            var monthEnd = endDisruption.slice(3,5);
            if (monthEnd.includes("-")){
                var monthEnd = endDisruption.slice(3,4);
                var yearEnd = endDisruption.slice(5,9);


                var hourEnd = endDisruption.slice(10,12);
                if (hourEnd.includes(":")){
                    var hourEnd = endDisruption.slice(10,11);
                    var minutesEnd = endDisruption.slice(12,14);
                }
                else{
                    var minutesEnd = endDisruption.slice(13,15);
                }
            }
            else {
                var yearEnd = endDisruption.slice(6,10);


                var hourEnd = endDisruption.slice(11,13);
                if (hourEnd.includes(":")){
                    var hourEnd = endDisruption.slice(11,12);
                    var minutesEnd = endDisruption.slice(13,15);
                }
                else{
                    var minutesEnd = endDisruption.slice(14,16);
                }
            }
        }
        var integerEndDay = parseInt(dayEnd, 10);
        var integerEndMonth = parseInt(monthEnd, 10);
        var integerEndYear = parseInt(yearEnd, 10);

        hourEnd = parseInt(hourEnd, 10);
        minutesEnd = parseInt(minutesEnd, 10);
        
    }
    integerEndMonth = integerEndMonth -1;

    var inputEndDate = new Date(integerEndYear, integerEndMonth, integerEndDay);

    days = getDates(inputStartDate, inputEndDate, false);

    if (days.length > 1){
        var day1Hours = 23 - hourStart;
        var day1Minutes = 60 - minutesStart;

        var day1Duration = day1Minutes + (60*day1Hours);

        var day2Duration = (hourEnd * 60) + minutesEnd;

        var index = allDaysFormat.indexOf(days[0].getTime());

        var max = days.length - 1;
        
        var index2 = allDaysFormat.indexOf(days[max].getTime());

        if (index != -1){
            dateJson[index].value = dateJson[index].value + day1Duration;
            dateJsonFreq[index].value = dateJsonFreq[index].value + 1;
        }

        if(index2 != -1){
            dateJson[index2].value = dateJson[index2].value + day2Duration;
            dateJsonFreq[index2].value = dateJsonFreq[index2].value + 1;

            // We know it lasted atleast 3 days
            if (days.length > 2){
                for (var i = 1; i < days.length - 1; i++){
                    var index = allDaysFormat.indexOf(days[i].getTime());
                    var fullDayDuration = 24 * 60;
                    dateJson[index].value = dateJson[index].value + fullDayDuration;
                    dateJsonFreq[index].value = dateJsonFreq[index].value + 1;
                }
            }
        }
    }
    else{
        for(var i=0; i < days.length; i++){
            var index = allDaysFormat.indexOf(days[i].getTime());

            if (index != -1){
                var duration = parseInt(data.duration_minutes, 10);
                dateJson[index].value = dateJson[index].value + duration;
                dateJsonFreq[index].value = dateJsonFreq[index].value + 1;
            }
    
        }
    }
    
}

// Function that get's the data for the barchart but also display it with inner function
// If set to true, we are dealing with global
function getBarChart(bool) {


    var dateRangePicker = $('#reportrange').data('daterangepicker');
    var startDate;
    var endDate;

    if (globalStartDate != null){
        startDate = globalStartDate;
        endDate = globalEndDate;
    }
    else {
        startDate = dateRangePicker.startDate._d;
        endDate = dateRangePicker.endDate._d    
    }

    if (bool){
        infoStat = [];
    }
    var datasetCheck = 0;

    var amountCheck = 0;
    loopCounter = 0;

    // Get the needed datasets
    var datasets = getDataset(startDate, endDate);

    // Get an array including all dates
    allDates = getDates(startDate, endDate, true);
  

    for (var d = 0; d < datasets.length; d++) {
        datasetCheck++;
        var datasetBool = false;

        if (datasets.length == datasetCheck){
            var datasetBool = true;
            
        }
        d3.csv(datasets[d], function(data){
            console.log(data);
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

                    // Check if barChart is for global stat page
                    if (bool){

                        // push this data to LineChartFormat
                        pushDateLineChart(data[y]);
                        
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

                    // Railtracks barChart
                    else{
                        // We need to check if current track is in data[y]
                        var string = railStat.track;
                        var res = string.split("-");
                        var resCheck = 0;

                        for (var x = 0; x < res.length; x++){
  
                            var resContains = data[y].rdt_station_codes.includes(res[x]);
      
                            if (resContains){
                                resCheck = resCheck + 1;
                            }
                        }
                        // If rail stations are both present, push data
                        if (resCheck == res.length){
                            pushDateLineChart(data[y]);
                        }

                        
                    }
                }
            }


            if (datasetBool){
                amountCheck++;

                if (amountCheck == datasetCheck){
                    
                    if (bool){
                        var total_duration = 0;

                        var frequency = 0;

                        for (var i = 0; i< infoStat.length; i++){
                            total_duration = total_duration + infoStat[i].duration; 
                            frequency = frequency + infoStat[i].times;     
                        }

                        infoStat[0].total_duration = total_duration;

                        var averageS = (total_duration / frequency).toString();
                        averageS = averageS.slice(0,5);
                        var averageDays = (total_duration / 60 / frequency).toString();
                        averageDays = averageDays.slice(0,5);
                        averageDays = "(= ".concat(averageDays).concat(" hours)");
                        averageS = averageS.concat(" minutes");

                        var dayAverageDisr = frequency / allDates.length;
                        dayAverageDisr = dayAverageDisr.toString();
                        dayAverageDisr = dayAverageDisr.slice(0,5);
                        dayAverageDisr = dayAverageDisr.concat(" disruptions");

                        var disruptionFreq = frequency.toString();
                        disruptionFreq = disruptionFreq.concat(" disruptions");

                        // Total duration of disruptions for the track
                        var days = Math.floor(total_duration/ (24*60));
                        var hours = Math.floor((total_duration % (24*60)) / 60);
                        var minutes = (total_duration % (24*60)) % 60;

                        var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                        var dateRangePicker = $('#reportrange').data('daterangepicker');
                        var startDate2 = dateRangePicker.startDate._d;
                        var endDate2 = dateRangePicker.endDate._d
                        var diffDays = Math.round(Math.abs((endDate2 - startDate2) / oneDay));

                        var avgDuration = (total_duration / diffDays).toFixed(2);

                        var daysAvg = Math.floor(avgDuration/ (24*60));
                        var hoursAvg = Math.floor((avgDuration % (24*60)) / 60);
                        var minutesAvg = (avgDuration % (24*60)) % 60;
                        minutesAvg = minutesAvg.toFixed(0);

                        var topCause;
                        var topCauseAmt = 0;
                        for (cause_group in infoStat) {
                            for (cause in infoStat[cause_group].causes) {
                                if (infoStat[cause_group].causes[cause].times > topCauseAmt) {
                                    topCause = infoStat[cause_group].causes[cause].statistical_cause;
                                    topCauseAmt = infoStat[cause_group].causes[cause].times;
                                }
                            }
                        }

                        document.getElementById("dayAvgMin").innerHTML = daysAvg + " days, " + hoursAvg + " hours and " + minutesAvg + " minutes";

                        document.getElementById("totDisr").innerHTML = days + " days, " + hours + " hours and " + minutes + " minutes";

                        document.getElementById("amtDisr").innerHTML = disruptionFreq;
                        document.getElementById("avgDisr").innerHTML = averageS;
                        document.getElementById("avgDisrDays").innerHTML = averageDays;
                        document.getElementById("dayAvgDisr").innerHTML = dayAverageDisr;
                        document.getElementById("topCause").innerHTML = topCause.charAt(0).toUpperCase() + topCause.slice(1);
                        document.getElementById("topCauseAmt").innerHTML = "Happened " + topCauseAmt + " times";
                    }    

                    // Check if we need to remove existing barCharts
                    if (document.getElementById("barChartSVG")) {
                        document.getElementById("barChartSVG").remove();
                        document.getElementById("barChartSVGdur").remove();
                        document.getElementById("toolTipBar").remove();
                        document.getElementById("toolTipBarDur").remove();
                    }

                    // First barChart on frequency and inside we also call Duration barChart
                    createBarChart(bool);
                            
                }
            } 
            // Create line Chart based on Frequency
            loopCounter += 1;
            if (loopCounter == datasets.length) {
                createLineChartFreq(dateJsonFreq, dateJson); 
            }  
        });
    }
}

function createBarChart(bool){
    var svg = d3.select("#freqBarChart"),
    margin = {top: 20, right: 20, bottom: 120, left: 50},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;
    var tooltip = d3.select("body").append("div").attr("class", "toolTip").attr("id", "toolTipBar").attr("style", "display: none");

    var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y = d3.scaleLinear().rangeRound([height, 0]);
    
    var colours = d3.scaleOrdinal()
        .range(["#6F257F", "#CA0D59"]);

    var g = svg.append("g")
        .attr("id", "barChartSVG")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    if (bool){
        data = transFormFormat(infoStat, true);
    }
    else {
        data = transFormFormatRail(infoStat, true);
    }
    
    // if (data.length > 8){
    //     for(var i = 0; i< data.length; i++){
    //         if (data[i].area == "engineering work"){
    //             data[i].area = "eng work";
    //         }
    //         if (data[i].area == "infrastructure"){
    //             data[i].area = "infra";
    //         }
    //     }
    // }

    x.domain(data.map(function(d) { return d.area; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(8," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
            .attr("transform", "translate(0,0)rotate(-45)")
            .style("text-anchor", "end");

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(12).tickFormat(function(d) { return parseInt(d) ; }).tickSizeInner([-width]))
    .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .attr("fill", "#5D6971")
        .text("Frequency");

    g.selectAll(".bar")
        .data(data)
    .enter().append("rect")
        .attr("x", function(d) { return x(d.area) + 8; })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.value); })
        .attr("fill", function(d) { return colours(d.area); })
        .on("mousemove", function(d){
            tooltip
            .style("display", "block")
            .style("left", d3.event.pageX + 3 + "px")
            .style("top", d3.event.pageY - 77 + "px")
            .html((d.area) + "<br>" + (d.value) + " disruptions");
        })
        .on("mouseleave", function(d){ 
            tooltip.style("display", "none");
        });
        

        // Second barChart but based on duration

        createBarChartDur(bool);
}

function createBarChartDur(bool){
    var svg = d3.select("#durBarChart"),
    margin = {top: 20, right: 20, bottom: 120, left: 50},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;
    var tooltip = d3.select("body").append("div").attr("class", "toolTip").attr("id", "toolTipBarDur").attr("style", "display: none");

    var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
        y = d3.scaleLinear().rangeRound([height, 0]);
    
    var colours = d3.scaleOrdinal()
        .range(["#6F257F", "#CA0D59"]);

    var g = svg.append("g")
        .attr("id", "barChartSVGdur")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    if (bool){
        data = transFormFormat(infoStat, false);
    }
    else {
        data = transFormFormatRail(infoStat, false);
    }

    // if (data.length > 8){
    //     for(var i = 0; i< data.length; i++){
    //         if (data[i].area == "engineering work"){
    //             data[i].area = "engineering work";
    //         }
    //         if (data[i].area == "infrastructure"){
    //             data[i].area = "infra";
    //         }
    //     }
    // }

    globalStartDate = null;
    globalEndDate = null;

    x.domain(data.map(function(d) { return d.area; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(8," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
            .attr("transform", "translate(0,0)rotate(-45)")
            .style("text-anchor", "end");

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(12).tickFormat(function(d) { return parseInt(d) ; }).tickSizeInner([-width]))
    .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .attr("fill", "#5D6971")
        .text("Duration in hours");

    g.selectAll(".bar")
        .data(data)
    .enter().append("rect")
        .attr("x", function(d) { return x(d.area) + 8; })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.value); })
        .attr("fill", function(d) { return colours(d.area); })
        .on("mousemove", function(d){
            tooltip
            .style("display", "block")
            .style("left", d3.event.pageX + 3 + "px")
            .style("top", d3.event.pageY - 77 + "px")
            .html((d.area) + "<br>" + (d.value) + " hours");
        })
        .on("mouseleave", function(d){ 
            tooltip.style("display", "none");
        });
}