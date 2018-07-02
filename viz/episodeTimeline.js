let timeline = {};
let timelineSvg = {};
let pieColorGetter = {};

//modified from dimple.js
function showTooltip(rect, tipTexts, scaling) {
        // The margin between the text and the box
        let textMargin = 5,
            // The margin between the ring and the popup
            popupMargin = 10,
            // Collect some facts about the highlighted bar
            x = rect.node().getBBox().x,
            y = rect.node().getBBox().y,
            width = rect.node().getBBox().width,
            height = rect.node().getBBox().height,
            t,
            box,
            // The running y value for the text elements
            yRunning = 0,
            // The maximum bounds of the text elements
            w = 0,
            h = 0,
            // Values to shift the popup
            translateX,
            translateY,
            transformer,
            offset,
            transformPoint = function (x, y) {
                let matrix = rect.node().getCTM(),
                    position = timelineSvg.node().createSVGPoint();
                position.x = x || 0;
                position.y = y || 0;
                return position.matrixTransform(matrix);
            };
        let tooltip = timelineSvg.append("g")
            .attr("class", "dimple-tooltip");

        // Add a group for text
        t = tooltip.append("g")
            .attr("font-size", "10px")
            .attr("shape-rendering", "crispEdges");

        // Create a box for the popup in the text group
        box = t.append("rect")
            .attr("class", "dimple-tooltip dimple-custom-tooltip-box" /*+ chart.customClassList.tooltipBox */)

        tipTexts.forEach((tt, i) => {
            t.append("text")
                .attr("class", "dimple-tooltip dimple-custom-tooltip-label")
                .attr("dy", i )
                .text(tt);
        });


        // Get the max height and width of the text items
        t.each(function () {
            w = (this.getBBox().width > w ? this.getBBox().width : w);
            h = (this.getBBox().width > h ? this.getBBox().height : h);
        });

        // Position the text relative to the bar, the absolute positioning
        // will be done by translating the group
        t.selectAll("text")
            .attr("x", 0)
            .attr("y", function () {
                // Increment the y position
                yRunning += this.getBBox().height;
                // Position the text at the centre point
                return yRunning - (this.getBBox().height / 2);
            });

        // Draw the box with a margin around the text
        box.attr("x", -textMargin)
            .attr("y", -textMargin)
            .attr("height", (tipTexts.length-1) * 15 + 2*textMargin)
            .attr("width", w + 2 * textMargin)
            .attr("rx", 5)
            .attr("ry", 5)
            .call(function (context) {
                // Apply formats optionally
                    context//.style("fill", popupFillColor)
                        //.style("stroke", popupStrokeColor)
                        .style("stroke-width", 2)
                        .style("opacity", 0.95);
            });

        if (transformPoint(x*scaling + textMargin + popupMargin + w*scaling).x < 900) {
            // Draw centre right
            translateX = (x - 10);
        } else {
            // Draw left
            translateX = (width + 20) - (textMargin + popupMargin + w*scaling);
        }
        translateY = (y + (height + textMargin + popupMargin));
        transformer = transformPoint(translateX, translateY);
        t.attr("transform", "translate(" + transformer.x + " , " + transformer.y + ")");
}

function removeTooltip() {
    timelineSvg.selectAll(".dimple-tooltip").remove();
}

function cutDelivery(string){
    let delivery = string.split(" ");
    let cutUp = [];
    delivery.forEach((d, i) => {
        if(i % 20 === 0){
            cutUp.push("")
        }
        cutUp[cutUp.length-1] += (d + " ");
    });
    return cutUp;
}
function initTimeline() {
    let query = data[4];
    timelineSvg =
        d3.select("#episodeTimelineVizContainer")
            .append("svg")
            .attr("width", 910)
            .attr("height", 600);
    pieColorGetter = pieChart.getColor.bind(pieChart);

    redrawTimeline();
}

