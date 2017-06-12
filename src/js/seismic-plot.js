
/**
 * Class to display a seismic line and let a user interp on it
 */
function SeismicPlot(options) {

	this.options=_.defaultsDeep(options,{
		width: 2721/2, // must preserve aspect ratio
		height: 701/2,
		wellFractions: [0.1,0.9],
		extent:{
			xmin:0,
			xmax:17000,
			ymin:0,
			ymax:3500,
		},
		margin: {
			left:70,
			right:130,
			top:50,
			bottom:10
		},
		model: "data/MODEL_P-WAVE_VELOCITY_1.25m.png",
		seismic: 'data/SYNTHETIC.png',
        horizons: [],
        onmousedown: function(){}, // callback
	})

    this.interp = []
}
SeismicPlot.prototype.init = function (arguments) {

	var self = this;
	this.totalWidth = this.options.margin.left+this.options.width+this.options.margin.right
	this.totalHeight = this.options.margin.top+this.options.height+this.options.margin.bottom
    this.vis = d3.select("#svg").append("svg")
        .attr("width", this.totalWidth)
        .attr("height", this.totalHeight)
        .on("mousedown", function(){
            self.mousedown(this)
            return self.options.onmousedown(this)
        });

    this.active_interp = 0


	// this.formatter = d3.format('.2f')


    // create x and y transforms
    var {xmin, xmax, ymin, ymax} = this.options.extent
    this.x = d3.scale.linear()
        .domain([xmin, xmax])
        .range([this.options.margin.left, this.options.width+this.options.margin.left]);

    this.y = d3.scale.linear()
        .domain([ymin, ymax])
        .range([this.options.margin.top, this.options.height+this.options.margin.top]);


    // line function
    this.linef = d3.svg.line()
        .x(d => this.x(d.x))
        .y(d => this.y(d.y));

    // load images
    this.seismicImage = this.vis.append("image")
        .attr("xlink:href", this.options.seismic)
        .attr("id", 'image')
		.attr("x",this.options.margin.left)
		.attr("y",this.options.margin.top)
        .attr("width", this.options.width)
        .attr("height", this.options.height)
		.attr("preserveAspectRatio","xMinYMin meet");


    this.modelImage = this.vis.append("image")
        .attr("xlink:href", this.options.model)
        .attr("id", 'image')
		.attr("x",this.options.margin.left)
		.attr("y",this.options.margin.top)
        .attr("width", this.options.width)
        .attr("height", this.options.height)
        .attr("style", 'display:none')
		.attr("preserveAspectRatio","xMinYMin meet");

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
		  .text("Depth (m)");

    // add container groups
    this.wellsGroup = this.vis.append("g")
        .attr("id", `wells`)

    this.linesGroup = this.vis.append("g")
		.attr("id", `lines`)

    this.legendGroup = this.vis.append("g")
        .attr("id","legend")
        .attr("transform", "translate("+(self.options.margin.left+self.options.width)+","+(this.options.margin.top+70)+")"); // place legend

    // button, this should be done outside this class
    // d3.select('#undo').on('click', ()=>this.undo())
    // d3.select('#reset').on('click', ()=>this.reset())
    // d3.select('#toggleModel').on('click', ()=>this.toggleModel())
	// d3.select('#Finish').on('click', ()=>this.finish())

    this.legend()
}

SeismicPlot.prototype.legend =  function () {
    var data = _.concat(
        this.options.horizons.map((h,i)=>({
            text:'horizon '+h.name,
            class:`line interp q${i}-12`
        })),
        this.options.horizons.map((h,i)=>({
            text:'well top '+h.name,
            class:`line well-top q${i}-12`
        })),
        this.options.horizons.map((h,i)=>({
            text:'answer '+h.name,
            class:`line ideal-horizon q${i}-12`
        }))
    )

    // var width = 200 // this.options.width+this.options.margin.left
    var dh = 20 // height of each legend element
    var padding = 1
    var height = this.options.margin.top
    var legend = this.legendGroup.selectAll(".legend")
          .data(data)
        .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + i * dh + ")"; });

    // add white background
    legend.append("rect")
          .attr("x",  - dh)
          .attr("width", dh)
          .attr("height", dh)
          .style("fill", 'white');

    legend.append("path")
        // .attr("d", linef([{x:width,y:0},{x:width,y:10}]))
        .attr("d", d3.svg.line()([[-dh,dh/2],[0,dh/2]]))
        .attr("dy","0.5em")
        .attr("dx","0.5em")
        .attr("class", d=>d.class)

      legend.append("text")
          .attr("x", - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) { return d.text; });

}

SeismicPlot.prototype.updateLine =  function () {

        var i = this.active_interp

        // make sure each line has a class
        var path = this.vis.select(`#line-${i}`)
        if (!path.node()){
            path = this.linesGroup.append("path")
                .attr("class", `line interp q${i}-12`)
                .attr("id", `line-${i}`)
        }

        path
            .transition()
            .attr("d", this.linef(this.interp[i]));

        // this.interpBox.innerText = JSON.stringify(this.interp, '\n')
    }

SeismicPlot.prototype.mousedown = function(context) {
        var m = d3.mouse(context);
        if (!this.interp[this.active_interp]) this.interp[this.active_interp]=[]
        this.interp[this.active_interp].push({
            x: this.x.invert(m[0]),
            y: this.y.invert(m[1])
        })
        this.updateLine()
    }

