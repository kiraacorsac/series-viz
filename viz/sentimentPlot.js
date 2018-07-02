let sentimentViz = {};
let sentimentVizSvg = {};


function countSentimentEpisode(episodes, character) {
    let characterFilter = (l => character !== null ? l.Character === character : true);
    return episodes
        .map((ep, i) => {
            let rep = ep;
            rep.order = i + 1;
            return rep;
        })
        .filter(ep => ep.ScriptLines.filter(characterFilter).length > 0)
        .map((ep) => {
        return {
            order: ep.order,
            epName: ep.EpisodeName,
            season: ep.Season,
            episode: ep.Episode,
            sentiment: d3.mean(ep.ScriptLines
                .filter(characterFilter), (l => l.Sentiment)) ,
            character: null
            // .filter(l => l.Sentiment != 0))
        }
    })
}

function countSentimentLines(lines, character) {
    return lines
        .map((line, i) => {
          let rline = line;
          rline.realOrder = i+1;
          return rline;
        })
        .filter(l => character !== null ? l.Character === character : true)
        .map((line, i) => {
            return {
                order: line.realOrder,
                character: line.Character,
                epName: i,
                sentiment: line.Sentiment,
                line: line.Delivery
            }
        })
}



function redrawSentimentViz() {
    // sentimentViz.axes[1].overrideMax = null;
    // sentimentViz.axes[1].overrideMin = null;
    let query = {};

    let character = $('#CharacterFilter').is(":checked") ? $('#CharacterSelect')[0].value : null;

    if($('#EpisodeFilter').is(":checked")){
        query = data[$('#SeasonSelect')[0].valueAsNumber-1][$('#EpisodeSelect')[0].valueAsNumber-1].ScriptLines;
        query = countSentimentLines(query, character);
        if(query.length > 0) {
            // sentimentViz.axes[1].overrideMin = query[0].order-1;
            // sentimentViz.axes[1].overrideMax = query[query.length - 1].order+1;
        }
    } else {

        if($('#SeasonFilter').is(":checked")){
            query = data[$('#SeasonSelect')[0].valueAsNumber-1];
        } else {
            query = data.reduce((acc, val) => acc.concat(val), []);
        }
        query = countSentimentEpisode(query, character);
    }

    let trendlinePoint = (v, data) => regression
        .linear(data.map(e => [e.order, e.sentiment*1000000])
        .filter(e => Number.isFinite(e[1])))
        .predict(v);

    let trendData = query.length > 2 ?
        [
            {
                order: 1,
                sentiment: trendlinePoint(1, query)[1]/1000000
            },
            {
                order: query.length>0 ? query[query.length-1].order : 1,
                sentiment: trendlinePoint(query.length, query)[1]/1000000
            }
        ] :
        [
        ];

    sentimentViz.series[1].data = query;
    sentimentViz.series[0].data = trendData;
    sentimentViz.draw();
    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke-dasharray", 5);
    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke", "rgba(212, 151, 82,0.3)");
    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke-width", 40);
    sentimentVizSvg.selectAll(".dimple-series-group-0").selectAll("circle").on("mouseover", () => {});

    //sentimentVizSvg.selectAll(".dimple-marker,.dimple-marker-back").attr("r", 2);
    sentimentVizSvg.selectAll(".dimple-series-group-1").selectAll("circle").style("stroke-width", 2);
    //sentimentVizSvg.selectAll("path.dimple-series-1").style("stroke-dasharray", 1);

    let max = -1;
    let min =  1;
    sentimentVizSvg.selectAll(".dimple-series-group-1")
        .selectAll("circle.dimple-marker")
        .each(node => {
            max = Math.max(max, node.cy);
            min = Math.min(min, node.cy);
        })
        .style("stroke", (node) => {
            //Y = (X-A)/(B-A) * (D-C) + C
            let color = ((node.cy - min)/(max-min)) * 245
            return "rgb(255," + color + ", 66)";
        }).style("fill", (node) => {
        return "#FFFFFF"
    });

    let gradient = sentimentVizSvg.selectAll("linearGradient");

    gradient.selectAll("stop")
        .remove();

    gradient.append("stop")
        .attr("stop-color", "rgb(255," + 245 + ", 66)")
        .attr("offset", "0%");

    gradient.append("stop")
        .attr("stop-color", "rgb(255," + 0 + ", 66)")
        .attr("offset", "100%");

    sentimentVizSvg.selectAll("path.dimple-series-1").style("stroke", "url(#trendline-gradient)");

    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke-dasharray", 5);
    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke", "rgba(212, 151, 82,0.3)");
    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke-width", 40);

}


