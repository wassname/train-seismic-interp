// list of horizons by length
// var horizons_whitelist = ['H089-UC', 'Fault1', 'H042', 'H033', 'Fault2', 'H046', 'H038', 'H039', 'H045', 'H064', 'H047', 'H037', 'H048', 'H053', 'H050', 'H051', 'H052', 'H044', 'H034', 'H032', 'H049', 'H065', 'H068', 'H069', 'H070', 'Fault3', 'H029', 'H035', 'H031', 'H036', 'H030', 'H040', 'H077', 'H027', 'H072', 'H078', 'H079', 'H003', 'H028', 'H088_Top_Salt', 'H025', 'H021', 'H061', 'H023', 'H022', 'H080', 'H062', 'H024', 'H013', 'H020', 'H019', 'H017', 'H054', 'H056', 'H015', 'H057', 'H016', 'H018', 'H055', 'H176', 'H059', 'H058', 'H060', 'H175', 'H014', 'H012', 'H026', 'H071', 'H011', 'H063', 'H073', 'H067', 'H081', 'H174', 'H066', 'H182', 'H007', 'H183', 'H082', 'H074', 'H008', 'H173', 'H009', 'H010', 'H181', 'H172', 'H083', 'H184', 'H180', 'H075', 'H084', 'H179', 'H171', 'H005', 'H076', 'H185', 'H159', 'H170', 'H186', 'H169', 'H160-UC', 'H157', 'H168', 'H158', 'H156', 'H085', 'H187', 'H041_levee', 'H006', 'H086', 'H188', 'H155', 'H087', 'H154', 'H153', 'H152', 'H189', 'H151', 'H177', 'H150', 'H043_channel', 'H162', 'H167', 'H004', 'H149', 'H148', 'H190', 'H178', 'H147', 'H139', 'H142', 'H161', 'H055-056_noAIp', 'H144', 'H143', 'H145', 'H140', 'H138', 'H166', 'H141', 'H163', 'H137', 'H146', 'H128', 'H136', 'H130', 'H134', 'H191', 'H135', 'H129', 'H165', 'H132', 'H133', 'H164', 'H121', 'H131', 'H124', 'H127', 'H125', 'H126', 'H123', 'H122', 'H119', 'H093', 'H120', 'H101', 'H102', 'H104', 'H103', 'H097', 'H092', 'H115', 'H107', 'H105', 'H118', 'H109', 'H094', 'H108', 'H112', 'H095', 'H106', 'H099', 'H113', 'H096', 'H116', 'H111', 'H098', 'H100', 'H110', 'H117', 'H091', 'H114', 'H090', 'H050-051_OIL', 'H002', 'H052-053_OIL', 'H001-wb', 'H048-049_OIL', 'H070-071_OIL']

/**
 * Interp one array onto another like scipys interp1d
 * @param  {Array} a - array of objects e.g. [{x:1,y:2},{x:2,y:1.5}]
 * @return {function}   - an interpolation function: yNew = f(xNew)
 */
function interp1d(a){
	var aSorted = _.sortBy(a, ar=>ar.x)
	aSorted = _.uniqBy(aSorted,ar=>ar.x)

	/** yNew = f(xNew) **/
	return function(xNew){
		return xNew.map(xn => {
			// find item before and after
			var i = _.sortedIndexBy(aSorted, {x:xn}, a=>a.x)
			i = _.clamp(i,1,aSorted.length-1)
			var a0 = aSorted[i-1]
			var a1 = aSorted[i]
			// work out where xn fits between a0 and a1 as a fraction
			var xnFrac = (xn-a0.x)/(a1.x-a0.x)
			return d3.interpolateNumber(a0.y,a1.y)(xnFrac)
		})
	}
}
// TODO test
var interp1dTestInput = [{"x":864.6820640353673,"y":1978.4236804564907}, {"x":864.6820640353673,"y":1978.4236804564907},{"x":3238.809413832805,"y":1598.965763195435},{"x":6562.587436618545,"y":2118.2239657631953},{"x":6562.587436618545,"y":2118.2239657631953},{"x":9586.475712987527,"y":1239.4793152639086}]
var result = interp1d(interp1dTestInput)([-1,100,3333,90000])
var idealResult = [2116.786061504474, 2100.6431828814566, 1613.6807153181974, -22128.763105338083]
console.assert(_.isEqual(result, idealResult),'interp1d should work for predefined inputs')


var dataPath = 'data/Marmousi2';
d3.json(dataPath+'/metadata.json', function(error, metadata){
	if (error) console.error(error)
	d3.json(dataPath+'/'+metadata.horizons, function(error, horizons){
		if (error) console.error(error)



	// TODO legend, well labels, show joints,

	var errorChart
	var seismicPlot
	var filtered_horizons = _.filter(horizons,horizon=>['H037'].includes(horizon.name))

	$(document).ready(function () {
		seismicPlot = new SeismicPlot({
			model: dataPath+'/'+metadata.model,
			seismic: dataPath+'/'+metadata.seismic,
			horizons: filtered_horizons,
			onmousedown: (obj)=>{
				document.querySelectorAll('#interp')[0].innerText = JSON.stringify(seismicPlot.interp, '\n')
			}
		})
		seismicPlot.init()
		seismicPlot.showWells(5)

	    d3.select('#undo').on('click', ()=>seismicPlot.undo())
	    d3.select('#reset').on('click', ()=>seismicPlot.reset())
	    d3.select('#toggleModel').on('click', ()=>seismicPlot.toggleModel())
		d3.select('#Finish').on('click', ()=>{
			var errors=seismicPlot.finish()
			var meanError = _.mean(_.flatten(errors.map(r=>r.y)))
			var formatter = d3.format('.2f')
			document.querySelectorAll('#score')[0].innerText = ''+formatter(meanError)
			errors.map(r=>errorPlot.plot(r.x,r.y,r.name))
		})

		// make empty error plot
		var x = _.flatten(_.values(seismicPlot.options.horizons[0].data)).reverse().map(r=>r.x)
		var errorPlot = new ErrorPlot('#interp-error-chart',seismicPlot.options)
		errorPlot.init()


	})


})})
