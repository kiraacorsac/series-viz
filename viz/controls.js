function OnSeasonFilterChange() {
    let checked = $('#SeasonFilter').is(":checked");
    $('#EpisodeFilter').prop("disabled", !checked);
    $('#EpisodeSelect').prop("disabled", !checked);
    $('#seasonnum').html(checked ? $('#SeasonSelect')[0].value : "All");

    let query = data[$('#SeasonSelect')[0].valueAsNumber - 1];
    $('#EpisodeSelect').attr("max", query.length);

    if (!checked) {
        $('#EpisodeFilter').prop("checked", false);
        $('#EpisodeFilter')[0].onchange();
    }

    redrawAll();
}

$('#SeasonFilter')[0].onchange = OnSeasonFilterChange;


function OnSeasonSelectChange() {
    if ($('#SeasonFilter').is(":checked")) {
        $('#seasonnum').html($('#SeasonSelect')[0].value);

        let query = data[$('#SeasonSelect')[0].valueAsNumber - 1];
        $('#EpisodeSelect').attr("max", query.length);
        if ($('#EpisodeSelect').is(":checked")) {
            $('#epnum').html($('#EpisodeSelect')[0].value);
        }
        redrawAll();
    }
}

$('#SeasonSelect').on("input change", OnSeasonSelectChange);

function OnEpisodeFilterChange() {
    let checked = $('#EpisodeFilter').is(":checked");
    $('#epnum').html(checked ? $('#EpisodeSelect')[0].value : "All");

    if ($('#SeasonFilter').is(":checked")) {
        redrawAll();
    }
}

$('#EpisodeFilter')[0].onchange = OnEpisodeFilterChange;

function OnEpisodeSelectChange() {
    if ($('#SeasonFilter').is(":checked") && $('#EpisodeFilter').is(":checked")) {
        $('#epnum').html($('#EpisodeSelect')[0].value);
        redrawAll();
    }
}

$('#EpisodeSelect').on("input change", OnEpisodeSelectChange);

$('#CharacterFilter')[0].onchange = function () {
    redrawAll();
};

$('#CharacterSelect')[0].onchange = function () {
    if($('#CharacterFilter').is(":checked")) {
        redrawAll();
    }
};


function headerRedraw() {
    let epname = "";
    if ($('#SeasonFilter').is(":checked") && $('#EpisodeFilter').is(":checked")) {
        epname = ": " + data[$('#SeasonSelect')[0].valueAsNumber - 1][$('#EpisodeSelect')[0].valueAsNumber - 1].EpisodeName;
    }
    $('#epname').html(epname);

}



function redrawAll() {
    pie.redraw();
    sentimentPlot.redraw();
    episodeTimeline.redraw();
    headerRedraw();
}