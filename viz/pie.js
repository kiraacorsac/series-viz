let pieChart = {};
let pieSvg ={};

function countDifferent(array){
    let counts = {};
    for(let i = 0, n = array.length; i<n; i++){
        if((typeof counts[array[i]]) !== "undefined"){
            counts[array[i]].count++;
        } else {
            counts[array[i]] = { name: array[i], count: 1};
        }
    }
    return counts;
}

function redrawPieChart() {
    let query = {};
    if($('#SeasonFilter').is(":checked")){
        query = data[$('#SeasonSelect')[0].valueAsNumber-1];
        if($('#EpisodeFilter').is(":checked")){
            query = [query[$('#EpisodeSelect')[0].valueAsNumber-1]]
        }
    } else {
        query = data.reduce((acc, val) => acc.concat(val), []);
    }

    query = query.map(e => e.ScriptLines)
        .reduce((acc, val) => acc.concat(val), [])
        .map(line => line.Character);

    let counts = Object.values(countDifferent(query));
    let allPiechartData = counts.sort((a, b) => b.count - a.count);

    let neatPieChartData = allPiechartData.slice(0, 11);
    neatPieChartData[11] = allPiechartData.slice(11).reduce((acc, cur) => {
        acc.count += cur.count;
        return acc;
    }, {
        count: 0,
        name: "Others"
    });

    if(neatPieChartData[11].count === 0){
        neatPieChartData = neatPieChartData.slice(0, 11);
    }

    pieChart.data = Object.values(neatPieChartData);
    pieChart.draw(500);
    pieChart.draw();
    pieSvg.selectAll(".dimple-others.dimple-pie").style("fill", "rgba(217, 217, 217,0.8)");
    pieSvg.selectAll(".dimple-others.dimple-pie").style("stroke", "rgba(182, 182, 182,0.8)");
    pieSvg.selectAll(".dimple-others.dimple-legend-key").style("fill", "rgba(217, 217, 217,0.8)");
    pieSvg.selectAll(".dimple-others.dimple-legend-key").style("stroke", "rgba(182, 182, 182,0.8)");

}


function initPie() {

    let query = data.reduce((acc, val) => acc.concat(val), [])
        .map(e => e.ScriptLines)
        .reduce((acc, val) => acc.concat(val), [])
        .map(line => line.Character);

    let optimizedQuery = [];
    for(let season = 0, seasonCount = data.length; season<seasonCount; season++ ){
        for(let episode = 0, episodeCount = data[season].length; episode<episodeCount; episode++ ){
            for(let line = 0, lineCount = data[season][episode].ScriptLines.length; line<lineCount; line++ ){
                optimizedQuery.push(data[season][episode].ScriptLines[line].Character);
            }
        }
    }
    pieSvg = dimple.newSvg("#pieVizContainer", 590, 400);
    let counts = Object.values(countDifferent(optimizedQuery));
    let allPiechartData = counts.sort((a, b) => b.count - a.count);
    let neatPieChartData = allPiechartData.slice(0, 11);
    neatPieChartData[11] = allPiechartData.slice(11).reduce((acc, cur) => {
        acc.count += cur.count;
        return acc;
    }, {
        count: 0,
        name: "Others"
    });

    pieChart = new dimple.chart(pieSvg, neatPieChartData);
    pieChart.setBounds(20, 20, 460, 360);
    pieChart.addMeasureAxis("p", "count");
    let grey = pieChart.defaultColors[11];
    pieChart.defaultColors = pieChart.defaultColors.slice(0, 11)
    let series = pieChart.addSeries("name", dimple.plot.pie);
    series.innerRadius = "50%";

    let putOthersInTheBackRule = (a, b) => {
        if (b.name === "Others"){
            return -1;
        }
        if (a.name === "Others"){
            return 1;
        }
        return b.count[0] - a.count[0];
    };

    series.addOrderRule(putOthersInTheBackRule);

    pieChart.addLegend(460, 20, 60, 400, "left");

// let eh = "";
// sentimentPlotData.forEach(e => {eh = eh + ("" + e.order + " " + e.sentiment + "\n" )});
// console.log(eh);


    counts.sort((ch1, ch2) => ch1.name.localeCompare(ch2.name))
        .forEach(ch => {
            let value = ch.name.length < 30 ? ch.name : ch.name.slice(0, 30) + "...";
            $("#CharacterSelect").append(new Option(value, ch.name));
        });

    series.getTooltipText = function (e) {
        let rows = [];
        rows.push(e.aggField[0] + " :  " + e.angle + " (" + (d3.format(".1%")(e.piePct)) + ")");
        return rows;
    };

    series.addEventHandler("click", (e => {
        let character = e.seriesValue[0];
        if(character !== "Others") {
            $("#CharacterSelect option[value='" + character + "']")[0].selected = true; //lol works better than .attr
            $("#CharacterFilter").prop("checked", true);
            $("#CharacterSelect")[0].onchange();
        }
    }));

    pieChart.draw();

    pieSvg.selectAll(".dimple-others.dimple-pie").style("fill", "rgba(217, 217, 217,0.8)");
    pieSvg.selectAll(".dimple-others.dimple-pie").style("stroke", "rgba(182, 182, 182,0.8)");
    pieSvg.selectAll(".dimple-others.dimple-legend-key").style("fill", "rgba(217, 217, 217,0.8)");
    pieSvg.selectAll(".dimple-others.dimple-legend-key").style("stroke", "rgba(182, 182, 182,0.8)");

}


let pie = {
    init: initPie,
    redraw: redrawPieChart,
    chart: pieChart,
    svg: pieSvg
};

//module.exports.pie = pie;