function initSentimentPlot() {

    sentimentVizSvg = dimple.newSvg("#sentimentPlotVizContainer", 900, 400);
    let sentimentPlotData = countSentimentEpisode(data.reduce((acc, val) => acc.concat(val), []), null);

    let reg = regression.linear(sentimentPlotData.map(e => [e.order, e.sentiment*1000000]));
    let trendline = v => reg.predict(v);
    let trendData = [
        {
            order: 1,
            sentiment: trendline(1)[1]/1000000,
            epName: "start"
        },
        {
            order: sentimentPlotData[sentimentPlotData.length-1].order,
            sentiment: trendline(sentimentPlotData.length)[1]/1000000,
            epName: "end"
        }
    ];

    sentimentViz = new dimple.chart(sentimentVizSvg, sentimentPlotData);
    sentimentViz.setBounds(60,30,820,360);
    let a = sentimentViz.addMeasureAxis("y", "sentiment");
    a.title = "- Sentiment +";
    sentimentViz.addMeasureAxis("x", "order");
    let trend = sentimentViz.addSeries("order", dimple.plot.line);
    trend.data = trendData;
    let s = sentimentViz.addSeries("epName", dimple.plot.line);

    s.lineMarkers = true;
    s.data = sentimentPlotData;
    s.addEventHandler("click", (e => {
        let episodeMode = $('#EpisodeFilter').is(':checked') &&
            $('#SeasonFilter').is(':checked');
        if(!episodeMode){
            let selectedEp = data.reduce((eps, e) => eps.concat(e), []).find(ep => ep.EpisodeName === e.seriesValue[0]);
            $('#SeasonFilter').prop("checked", "true");
            OnSeasonFilterChange();
            $('#SeasonSelect').val(selectedEp.Season);
            OnSeasonSelectChange();
            redrawSentimentViz();
            $('#EpisodeFilter').prop("checked", "true");
            OnEpisodeFilterChange();
            $('#EpisodeSelect').val(selectedEp.Episode);
            OnEpisodeSelectChange();
            redrawSentimentViz();
        }
    }));
    sentimentViz.draw();

    //sentimentVizSvg.selectAll(".dimple-marker,.dimple-marker-back").attr("r", 2);
    sentimentVizSvg.selectAll(".dimple-series-group-1").selectAll("circle").style("stroke-width", 2);
    //sentimentVizSvg.selectAll("path.dimple-series-1").style("stroke-dasharray", 1);

    let max = -1;
    let min =  1;
    sentimentVizSvg.selectAll(".dimple-series-group-1")
        .selectAll("circle.dimple-marker")
        .each(node => {
            max = Math.max(max, node.cy);
            min = Math.min(min, node.cy);
        })
        .style("stroke", (node) => {
            //Y = (X-A)/(B-A) * (D-C) + C
            let color = ((node.cy - min)/(max-min)) * 245
            return "rgb(255," + color + ", 66)";
        }).style("fill", (node) => {
        return "#FFFFFF"
    });

    sentimentVizSvg.selectAll(".dimple-series-group-0").selectAll("circle").on("mouseover", () => {});

    let defs = sentimentVizSvg.append("defs");
    let linearGradient = defs.append("linearGradient")
        .attr("id", "trendline-gradient")
        .attr("gradientUnits","objectBoundingBox")
        .attr("x1","0%")
        .attr("x2","0%")
        .attr("y1", "0%")
        .attr("y2", "100%");

    linearGradient.append("stop")
        .attr("stop-color", "rgb(255," + 245 + ", 66)")
        .attr("offset", "0%");

    linearGradient.append("stop")
        .attr("stop-color", "rgb(255," + 0 + ", 66)")
        .attr("offset", "100%");

    sentimentVizSvg.selectAll("path.dimple-series-1").style("stroke", "url(#trendline-gradient)");

    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke-dasharray", 5);
    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke", "rgba(212, 151, 82,0.3)");
    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke-width", 40);


    s.getTooltipText = e => {
        let rows = [];
        let episodeMode = $('#EpisodeFilter').is(':checked') &&
            $('#SeasonFilter').is(':checked');
        if(episodeMode){
            let ep = sentimentViz.series[1].data.find(l => e.xValue === l.order);
            rows.push("Order: " + e.xValue);
            rows.push("Character: " + ep.character);
            rows.push("\"" + ep.line + "\"");
            rows.push("Sentiment: " + ep.sentiment);
        } else {
            let ep =sentimentViz.series[1].data.find(ep => e.xValue === ep.order);
            rows.push("Season " + ep.season + " Episode " + ep.episode);
            rows.push(e.aggField[0]);
            rows.push("Sentiment: " + (d3.format(".4"))(ep.sentiment));
        }
        return rows;
    };
}

let sentimentPlot = {
    init: initSentimentPlot,
    redraw: redrawSentimentViz,
    chart: sentimentViz,
    svg: sentimentVizSvg
};