SeismicPlot.prototype.undo = function() {
		this.interp[this.active_interp].pop()
		this.updateLine()
	}

SeismicPlot.prototype.reset = function() {
		this.interp = []
		this.updateLine()
	}

SeismicPlot.prototype.toggleModel = function(on) {
		if ((on!==undefined && on )|| (on===undefined && this.modelImage.attr("style") == 'display:none'))
			this.modelImage.attr("style", '')
		else
			this.modelImage.attr("style", 'display:none')

	}
SeismicPlot.prototype.finish = function(){
	// compare interp to ideal horizon, and show area between, turn on fill I guess

	// TODO make interp into an array of horizons
	var errors = this.interp.map((interp,i)=>{
        var horizon = this.options.horizons[i] // HACK just use first for now
        var ideal = _.flatten(_.values(horizon.data)).reverse()
        var data = _.concat(ideal,this.interp[i])

        // join your interp and the ideal to make a polygon, then display with fill
        var path = this.linesGroup.append("path")
            .attr("class", `line error q${i%11}-12`)
            .attr("id", `error-${i}`)
            .attr("d", this.linef(data));

        var yPred = interp1d(interp)(ideal.map(r=>r.x))
        var yTrue = ideal.map(r=>r.y)

        var yError = yTrue.map((n,i)=>yPred[i]-n)
        // TODO plot error, scatter plot and hist

        // bin length
        var xLength = yPred.map((a,i)=>{
            var yErr = Math.abs(a-yTrue[i])

            // half distance between left and right neigbours
            var i0= Math.max(i-1,0)
            var i1 = Math.min(i+1,yTrue.length-1)
            var xLength = Math.abs(ideal[i1].x-ideal[i0].x)/2

            return xLength
        })

        // weight error by bin
        var error = _.sum(xLength.map((xLen,i)=>{
            var yErr = yError[i]
            return yErr*xLen
        }))/_.sum(xLength)

        var xError = ideal.map(r=>r.x)
        return {x:xError,y:yError,name:horizon.name}
    })

	// this.scoreBox.innerText = ''+this.formatter(_(errors).mean())
	this.showHorizons() // show ideal
	$('#toggleModel').attr('disabled',false) // let us see model
	this.toggleModel(true)
    return errors
}

SeismicPlot.prototype.showWells = function(n){
	// show horizons at traces at 10 and 90%
	// TODO move traces to options
	var {xmin, xmax, ymin, ymax} = this.options.extent
	let traces = this.options.wellFractions.map(f=>(xmax-xmin)*f)

    // TODO add rotated text at well position

	// draw lines at each trace
	this.wells = traces.map((x0,i)=>{
        // group
        let wellGroup = this.wellsGroup.append("g").attr("class","well well-"+i)

        // well trace
		let well = wellGroup.append("line")
            .attr("class", "well-trace")
			.attr("x1", this.x(x0))  //<<== change your code here
			.attr("y1", this.y(ymin))
			.attr("x2", this.x(x0))  //<<== and here
			.attr("y2", this.y(ymax))
			.style("stroke-width", 2)
			.style("stroke", "red")
			.style("fill", "none");

        // label
        wellGroup
        		.append("text")
        		  .attr("class", "label")
        		  .attr("transform", "rotate(-90)")
                  .attr("x", -(this.y(ymin)+this.y(ymax))/2) // margin-top
        		  .attr("y", this.x(x0))
        		  .attr("dy", "-0.2em") // margin-left
        		  .style("text-anchor", "start")
        		  .text("Well "+i);

		// draw horizons near well
		let cutoff = (xmax-xmin)*0.02 // 5%

        this.options.horizons.map((horizon,j)=>{
			let data = _.flatten(_.values(horizon.data)) // join segments
			let segment = data.filter(d=>Math.abs(x0-d.x)<cutoff)

			// get the x and y location nearest the well
			// plot line
			var path = this.linesGroup.append("path")
			   .attr("class", `line well-top well-${i} top-${j} q${i%11}-12 `)
			   .attr("id", `well-${i}-top-${j}`)
			   .attr("d", this.linef(segment));

		   // add tooltip https://gist.github.com/ilyabo/1339996
		   title=path.append("svg:title")
                    .text("Well top: "+horizon.name)
		})
		})


}

/**
 * Show some horizons, n will limit it to n points in the first segment (as a interp prompt)
 * TODO make a fake well instead
 **/
SeismicPlot.prototype.showHorizons = function(n){
	if (n===undefined) n=1E5

    this.options.horizons.forEach((horizon,i)=>{
		var segments = Object.keys(horizon.data)
		if (n<1E5) segments=segments.slice(0,1)
		segments.forEach(segment=>{

			// plot line
			var path = this.linesGroup.append("path")
			   .attr("class", `line q${i%11}-12 ideal-horizon`)
			   .attr("id", `ideal-horizon-${i}`)
			   .attr("d", this.linef(horizon.data[segment].slice(0,n)));

		   // add tooltip https://gist.github.com/ilyabo/1339996
		   title=path.append("svg:title")
                .text(horizon.name)
		})
	})
}
