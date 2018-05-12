$('#SeasonFilter')[0].onchange = function() {
    let checked = $('#SeasonFilter').is(":checked");
    $('#EpisodeFilter').prop("disabled", !checked);
    $('#EpisodeSelect').prop("disabled", !checked);
    $('#seasonnum').html(checked ? $('#SeasonSelect')[0].value : "All");

    let query = data[$('#SeasonSelect')[0].valueAsNumber-1];
    $('#EpisodeSelect').attr("max", query.length);

    if (!checked) {
        $('#EpisodeFilter').prop("checked", false);
        $('#EpisodeFilter')[0].onchange();
    }

    pie.redraw();
    sentimentPlot.redraw();
};

$('#SeasonSelect')[0].onchange = function() {
    if($('#SeasonFilter').is(":checked")) {
        $('#seasonnum').html($('#SeasonSelect')[0].value);

        let query = data[$('#SeasonSelect')[0].valueAsNumber-1];
        $('#EpisodeSelect').attr("max", query.length);
        if($('#EpisodeSelect').is(":checked")){
            $('#epnum').html($('#EpisodeSelect')[0].value);
        }
        pie.redraw();
        sentimentPlot.redraw();
    }
};

$('#EpisodeFilter')[0].onchange = function () {
    let checked = $('#EpisodeFilter').is(":checked");
    $('#epnum').html(checked ? $('#EpisodeSelect')[0].value : "All");

    if($('#SeasonFilter').is(":checked")) {
        pie.redraw();
        sentimentPlot.redraw();
    }
};

$('#EpisodeSelect')[0].onchange = function () {
    if($('#SeasonFilter').is(":checked") && $('#EpisodeFilter').is(":checked")) {
        $('#epnum').html($('#EpisodeSelect')[0].value);
        pie.redraw();
        sentimentPlot.redraw();
    }
};

$('#CharacterFilter')[0].onchange = function () {
    pie.redraw();
    sentimentPlot.redraw()
};

$('#CharacterSelect')[0].onchange = function () {
    if($('#CharacterFilter').is(":checked")){
        pie.redraw();
        sentimentPlot.redraw()
    }
};