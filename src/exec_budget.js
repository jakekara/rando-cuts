const d3 = require("d3");
const numeral = require("numeraljs");
var mega = require("../data/mega.json");

// add diff and diff_pct

mega = mega.map(function(a){
    a["diff_pct"] = numeral(a["Adjustment"]).value() / numeral(a["Appropriated"]).value()

    return a;
});

console.log(mega);

var agencies_all = mega.map(function(r){ return r["agency"]; })

var agencies = [];

// dedupe agencies_all
agencies_all.forEach(function(a){
    if (agencies.indexOf(a) < 0) agencies.push(a);
});

agencies = agencies.sort(function(a, b){
    if (a < b) return -1; return 1;
})



var dept_data = function(agency)
{
    return mega.filter(function(a){
	return ((a["agency"] == agency) && (a["Allocation"] != null)); 
    })
}

var totals  = mega.filter(function(a){
    return a["Financial Summary"] == "TOTAL - ALL FUNDS";
});


var dept_total = function(agency)
{

    var matches = totals.filter(function(a){
	return a["agency"] == agency;
    });

    if (matches.length != 1) return null;

    return matches[0];

}

// start drawing
var draw_it = function(){
    var sel = d3.select("#container");

    var departments = sel.selectAll(".department")
	.data(agencies)
	.enter()
	.append("div")
	.classed("department", true)

    var dept_titles = departments.append("h5").text(function(d){
	var ret =  d;
	return ret;
    });

    var dept_title_deets = dept_titles.append("small").text(function(d){

	var ret = "";
	var total_cut = dept_total(d)

	if (total_cut != null)
	{
	    ret += " " + numeral(total_cut["Adjustment"]).format("$0a").toUpperCase();
	    ret += " (" + numeral(total_cut["diff_pct"]).format("+0%") + ")";
	}
        
	return ret;
    });

    var cut_details = departments.selectAll(".detail-container")
	.data(function(d){ return dept_data(d); })
	.enter().append("div").append("table")
	.classed("detail-container", true)

    cut_details
    cut_details.append("div").text(function(d){ return d["Financial Summary"]; })
}

var get_random_cut = function(min_pct)
{
    var cuts = mega.filter(function(a){

	return (a["Financial Summary"] != null)
	    && (a["Financial Summary"].indexOf("TOTAL") < 0)
	    && (a["diff_pct"] < -.1);
    });	    // o
    

    // return cuts;
    return cuts[Math.round(Math.random() * cuts.length)];
}

var draw_rando = function(){
    // console.log(get_random_cut());


    var rando_fillup = d3.select("#container").append("div");
    var bar_holder = rando_fillup.append("div").classed("bar-holder", true);
    var bar = bar_holder.append("div").classed("bar", true);    

    var rando_text = d3.select("#container").append("div");

    var footnote = d3.select("#container").append("div")
	.classed("footnote", true)
	.html("Changes from FY 2017 budget to governor's <a href='https://www.documentcloud.org/documents/3878237-20170626-Executive-Order-Resource-Allocation-Plan.html'>"
	      + "executive order budget</a>");

    var play_pause = footnote.append("span")
	.classed("play-pause", true)
	.attr("data-paused", false)
	.html('<i class="fa fa-pause" aria-hidden="true"></i>');

    var step_forward = footnote.append("span")
	.classed("play-pause", true)
	.attr("data-paused", false)
	.html('<i class="fa fa-step-forward" aria-hidden="true"></i>')

    footnote.append("div").classed("clear-both", true);
	      
    
    var height = 0;
    var fill_up = function(diff_pct)
    {

	var total_fill = Math.max(1 + diff_pct) * 100;
	var current_fill = 100;

	// console.log("Filling up", current_fill, total_fill);
	
	var fill_interval = setInterval(function(){
	    bar.style("width", current_fill + "%");
	    if (current_fill > total_fill){
		current_fill --;
	    }
	    else {
		clearInterval(fill_interval);
	    }
	}, 10);
	
    }
    

    var update = function(){
	rando_text.classed("rando", true)
	    .html(function(){
		var cut = get_random_cut(.1)
		var ret = ""
		+ "<h1>"
		+ numeral(cut["Adjustment"]).format("+$0a")
		.toUpperCase().replace("$+","+$")
		.replace("M"," million")
		.replace("K",",000")
		.replace("B", "billion")
		+ "<span class='subtle'>"
		+ " (" + numeral(cut["diff_pct"]).format("+0%") + ")"
		+ "</span>"
		+ "</h1>"

		    + "<h3>"
		+ cut["Financial Summary"].toUpperCase()
		+ "</h3>"
		+ " <h3 class='subtle'>"
		+ cut["agency"]
		+ "</small>"
		+ "</h3>"

		fill_up(cut["diff_pct"]);

		return ret;
	    });

	var new_height = rando_text.node().getBoundingClientRect().height;
	if (new_height > height){
	    height = new_height
	    rando_text.style("min-height",height + "px");
	}
    }

    update();

    var interval = null;

    var play = function(){
	interval = setInterval( update, 3000 )
	play_pause.html('<i class="fa fa-pause" aria-hidden="true"></i>')
	    .attr("data-paused", "false");
    }

    var pause = function(){
	clearInterval(interval);
	play_pause.html('<i class="fa fa-play" aria-hidden="true"></i>')
	    .attr("data-paused", "true");
    }

    var play_or_pause = function(){

	// console.log("Play or pause",
	// 	    play_pause.attr("data-paused"));
	if (play_pause.attr("data-paused") == "true")
	{
	    // console.log("Playing");
	    update();
	    play();
	}
	else{
	    pause();
	}
    }
    play();

    var play_or
    

    step_forward.on("click", update);
    play_pause.on("click", play_or_pause);

	
}

draw_rando();
