function ErrorPlot(id, options){
	this.id=id
	this.options=_.defaultsDeep(options,{
		width: 2721/2, // must preserve aspect ratio
		height: 701/2,
		margin: {
			left:70,
			right:130
		}
	})
	this.data=[]
}
ErrorPlot.prototype.init = function(x,y){
	this.totalWidth = this.options.margin.left+this.options.width+this.options.margin.right
	this.totalHeight = this.options.margin.top+this.options.height+this.options.margin.bottom

    this.vis = d3.select(this.id).append("svg")
        .attr("width", this.totalWidth)
        .attr("height", this.totalHeight);

    // create x and y transforms
    var {xmin, xmax, ymin, ymax} = this.options.extent
    this.x = d3.scale.linear()
        .domain([xmin, xmax])
        .range([this.options.margin.left, this.options.width+this.options.margin.left]);

    this.y = d3.scale.linear()
	// this.y = d3.scale.log().clamp([1e-7,1e7]).domain([1e-7, 100])
		.domain([-100, 100])
        .range([this.options.margin.top, this.options.height+this.options.margin.top]);


    // setup axis
	this.xAxis = d3.svg.axis().scale(this.x).orient("top");
	this.vis
	 	.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate("+0+"," + this.options.margin.top + ")")
			.call(this.xAxis)
	// LABEL
		.append("text")
		  .attr("class", "label")
		  .attr("x", "20em") // y margin
		  .attr("y", "1em") // xmargin
		  .attr("dx", ".71em") // additional shift
		  .style("text-anchor", "start")
		  .text("Distance (m)");


	this.yAxis = d3.svg.axis().scale(this.y).orient("left");
	this.vis.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + this.options.margin.left + ","+0+")")
			.call(this.yAxis)
		.append("text")
		  .attr("class", "label")
		  .attr("transform", "rotate(-90)")
		  .attr("x", "-10em")
		  .attr("y", "1em")
		  .style("text-anchor", "end")
		  .text("Error (m)");

	this.series = this.vis.append("g")
		.attr("class","Paired series")
}
ErrorPlot.prototype.plot = function(x,y){
	var self = this

	var data = x.map((n,i)=>({
	    x:n,
	    y:y[i],
	    i:i
	}))
	this.data.push(data)

	var allData = _.flatten(this.data)
	var yMin = _.min(allData.map(r=>r.y))
	var yMax = _.max(allData.map(r=>r.y))
	var yMax2 = _.max([-yMin,yMax])

	// update y axis https://gist.github.com/phoebebright/3098488
	this.y.domain([-yMax2,yMax2])
    this.vis.select(".y.axis")
        .transition().duration(1500).ease("sin-in-out")  // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
        .call(this.yAxis);

	var i = this.series[0][0].children.length
	var series = this.series.append("g")
		.attr("id",`dots-${i}`)
		.attr("class",`dots dots-${i}`)
	this.series.selectAll(".dot")
		.data(data)
			.enter()
				.append("circle")
				.attr("class", "dot")
				.attr("r", 3.5)
				.attr("x", d=>self.x(d.x))
				.attr("y", d=>self.y(d.y))
				.attr("cx", d=>self.x(d.x))
				.attr("cy", d=>self.y(d.y))
				.attr("class",`q${i}-12`)
				// .style("fill", function(d) { return color(d.species); });

}
ErrorPlot.prototype.legend = function(x,y){


}
ErrorPlot.prototype.clear = function(x,y){
	this.vis.selectAll(".dot").clear()
	this.data=[]
}



//
// function errorPlot(x,y,id, options){
//
// 	options=_.defaultsDeep(options,{
// 		width: 2721/2, // must preserve aspect ratio
// 		height: 701/2,
// 		margin: {
// 			left:70,
// 			right:130
// 		}
// 	})
//
//     // format dc data and groups
// 	var data = x.map((n,i)=>({
// 	    x:n,
// 	    y:y[i],
// 	    i:i
// 	}))
// 	var ndx = crossfilter(data);
// 	var errorDim = ndx.dimension(d=>([d.x,d.y]))
// 	var errorGroup = errorDim.group()
//
//     // work out axis lengths
//     var xMax = _.max(data.map(r=>r.x))
//     var yMin = _.min(data.map(r=>r.y))
// 	var yMax = _.min(data.map(r=>r.y))
//     var yMax2=_.max([yMax,-yMin]) || 100
//
// 	// this is a HACK to render an empty graph when y values are null
// 	var symbolSize = yMin==undefined?0:8
//
// 	// http://dc-js.github.io/dc.js/examples/scatter.html
// 	errorChart = dc.scatterPlot(id);
// 	errorChart
// 	    .width(options.width+options.margin.left+options.margin.right)
// 	    .height(options.height/2)
// 	    .x(d3.scale.linear().domain([0, xMax]))
// 	    .y(d3.scale.linear().domain([-yMax2,yMax2]))
// 	    .brushOn(false)
// 	    .symbolSize(symbolSize)
// 	    .clipPadding(10)
// 	    .yAxisLabel("Error (m)")
// 	    .xAxisLabel("Length (m)")
// 	    .dimension(errorDim)
// 	    .group(errorGroup);
// 	errorChart.margins().left=options.margin.left
// 	errorChart.margins().right=options.margin.right
// 	errorChart.margins().top=0
//     errorChart.margins().bottom=0
//
// 	errorChart.render();
// }
