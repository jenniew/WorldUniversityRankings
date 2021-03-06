d3.csv("metadata/timesData.csv", function (err, data) {

    var width = 768,
        height = 468;

    var color = d3.scale.linear()
        .range(["#EEDCEC", "#5E07A1"])
        .interpolate(d3.interpolateLab)

    var projection = d3.geo.mercator()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / 2])
        .precision(.1);

    var path = d3.geo.path()
        .projection(projection);

    var graticule = d3.geo.graticule();

    var svg = d3.select("#canvas-svg").append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);

    function log10(val) {
        return Math.log(val);
    }


    function drawmap(year) {
        d3.json("metadata/world-topo-min.json", function (error, world) {
            var countries = topojson.feature(world, world.objects.countries).features;

            svg.append("path")
                .datum(graticule)
                .attr("class", "choropleth")
                .attr("d", path);

            var g = svg.append("g");

            g.append("path")
                .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
                .attr("class", "equator")
                .attr("d", path);

            var valueHash = {}
            var ranking = {}
            var max = 0
            var min = 1000000
            data.forEach(function (d) {
                if (d.year === year) {
                    var name = d.country
                    if (!(name in valueHash)) {
                        valueHash[name] = {}
                        valueHash[name]["count"] = 1
                        valueHash[name]["names"] = [d.university_name]
                        valueHash[name]["ranknums"] = {}
                        valueHash[name]["ranknums"]["rank 1 - 20:"] = 0;
                        valueHash[name]["ranknums"]["rank 21 - 40:"] = 0;
                        valueHash[name]["ranknums"]["rank 41 - 60:"] = 0;
                        valueHash[name]["ranknums"]["rank 61 - 80:"] = 0;
                        valueHash[name]["ranknums"]["rank 81 - 100:"] = 0;
                    }
                    else {
                        valueHash[name]["count"] = +valueHash[name]["count"] + 1
                        valueHash[name]["names"].push(d.university_name)
                    }
                    r = +d.world_rank
                    if (r >= 1 && r <= 20) {
                        valueHash[name]["ranknums"]["rank 1 - 20:"] += 1;
                    }
                    else if (r >= 21 && r <= 40) {
                        valueHash[name]["ranknums"]["rank 21 - 40:"] += 1;
                    }
                    else if (r >= 41 && r <= 60) {
                        valueHash[name]["ranknums"]["rank 41 - 60:"] += 1;
                    }
                    else if (r >= 61 && r <= 80) {
                        valueHash[name]["ranknums"]["rank 61 - 80:"] += 1;
                    }
                    else if (r >= 81 && r <= 100) {
                        valueHash[name]["ranknums"]["rank 81 - 100:"] += 1;
                    }
                    max = Math.max(max, valueHash[name]["count"])
                    min = Math.min(min, valueHash[name]["count"])
                    ranking[d.university_name] = d.world_rank
                }
            });
            color.domain([min, max]);
            var country = g.selectAll(".country").data(countries);

            country.enter().insert("path")
                .attr("class", "country")
                .attr("d", path)
                .attr("id", function (d, i) {
                    return d.id;
                })
                .attr("title", function (d) {
                    return d.properties.name;
                })
                .attr("class", "country")
                .attr("d", path)
                .attr("id", function (d, i) {
                    return d.id;
                })
                .attr("title", function (d) {
                    return d.properties.name;
                })
                .style("fill", function (d) {
                    if (valueHash[d.properties.name]) {
                        return color(valueHash[d.properties.name]["count"]);
                    }
                    else {
                        return "#E1E1E4";
                    }
                })
                .on("mousemove", function (d) {
                    var html = "";

                    html += "<div class=\"tooltip_kv\">";
                    html += "<span class=\"tooltip_key\">";
                    html += d.properties.name;
                    html += "</span>";
                    html += "<span class=\"tooltip_value\">";
                    html += (valueHash[d.properties.name] ? valueHash[d.properties.name]["count"] : "0") + " universities";
                    html += "</span>";
                    html += "<br><br>";
                    if (d.properties.name in valueHash) {
                        var dict = valueHash[d.properties.name]["ranknums"]
                        for (var p in dict) {
                            html += "<span class=\"tooltip_key\">";
                            html += p;
                            html += "</span>";
                            html += "<span class=\"tooltip_value\">";
                            html += dict[p];
                            html += "</span>";
                            html += "<br>"
                        }
                    }
                    html += "";
                    html += "</div>";

                    $("#tooltip-container").html(html);
                    $(this).attr("fill-opacity", "0.8");
                    $("#tooltip-container").show();

                    var coordinates = d3.mouse(this);
                    d3.select("#tooltip-container")
                        // .style("top", 270 + "px")
                        // .style("left", 850 + "px");
                        .style("left", (d3.event.pageX) + 50 + "px")
                        .style("top", (d3.event.pageY - 30) + "px");
                })
                .on("mouseout", function () {
                    $(this).attr("fill-opacity", "1.0");
                    $("#tooltip-container").hide();
                });
            g.append("path")
                .datum(topojson.mesh(world, world.objects.countries, function (a, b) {
                    return a !== b;
                }))
                .attr("class", "boundary")
                .attr("d", path);
        });
    }

    drawmap("2016");

    d3.select("#sy_select")
        .selectAll("a")
        .data(["2016", "2015", "2014", "2013", "2012", "2011"])
        .on("click", function (d) {
            d3.event.preventDefault();
            d3.selectAll("#sy_select a")
                .classed("selected", false);
            d3.select(this).classed("selected", true);

            selectYear = d;
            document.getElementById('pc').innerHTML = "<div id='tooltip_pc'><div></div></div>";
            AynalyseUniversityInfo(selectYear, selectSegment);
        });


    d3.select("#sr_select")
        .selectAll("a")
        .data(["1-25", "26-50", "51-75", "76-100"])
        .on("click", function (d) {
            d3.event.preventDefault();
            d3.selectAll("#sr_select a")
                .classed("selected", false);
            d3.select(this).classed("selected", true);

            switch (d) {
                case "1-25" :
                    selectSegment = 0;
                    break;
                case "26-50" :
                    selectSegment = 1;
                    break;
                case "51-75" :
                    selectSegment = 2;
                    break;
                case "76-100" :
                    selectSegment = 3;
            }
            document.getElementById('pc').innerHTML = "<div id='tooltip_pc'><div></div></div>";
            AynalyseUniversityInfo(selectYear, selectSegment);
        });


    d3.select("#sm_select")
        .selectAll("a")
        .data(["2016", "2015", "2014", "2013", "2012", "2011"])
        .on("click", function (d) {
            d3.event.preventDefault();
            d3.selectAll("#sm_select a").classed("selected", false);
            d3.select(this).classed("selected", true);
            drawmap(d);
        })
    d3.select(self.frameElement).style("height", height + "px");
});