function redrawTimeline() {
    let episodeMode = false;
    let seasonMode = false;
    let query = data;
    if($('#SeasonFilter').is(":checked")){
        seasonMode = true;
        query = data[$('#SeasonSelect')[0].valueAsNumber-1];
        if($('#EpisodeFilter').is(":checked")){
            episodeMode = true;
            query = query[$('#EpisodeSelect')[0].valueAsNumber-1];
        }
    }
    timelineSvg.selectAll("*").remove();

    if(!seasonMode && !episodeMode){
        timelineSvg.append("g")
            .append("text")
            .text("Turn on Season or Episode filter to view the episode timeline!")
            .attr("dy", "2em")
            .attr("shape-rendering", "crispEdges");

    }
    if(seasonMode && !episodeMode) {
        let cumWidth = 0;
        query.forEach((ep, i) => {
            let totalWidth = ep.ScriptLines.reduce((width, sl) => (width + sl.Delivery.length + 4), 0);
            let episodeLine = timelineSvg.append("g")
                .attr("transform", "translate(110,0),scale(" + 1 / (totalWidth / 790) + ",1)");
            episodeLine.on("click", (e => {
                $('#SeasonFilter').prop("checked", "true");
                OnSeasonFilterChange();
                $('#SeasonSelect').val(ep.Season);
                OnSeasonSelectChange();
                $('#EpisodeFilter').prop("checked", "true");
                OnEpisodeFilterChange();
                $('#EpisodeSelect').val(ep.Episode);
                OnEpisodeSelectChange();
            }));

                let episodeNameLine = timelineSvg.append("g");
            episodeNameLine
                .append("text")
                .text(ep.EpisodeName)
                .attr("transform", "translate(0," + ((i*22) + 13) + ")")
                .attr("font-size", "10px")
                .attr("shape-rendering", "crispEdges");
            cumWidth = 0;
            ep.ScriptLines.forEach((sl, order) => {
                if (sl.Delivery.length > 0) {
                    if((!$('#CharacterFilter').is(":checked")) || ($('#CharacterFilter').is(":checked") && ($('#CharacterSelect')[0].value === sl.Character))) {
                        let color = pieColorGetter(sl.Character);
                        let rect = episodeLine
                            .append("rect")
                            .attr("width", (sl.Delivery.length))
                            .attr("height", 20)
                            .attr("fill", color.fill)
                            .attr("stroke", color.stroke)
                            .attr("opacity", Math.abs(sl.Sentiment) * 0.75 + 0.25)
                            .attr("transform", "translate(" + cumWidth + "," + i * 22 + ")")
                        rect.on("mouseover", () => showTooltip(rect, [
                            "Order: " + order,
                            "Character: " + sl.Character
                            ].concat(cutDelivery(sl.Delivery)).concat([
                            "Sentiment: " + sl.Sentiment
                        ]), (totalWidth / 790)))
                            .on("mouseleave", removeTooltip);
                    }
                    cumWidth += (sl.Delivery.length) + 4;
                }
            })
        })
    }

    if(episodeMode){
        let totalWidth = query.ScriptLines.reduce((width, sl) => (width + sl.Delivery.length + 4), 0);
        let characters = query.ScriptLines.map(sl => sl.Character);

        let uniq = characters
            .map((name) => {
                return {count: 1, name: name};
            })
            .reduce((a, b) => {
                a[b.name] = (a[b.name] || 0) + b.count;
                return a;
            }, {});

        let sortedCharacters = Object.keys(uniq).sort((a, b) => uniq[b] - uniq[a]);
        let characterLines = {};

        let epsvg = timelineSvg.append("g")
            .attr("id", query.EpisodeName+"data")
            .attr("transform", "translate(110,0),scale(" + 1 / (totalWidth / 790) + ",1)")
        sortedCharacters.forEach((ch, i) => {
            characterLines[ch] = epsvg.append("g")
                .attr("id", ch)
                .attr("transform", "translate(0," + i*22 + ")");
            timelineSvg
                .append("text")
                .text(ch)
                .attr("transform", "translate(0," + ((i*22) + 13) + ")")
                .attr("font-size", "10px")
                .attr("shape-rendering", "crispEdges");
        });

        let cumWidth = 0;
        query.ScriptLines.forEach((sl, i) => {
            if (sl.Delivery.length > 0) {
                let color = pieColorGetter(sl.Character);
                let rect = characterLines[sl.Character]
                    .append("rect")
                    .attr("width", (sl.Delivery.length))
                    .attr("height", 20)
                    .attr("fill", color.fill)
                    .attr("stroke", color.stroke)
                    .attr("opacity", Math.abs(sl.Sentiment) * 0.75 + 0.25)
                    .attr("transform", "translate("  + cumWidth + ")");
                rect.on("mouseover", () => showTooltip(rect, [
                    "Order: " + i,
                    "Character: " + sl.Character
                ].concat(cutDelivery(sl.Delivery)).concat([
                    "Sentiment: " + sl.Sentiment
                ]), (totalWidth / 790)))
                    .on("mouseleave", removeTooltip);

                cumWidth += (sl.Delivery.length) + 4;

            }
        })
    }
    let bb = timelineSvg.node().getBBox();
    timelineSvg.node().setAttribute("height", (120+bb.height) + "px");
}

let episodeTimeline = {
    init: initTimeline,
    redraw: redrawTimeline,
    chart: timeline,
    svg: timelineSvg
};