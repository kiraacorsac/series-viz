let sentimentViz = {};
let sentimentVizSvg = {};


function countSentimentEpisode(episodes, character) {
    let characterFilter = (l => character !== null ? l.Character === character : true);
    return episodes
    //precomp order, then filter those where character has no lines
        .map((ep, i) => {
        return {
            order: i+1,
            epName: ep.EpisodeName,
            season: ep.Season,
            episode: ep.Episode,
            sentiment: d3.mean(ep.ScriptLines
                .filter(characterFilter), (l => l.Sentiment.Compound)),
            character: null
            // .filter(l => l.Sentiment.Compound != 0))
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
                sentiment: line.Sentiment.Compound,
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

    let trendline = v => regression.linear(query.map(e => [e.order, e.sentiment*1000000]).filter(e => Number.isFinite(e[1]))).predict(v);
    let trendData = query.length > 2 ?
        [
            {
                order: 1,
                sentiment: trendline(1)[1]/1000000
            },
            {
                order: query.length>0 ? query[query.length-1].order : 1,
                sentiment: trendline(query.length)[1]/1000000
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
    sentimentVizSvg.selectAll(".dimple-marker,.dimple-marker-back").attr("r", 2);
    sentimentVizSvg.selectAll(".dimple-series-group-0").selectAll("circle").on("mouseover", () => {});


}


function initSentimentPlot() {

    sentimentVizSvg = dimple.newSvg("#sentimentPlotVizContainer", 900, 400);
    let sentimentPlotData = countSentimentEpisode(data.reduce((acc, val) => acc.concat(val), []), null);

    let reg = regression.linear(sentimentPlotData.map(e => [e.order, e.sentiment*1000000]));
    let trendline = v => reg.predict(v);
    let trendData = [
        {
            order: 1,
            sentiment: trendline(1)[1]/1000000
        },
        {
            order: sentimentPlotData[sentimentPlotData.length-1].order,
            sentiment: trendline(sentimentPlotData.length)[1]/1000000
        }
    ];
    sentimentViz = new dimple.chart(sentimentVizSvg, sentimentPlotData);
    sentimentViz.setBounds(60,30,860,360);
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
            $('#SeasonFilter')[0].onchange();
            $('#SeasonSelect').val(selectedEp.Season);
            $('#SeasonSelect')[0].onchange();
            redrawSentimentViz();
            $('#EpisodeFilter').prop("checked", "true");
            $('#EpisodeFilter')[0].onchange();
            $('#EpisodeSelect').val(selectedEp.Episode);
            $('#EpisodeSelect')[0].onchange();

            redrawSentimentViz();
        }
    }));
    sentimentViz.draw();
    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke-dasharray", 5);
    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke", "rgba(212, 151, 82,0.3)");
    sentimentVizSvg.selectAll("path.dimple-series-0").style("stroke-width", 40);
    sentimentVizSvg.selectAll(".dimple-marker,.dimple-marker-back").attr("r", 2);

    sentimentVizSvg.selectAll(".dimple-series-group-0").selectAll("circle").on("mouseover", () => {});


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