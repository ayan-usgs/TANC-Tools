function agemixtool() {

var calculations = {}
calculations.age = []
calculations.corrections = false

var flowLnColor      = '#afd8f8'
var screenColor      = '#b92' // #a81
var poisonColor      = '#900'
var poisonColorLight = '#900'
var contamColor      = screenColor //'#050'
var yearColor        = '#509'
var yearColorLight   = '#db3'
var green            = '#060'
var contribColor     = '#eee'
var contribColorDark = '#ddd'

var waitForPlot      =  250
var waitForTriggers  =  500
var waitForDomUpdate = 1500
var errorDuration    = 3500
var infoDuration     = 5000

//var timeBins = ['month','year','decade','century']

function round(val) {
	return Math.round(val*100)/100
}
function degradation(age, delta, rate) {
	return Math.exp(-rate*(age+(delta/2)))
}

function calcContaminant(yStart, yMax, yDec, yStop, traceData, rate) {

	var waterTable = []
	var wellScreen = []
	var selectedYr = []
	var selectedYrDash= []
    calculations.contaminant = [
        {data:waterTable,color:poisonColor,label:'Water&nbsp;Table&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',hoverable: false,draggable:false},
        {data:wellScreen,color:contamColor,label:'Well&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',hoverable: false,draggable:false},
        {data:selectedYr,color:yearColor,points:{show:true},hoverable:true,draggablex:true},
        {data:selectedYrDash, lines: {show:false}, label:'Selected Year', dashes: { show: true, dashLength:4, color:yearColorLight}}
    ]
    
	calculations.degradeRate          = rate
    calculations.startYearContaminate = yStart
    calculations.stopYearContaminate  = yStop
    calculations.yrPoisonEnterWell    = yStart + calculations.youngAge
	calculations.minYearContaminatePlt= Math.floor(yStart - calculations.oldAge * 0.1)
    calculations.maxYearContaminatePlt= Math.ceil( yStop  + calculations.oldAge ) +10
    calculations.maxYearContaminate   = yStop  + calculations.oldAge 
	
    // run until we get positive concentrations and end when concentrations fall back to zero
    var year      = calculations.minYearContaminatePlt
    var maxYear   = calculations.maxYearContaminatePlt
    var yrDelta   = calculations.yrDelta
	var incDelta  = 1.0 / (yMax-yStart+0.0001) // prevent divide by zero
	var decDelta  = 1.0 / (yStop-yDec+0.0001)  // prevent divide by zero
	
	while (year < maxYear) {
		var yearConcentration = 0

		for (var d=0; d<traceData.length; d++) {
			var dyear = traceData[d][0] 
			var contribution = traceData[d][1]
			var layerYear = year - dyear 
			if (layerYear >= yStart  &&  layerYear <= yStop) {
                var poison  = 0
		        if (layerYear >= yStart && layerYear < yDec) {
		            poison = 1
		            if (layerYear < yMax) {
		                poison = 1 - incDelta * Math.abs(layerYear - yMax)
		            }
		        }
		        if (layerYear > yDec && layerYear < yStop) {
		            poison = decDelta * Math.abs(yStop - layerYear)
		        }
		        var degrade = degradation(dyear, yrDelta, rate)
				yearConcentration += contribution * poison * degrade
			}
		}
		wellScreen.push([round(year),round(yearConcentration*100)])
        year += yrDelta
	}
		
	
	// water table data
	waterTable.push([yStart-10,0])
	linearPercentFill(waterTable,yStart,yMax, 0, 100)
	linearPercentFill(waterTable,yMax,yDec, 100, 100)
	linearPercentFill(waterTable,yDec,yStop, 100, 0)

 	waterTable.push([yStop, 0])
 	waterTable.push([year,  0])
	
	selectedYr.push([calculations.yrPoisonEnterWell, 0])
	selectedYrDash.push([calculations.yrPoisonEnterWell, 0])
	selectedYrDash.push([calculations.yrPoisonEnterWell, 0]) // yes, twice. it's a placeholder
}

function linearPercentFill(array, yMin, yMax, pStart, pEnd) {
    var fill = 99
	var y  = yMin
	var dy = (yMax-yMin)/fill
	if (dy === 0) {
		array.push([y, pStart])
	} else {
		dp = (pEnd-pStart)/fill
		var percent = pStart
		for (var c=0; c<=fill;c++) {
			array.push([y, percent])
			y+=dy
			percent+=dp
		}
	}
}

function calcFlowLines(Z,X,r,n,minS,maxS) {
	var traces = []
	var minZi  = 999999
	var maxZi  = -1
	var year   = 0
	calculations.traces = traces
	for (var xix=0.03; xix<=1; xix+=0.05) {
		var trace = {data:[], color:flowLnColor, shadowSize:0, lines:{lineWidth:2}}
		var Xi    = xix*X
		var xi    = 0
		year      = 0
		var finalValue = true
		while (xi>=0) {
			var zi = -Z*(Math.exp((-year*r)/(n*Z))-1)
			var xi = Xi-(zi*(X-Xi))/(Z-zi)
			if (xi>=0 || finalValue) {
				trace.data.push([-xi,-zi])
				finalValue = xi>=0
			}
			// prepare for recharge
			if (zi>=minS && zi<=maxS) {
				minZi = (zi < minZi) ? zi : minZi
				maxZi = (zi > maxZi) ? zi : maxZi
			}
			year++
		}
		if (trace.data.length>0) {
			traces.push(trace)
		}
	}
	calculations.traces[0].label = "GW Flow Lines"
}


function depthForYear(year) {
    var age   = year - calculations.startYearContaminate
    var c     = calculations
    var depth = -depthForAge(c.Z, c.r, c.n, age)
    return depth
}
function depthForAge(Z,r,n,age) {
    var depth = -Z*(Math.exp((-age*r)/(n*Z))-1)
    return depth
}
function ageForDepth(Z,r,n,depth) {
    var age = -n*Z*Math.log(1-depth/Z)/r
    return age
}
function yrDeltaForAgeSpan(yrSpan) {
    var yrDelta = 1
    if (yrSpan <= 5) {
        yrDelta = 1/365
    } else if (yrSpan <= 200) {
        yrDelta = 1/12
    } else if (yrSpan <= 2400) {
        yrDelta = 1
    } else if (yrSpan <= 24000) {
        yrDelta = 10
    } else {
        yrDelta = 100
    } 
    return yrDelta
}
function calcAquiferAgeProfile(Z,r,n,minS,maxS) {
    calculations.Z = Z
    calculations.r = r
    calculations.n = n

	// age, incremental, and cumulative
	//If zi2 and zi1 are both between Ztop and Zbottom then (zi2-zi1)/(ziMax-ziMin)
	var meanAge = Z * n / r
	calculations.aquiferMeanAge = round(meanAge)
	var title   = "Aquifer&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
	
    var aquiferAge = [[0,0]]
	
    calculations.age[0]= {data:aquiferAge, color:flowLnColor, label:title, shadowSize:0}

	var yrDelta   = 1
	var yrAqDelta = 1
	try {
        var yrAqMax = ageForDepth(Z,r,n,Z-0.01)
        var yrMax   = ageForDepth(Z,r,n,Math.min(maxS,Z-0.01))
        var yrMin   = ageForDepth(Z,r,n,minS)
        var yrSpan  = yrMax-yrMin
        yrDelta     = yrDeltaForAgeSpan(yrSpan)
        yrAqDelta   = yrDeltaForAgeSpan(yrAqMax)
	} catch(e) {}
	calculations.yrDelta = yrDelta
	
	var zi = 0;
	var year = yrDelta/2;
	while (Z-zi>=0.1*yrAqDelta && aquiferAge.length<=10000) { 
	    zi = depthForAge(Z,r,n,year)
		aquiferAge.push([round(year),-zi])
		year += yrAqDelta
	}
	calculations.aquiferMaxYear = year
}
function calcWellProfiles(Z,X,r,n,minS,maxS) {
	// age, incremental, and cumulative
	//If zi2 and zi1 are both between Ztop and Zbottom then (zi2-zi1)/(ziMax-ziMin)
	var incDataPlot  = []
	var incDataRaw   = []
	var sumData      = []
	var wellAge      = []

    calculations.incremental = [{data:incDataPlot, color:screenColor, dataRaw:incDataRaw}]
    calculations.cumulative  = [{data:sumData, color:screenColor}]
    calculations.age[1]      = {data:wellAge,label:"Well" ,color:screenColor, shadowSize:0}

	// well average age
	var fractionMinS = (Z-minS)/Z
	var fractionMaxS = (Z-maxS)/Z
	var logMaxS      = 0;
	if (fractionMaxS !== 0) {
		logMaxS      = Math.log(fractionMaxS)
	}
	
    minS+=0.001 // prevnet NaN
    var deltaZi               = maxS - minS
	var wellMeanAge           = calculations.aquiferMeanAge * Z/deltaZi 
	                          * ( fractionMaxS*logMaxS-fractionMaxS - fractionMinS*Math.log(fractionMinS)+fractionMinS)
    calculations.wellMeanAge  = round(wellMeanAge)
    calculations.youngAge     = Math.abs( round( ageForDepth(Z,r,n,minS) ) )
    calculations.displayOldAge= Math.abs( round( ageForDepth(Z,r,n,maxS) ) )

    calculations.wellDepth    = maxS*1.1
    calculations.wellDepthAge = Math.abs( round( ageForDepth(Z,r,n,calculations.wellDepth) ) )
    if (calculations.wellDepth >= Z) {
    	calculations.wellDepth = Z
		calculations.wellDepthAge= calculations.aquiferMaxYear
    }

    var cumulative = 0
    var oldAge     = 0
    var extraYr    = 0
    var agePlus    = false
    var yrMax      = calculations.aquiferMaxYear
	var yrDelta    = calculations.yrDelta
    var yr         = yrDelta/2
    
	while (extraYr<10 && yr<=yrMax) {
        var zi1 = depthForAge(Z,r,n,yr)
        var zi2 = depthForAge(Z,r,n,yr+yrDelta)
		
		if (zi2>=minS && zi1<=maxS) {
		 
            if ( (wellAge.length===0 && yr!==0 || zi1===0) 
              || (Math.floor(yr) > wellAge[wellAge.length-1][0]) ) { 
                wellAge.push([yr,-zi1])
		    }
			if (zi1<minS && zi2>minS) {
				zi1=minS
			}
			if (zi2>maxS && zi1<maxS) {
				zi2=maxS
			}		    
            var inc  = (zi2-zi1)/deltaZi
		    incDataPlot.push([yr,inc * 100 / yrDelta])
		    incDataRaw.push([yr,inc])
		    cumulative += inc
			
            if (inc !== 0) {
                oldAge = round(yr+yrDelta)
            }
            agePlus     = true
			
		} else {
			if (incDataRaw.length>0) {
				extraYr += yrDelta
			}
			if (agePlus  &&  wellAge.length!==0) {
				agePlus = false;
				wellAge.push([yr,-zi1])
            }
	        incDataPlot.push([yr,0])
		}
		
		sumData.push([yr,cumulative * 100])
		yr += yrDelta
	}

    calculations.oldAge = oldAge
}

function validateFields() {
	
	calculations.corrections = false
	
	var Zm    = validateMinMax('#aquifer',       1, 10000)
	var Zbot  = validateMinMax('#screen-bottom', 1, Zm)
	var Ztop  = validateMinMax('#screen-top',    0, Zbot-1)
	var Xm    = validateMinMax('#field-length',  1, 10000)
	var xm    = validateMinMax('#well-location', 0, Xm)
	var r
	if ( $('#units').val() === "m" ) {
		r = validateMinMax('#recharge-rate', 0.001, 1.5)
	} else {
		r = validateMinMax('#recharge-rate', 0.001, 5)
	}
	var n     = validateMinMax('#porosity',      0.001, 1)
	var yStart= validateMinMax('#start-year',    1850, 2100)
    var yMax  = validateMinMax('#max-year',    yStart, 2100)
    var yDec  = validateMinMax('#decline-year',  yMax, 2100)
	var yEnd  = validateMinMax('#stop-year',     yDec, 2100)
	
	if (calculations.corrections) {
		$('.validation-error')
		.fadeTo(100,0.01)
		.html("Parameters outside<br>working ranges have<br>been adjusted.")
		.fadeTo(500,1)
		window.setTimeout(function(){
			$('.validation-error').fadeTo(1000,0.01,function(){
				$('.validation-error').html("<br><br><br>")
			})
			$('li.agemix-field').animate({color: "black"},1000)
			$('div.oldValue').fadeTo(1000,0.01,function(){
				$('div.oldValue').html('')
			})
		}, errorDuration)
	}
}
function validateMinMax(input, min, max) {
	var inval = $(input).val()
	var val   = isNumber(inval) ? Number(inval) : Math.round((min+max)/2)
	var original = val

	if (val <= min) val = min
	if (val >= max) val = max
	$(input).val(val)
	
	if (val !== original) {
	   calculations.corrections = true
	}
	if (val !== original) {
		var label = $(input).parent().parent()
		presentOriginalValue(input,original)
		blinkBetweenCurrentColor(label, 'red', 3, 500)
	}
	
	return val
}
function presentOriginalValue(input,original) {
	$(input).parent().parent().find('div.oldValue').html(original)
}


function blinkBetweenCurrentColor(element,newColor,count,speed) {
	var speed = !isDefined(speed) ? 500 : speed
	var oldColor = $(element).css('color')
	var oldValue = $(element).find('div.oldValue')
	var queue = []
	var c
	for (c=1; c<=count; c++) {
		queue.push(function(){
			$(element).animate({color: newColor},speed)
			$(oldValue).fadeTo(speed,1)
			$(element).dequeue()
		})
		if (c != count) {
			queue.push(function(){
				$(element).animate({color: oldColor},speed)
				$(oldValue).fadeTo(speed,0.01)
				$(element).dequeue()
			})
		}
	}
	$(element).queue('fx',queue);
}

function doContaminate(traces) {
    var yStart= Number( $('#start-year').val() )
    var yMax  = Number( $('#max-year').val() )
    var yDec  = Number( $('#decline-year').val() )
	var yStop = Number( $('#stop-year').val() )
	var rate  = Number( $('#degrade-rate').val() )
	
	calcContaminant(yStart, yMax, yDec, yStop, traces, rate)
	plotContaminate()
	doDistributionPercent()
	doDistibutionPlot() 
}
function plotContaminate() {
	var data = calculations

	var options = {
		lines : { show: true},
		points: { show: false },
		yaxes : [{ticks:10,max:102,min:0}],
		grid  : {hoverable: true }
	}
	var plot = $("#contaminant-plot")
	calculations.contaminantTrendPlot = $.plot(plot, data.contaminant, options)
	
	$('#contaminant-plot div.legend div').first().remove()
}
function plotAquifer(Zm,Xm) {
	var data = calculations
	
	var options = {
		lines : { show: true },
		points: { show: false },
		xaxes : [{max:0,min:-Xm,ticks:5,tickLength:5}],
		yaxes : [{max:0,min:-Zm,ticks:10,color:'#ccc'}]
	}
	
	var flowPlot = $("#age-flow-plot")
	$.plot(flowPlot, data.traces, options)
	
	window.setTimeout(placeDecorations, waitForPlot)
}

function plotAgeGraphs(Zm,Xm,xm,Ztop,Zbot) {
	var data  = calculations
    data.Zm   = Zm
    data.Xm   = Xm
    data.Ztop = Ztop
    data.Zbot = Zbot
	
	
	var tix = calculations.aquiferMaxYear<1100 ?10 :7

	options = {
		xaxes : [{min:0,ticks:tix}],
		yaxes : [{max:0,min:-Zm,ticks:10}]
	}	
	
	var ageplot = $("#age-depth-plot")
	$.plot(ageplot, data.age, options)

	tix = calculations.oldAge<1100 ?10 :7
	options = {
		xaxes : [{ticks:tix}],
		legend: {show:false}
	}	
	var incrementplot = $("#gw-increment-plot")
	$.plot(incrementplot, data.incremental, options)

	options = {
		xaxes : [{ticks:tix}],
		yaxes : [{min:0,max:102}],
		legend: {show:false}
	}	
	
	var cumulativeplot = $("#gw-cumulative-plot")
	$.plot(cumulativeplot, data.cumulative, options)
		
	options = {
		lines : { show: true },
		xaxes : [{max:0,min:-Xm,ticks:5,tickLength:5}],
		yaxes : [{max:0,min:-Zm,ticks:10,color:'#999'}],
		grid  : { hoverable: true }
	}	
	
	var screendata = {
		data  : [[-xm,-Ztop],[-xm,-Zbot]],
		lines : {lineWidth:5}, 
		points: { show: true },
		color : screenColor,
		label : "Well Screen  &nbsp;&nbsp;",
		draggabley : true
	}
	
    var wellplot = $("#age-well-plot")
    $.plot(wellplot, [screendata], options)
    $("#age-well-plot div.tickLabels div.yAxis").attr('style','color:#555')
    $('#age-well-plot div.legend table').css({width:394}) // Firefox
    
    doPlotPoisonWell(Xm,Ztop,Zbot)
    
	// remove conflicting zero
	var agePlotX1Axis = $("#age-depth-plot div.tickLabels div.y1Axis div.tickLabel")
	removeMinusSign(agePlotX1Axis)
	
	// remove conflicting zero
	var wellPlotX1Axis = $("#age-well-plot div.tickLabels div.x1Axis div.tickLabel")
	var lastLabel = wellPlotX1Axis.length-1
	$(wellPlotX1Axis[lastLabel]).html("")
	// remove the negative which is a cause of the plot direction
	removeMinusSign(wellPlotX1Axis)
	// remove the negative which is a cause of the plot direction
	var wellPlotY1Axis = $("#age-well-plot div.tickLabels div.y1Axis div.tickLabel")
	removeMinusSign(wellPlotY1Axis)

	updateDataTable(data,Zm,Ztop,Zbot)
	
	window.setTimeout(placeDecorations, waitForPlot)
}
function updateDataTable(data,Zm,Ztop,Zbot) {
    $("#mean-aq-age").text(data.aquiferMeanAge);
    $("#age-mean").text(data.wellMeanAge);
    $("#age-young").text(data.youngAge);
    $("#age-old").text(data.displayOldAge<9999 ?data.displayOldAge :'Infinity');
    $("#age-span").text( data.displayOldAge<9999 ?round(data.displayOldAge - data.youngAge) :'Infinity');
	var pemUpper = round(Zm/(Zm-Ztop)-1)
	$('#pem-upper').html(pemUpper)
	var pemLower = round(Zm/(Zm-Zbot)-1)
	$('#pem-lower').html(pemLower<=9999 ? pemLower : 'Infinity')
}

function removeMinusSign(axis) {
	$(axis).each( function() {
		var label = $(this).html()
		label = label.replace('-','')
		$(this).html(label)
	})
}

function doPlotPoisonWell(Xm, Ztop, Zbot) {
    var options = {
        lines : { show: true },
        points: { show: false },
        xaxes : [{max:0,min:-Xm,ticks:5,tickLength:5,show:false}],
        yaxes : [{max:0,min:-getZmDepth(),ticks:10,color:'#999'}],
        legend: {show:false}
    }

    var xx = -Xm/2
    var screendata = {
        data:[[xx,-Ztop],[xx,-Zbot]],
        lines:{lineWidth:5}, 
        points: { show: false },
        color : screenColor,
        label: "Well Screen",
        shadowSize:0,
        draggabley:false
    }
    var welldata = {
        data:[[xx-150,0],[xx-150,-Zbot], [xx+150,-Zbot],[xx+150,0]],
        shadowSize:0,
        color:'black'
    }


    var distribution = $("#contaminant-depth-well")
    $.plot(distribution, [welldata,screendata], options)
    $("#contaminant-depth-well div.tickLabels div.yAxis").attr('style','color:#555')
    
    // remove the negative which is a cause of the plot direction
    var distWellY1Axis = $("#contaminant-depth-well div.tickLabels div.y1Axis div.tickLabel")
    removeMinusSign(distWellY1Axis)
}

function doPlotPoisonZone(bottom, thickness) {
    var dZone = $("#contaminant-depth-zone")

	var Zm = getZmDepth()

	var options = {
      	legend:{ show: false},
        grid:{borderWidth: 0},
        xaxis: { show: false, max: 2000, min:0},
        yaxis: { show: false, min:  -Zm, max:0},
        lines: { show: false},
        bars:  { show: true,   barWidth: thickness, // barWidth is top of contaminant zone
       			horizontal:true,lineWidth:0},
    }
	// this is bottom of contaminant zone
	var data = [ { color:poisonColorLight, data: [[2000,bottom]] }]

    $.plot(dZone,data,options);
}

function reDomLegendBecauseIEcannotMoveThemWithCss(plot) {
	if ( ! $.browser.msie) return
		
	// revisit when we have more time
//	var legend = $(plot + '  div.legend').html()
//	legend = legend.replace(/<\/?tbody>/g,'')
//	legend = legend.replace(/table([> ])/g,'ul id="legendary"$1')
//	legend = legend.replace(/tr([> ])/g,'li$1')
//	legend = legend.replace(/td([> ])/g,'span$1')
//	$(plot + '  div.legend').html(legend)
}


function makeDashedLegend(yrLegend) {
	var DIV = $(yrLegend).find("div")[0]
	$(DIV).css('width','20px')
	var div = $(yrLegend).find("div")[1]
	var style = $(div).attr('style').replace('width: 4px','width: 4px !important')
	$(div).attr('style',style)
	$(div).css('float','left')
	
	var divWhite = $(div).clone()
	$(divWhite).css('background-color','white')
	$(DIV).append(divWhite)
	
	var divDash = $(div).clone()
	$(DIV).append($(divDash).clone())
	      .append($(divWhite).clone())
	      .append($(divDash).clone())
}

function isPrintPage() {
	return window.location.href.indexOf("gamactt") !== -1
		|| window.location.href.indexOf("agemixtool") !== -1
}
function addCss(href) {
	$('<link>',{
		href:href,
		rel :"stylesheet",
		type:"text/css"
	}).appendTo('head')
}
function addPrintPageCss(href) {
    if ( isPrintPage() ) {
		addCss(href)
    }
}
function placeDecorations() {

	// remove zero
	$($("div#age-depth-plot div.tickLabels div.x1Axis div.tickLabel")[0]).html("")
	
//    addPrintPageCss("css/ageMixTool-print.css")
	if ($.browser.chrome) {
        // chrome is also mozilla so trap that first
	} else if ($.browser.msie) {
		addCss("css/ageMixTool-ie.css")
		addPrintPageCss("css/ageMixTool-ie-print.css")
    } else if ($.browser.mozilla) {
        // this is firefox
        addCss("css/ageMixTool-ff.css")
		addPrintPageCss("css/ageMixTool-ff-print.css")
    }
    
	
	if ($('#flowLines').length === 0) {
		var flowLegend = $($('#age-depth-plot .legend table tr')[0]).clone().attr('id','flowLines')
		$(flowLegend).find('.legendLabel').html("Flow Lines &nbsp;&nbsp;")
		$('#age-well-plot .legend table').prepend(flowLegend)
		
        var zoneLegend = $($('#age-depth-plot .legend table tr')[0]).clone().attr('id','contribZone')
        var innerDiv   = $(zoneLegend).find('.legendColorBox div div')
            .css('background-color',contribColorDark)
        var style      = $(innerDiv).attr('style')
        style = style.replace(/height\s*:\s*0px/, 'height:15px !important')            
        $(innerDiv).attr('style',style)
        $(zoneLegend).find('.legendLabel').html("Contributing Zone")
        $('#age-well-plot .legend table').append(zoneLegend)
	}
	
	placeContaminantLegend()
}	
function placeContaminantLegend() {	
	setTimeout(function() {
	    var legendEntries = 6
		// prevent duplicate runs if the user updates the plot data quickly
		if ( $('#contaminant-plot td.legendColorBox div').length <= legendEntries ) {
			$("td.legendColorBox div div").each(function(i,el) {
			    if ( $(el).parent().parent().parent().attr('id') !== 'contribZone' ) {
    		        var style = $(el).attr('style')
    		        var start = style.indexOf('solid') + legendEntries
    		        var end   = style.indexOf(';',start)
    		        style = style.substr(start, end-start)
    		        $(el).css('background-color', style)
    		    }
			});
			//reDomLegendBecauseIEcannotMoveThemWithCss("#contaminant-plot")
			//reDomLegendBecauseIEcannotMoveThemWithCss("#age-depth-plot")
			//reDomLegendBecauseIEcannotMoveThemWithCss("#age-flow-plot")
		
			var yrLegend = $('#contaminant-plot td.legendColorBox')[2]
			makeDashedLegend(yrLegend)
		}
	}, waitForDomUpdate)
}


var hasSelectedYear = false
function assignParams() {
    var hasParams = false
    
    if (window && window.location && window.location.href
       && window.location.href.indexOf("?") >0 ) {
        try {   
            var href   = window.location.href
            var params = href.substring(href.indexOf("?")+1, href.length).split("&")
            for (var p=0; p<params.length; p++) {
                var param = params[p].split('=')
                var id = param[0]
	            if ( $('#'+id).attr('type')=='checkbox' ) {
	                $('#'+id).attr('checked',param[1]==="true")
	            } else {
                    $('#'+id).val(param[1])
	            }
                if (param[0] === 'yearSelected') {
                    hasSelectedYear = true
                }
                hasParams = true
            }
        } catch (e) {
            console.log("failed to parse params")
        }
    }
    if (hasParams) {
        $(".footnote").hide()
        $(".printablePage").hide()
    }
}


function confineYearToData(year) {
    year = Math.min( Math.max(year,calculations.minYearContaminatePlt), calculations.maxYearContaminatePlt-Math.max(calculations.yrDelta,1) )
    return year
}

function updateYearIndicatorOnWellContaminant(year) {
        year   = confineYearToData(year)
    var newval = yearToWellContaminant(year)
	var calc   = calculations
	var plot   = calc.contaminantTrendPlot
/*
    // possible revised version however the listener gets messed up
	var oldData = calc.contaminant
	var newData = [oldData[0].data, oldData[1].data]
	
	// place the handle indication
	newData.push( [[year, newval]] )
	// place the dashed drop down to axis
	newData.push( [[year, 0], [year, newval-3]] )
	
    calc.contaminantTrendPlot.setData(newData)
*/
	// place the handle indication
	var sidx = 2
	var didx = 0
    var data   = calc.contaminant[sidx].data
    var series = plot.getData(sidx)[sidx]
    var points = series.datapoints.points;
    var ps     = series.datapoints.pointsize;
    data[0][0] = points[didx * ps    ] = year
    data[0][1] = points[didx * ps + 1] = newval

	// place the dashed drop down to axis
	sidx = 3
    didx = 0
    var data   = calc.contaminant[sidx].data
    var series = plot.getData(sidx)[sidx]
    var points = series.datapoints.points;
    var ps     = series.datapoints.pointsize;
    data[0][0] = points[didx * ps    ] = year
    data[0][1] = points[didx * ps + 1] = 0
	didx = 1
    data[1][0] = points[didx * ps    ] = year
    data[1][1] = points[didx * ps + 1] = newval-3
    
    plot.draw()
    return newval
}

function yearToWellContaminant(year) {
    // get concentration from wellScreen trend
    var trend = calculations.contaminant[1].data
    for (var y=0; y<trend.length; y++) {
        if ( trend[y][0]>=year ) return trend[y][1]
    }
}

function doDistributionPercent() {

    var year = parseFloat($('#yearSelected').val())
    year = confineYearToData(year)
	$('#yearSelected').val(year)

    // update indicator
    var value = updateYearIndicatorOnWellContaminant(year)
	
	if (value === undefined) value = 0
	
	// plot percent
	var data = [{
		data : [[Math.max(value, 0), 1]],
		color: yearColor,
        shadowSize:0,
		points: {show:true, fill:true, fillColor:yearColor}
	},{
		data : [[0, 1],[value-2.5, 1]],
		lines: {show:false},
        shadowSize:0,
		dashes: { show: true, dashLength:4, color:yearColorLight, }
	}]
	var options = {
		lines :{show: true, lineWidth:5, opacity:0.5},
		legend:{show:false},
    	xaxes :[{show:true,min:0,max:102,ticks:10}],
    	yaxes :[{show:false}]
	}
	$.plot('#contaminant-depth-percent', data, options)
	$('#contaminant-depth-percent div.tickLabels').remove()
}


function doDistibutionPlot() {
	var Zm = getZmDepth()
	var year 	 = parseFloat($('#yearSelected').val())

	var dataAtDepth=[]
	var contamData           = calculations.contaminant[0].data
    var startYearContaminate = calculations.startYearContaminate
    var stopYearContaminate  = calculations.stopYearContaminate
	var yrDelta              = calculations.yrDelta
	var degradeRate          = calculations.degradeRate
	
	// loop backwards because the application of contaminant flow down into the aquifer
	for (var v=contamData.length-1; v>0; v--) {
		var point  = contamData[v]
		var dataYr = year-(point[0]-startYearContaminate)
		var depth  = depthForYear(dataYr)
		if (depth<0) {
		   var percent= point[1]*degradation(dataYr-startYearContaminate, yrDelta, degradeRate)
    	   dataAtDepth.push([percent, depth])
		}
	}
	
	var data = [{data:dataAtDepth, color:poisonColor}]
	var options = {
		lines :{show: true, lineWidth:2},
		legend:{show:false},
    	xaxes :[{show:true,min:0,max:102,ticks:10}],
    	yaxes :[{show:false,min:-Zm, max:0}]
	}
	$.plot('#contaminant-depth-plot', data, options)	
	
    var initYear  = year
    var stopYear  = year-(stopYearContaminate-startYearContaminate)
    var initDepth = depthForYear(initYear)
    var stopDepth = depthForYear(stopYear)
	doPlotPoisonZone(stopDepth, initDepth-stopDepth)
	
	$('#contaminant-depth-year-labels #topDate').text(  Math.floor(year) )
	$('#contaminant-depth-year-labels #topDateP').text( Math.floor(stopYearContaminate) )
	$('#contaminant-depth-year-labels #botDateP').text( Math.floor(startYearContaminate) )

    var bottomLabelValue = ""
	if ( isZoomDepth() ) {
        var bottomYr = year - calculations.wellDepthAge
        var botYrLabel = ''
        if (bottomYr<0) {
            botYrLabel = ' (BCE)'
            bottomYr = Math.abs(bottomYr)
        }
        bottomLabelValue = Math.floor(bottomYr)+botYrLabel
    }
	$('#contaminant-depth-year-labels #botDate').text(bottomLabelValue)
	var textHeight = 18 // refine placement
	var height = $('#contaminant-depth-year-labels').height() - textHeight
	var Zm  = getZmDepth()
	var top = -(height * stopDepth / Zm) - textHeight
	var bot = -(height * initDepth / Zm) - textHeight*2
	
	// prevent start/stop year overlap when closer than 3px
	if (top-bot > 3) {
		top = bot+3
	}
	
	$('#contaminant-depth-year-labels #topDateP').css('top',top)
	$('#contaminant-depth-year-labels #botDateP').css('top',bot)
}
function isZoomDepth() {
	return $('#zoomToWellScreen').attr('checked')
}
function getZmDepth() {

    if ( isZoomDepth() ) {
    	return calculations.wellDepth
    }
    return calculations.Zm
}


// used to render flowlines png
function doFlowLines() {
	if (isDefined(calculations.traces)) return

	var Zm    = Number( $('#aquifer').val() )
	var Ztop  = Number( $('#screen-top').val() )
	var Zbot  = Number( $('#screen-bottom').val() )
	var Xm    = Number( $('#field-length').val() )
	var xm    = Number( $('#well-location').val() )
	var r     = Number( $('#recharge-rate').val() )
	var n     = Number( $('#porosity').val() )
//	calcFlowLines(Zm,Xm,r,n,Ztop,Zbot) // save time by not recalculating
	calcContributionZone(Zm, Xm, r, n, Ztop, Zbot, xm)
	plotContributionZone()
}

// on aquifer change
function doAquiferProfile() {
	var Xm    = Number( $('#field-length').val() )
	var Zm    = Number( $('#aquifer').val() )
    var Ztop  = Number( $('#screen-top').val() )
    var Zbot  = Number( $('#screen-bottom').val() )
	var r     = Number( $('#recharge-rate').val() )
	var n     = Number( $('#porosity').val() )
	calcAquiferAgeProfile(Zm,r,n,Ztop,Zbot)
}

// on aquifer or well change
function doWellProfile() {
	var Zm    = Number( $('#aquifer').val() )
	var Ztop  = Number( $('#screen-top').val() )
	var Zbot  = Number( $('#screen-bottom').val() )
	var xm    = Number( $('#well-location').val() )
	var Xm    = Number( $('#field-length').val() )
	var r     = Number( $('#recharge-rate').val() )
	var n     = Number( $('#porosity').val() )
	calcWellProfiles(Zm,Xm,r,n,Ztop,Zbot)
	doFlowLines()
	plotAgeGraphs(Zm,Xm,xm,Ztop,Zbot)
}

function updateYear(input,value) {

    var minValue = calculations.startYearContaminate
    var maxValue = calculations.maxYearContaminate

    if ( value===undefined || isNaN(value) || value < minValue ) {
        value = calculations.yrPoisonEnterWell;
    } else if ( value > maxValue ) {
        value = calculations.maxYearContaminate;
    }
    $(input).val(value).trigger('change')
}
function updateYearMod(input,mod) {
    var val = parseInt( $(input).val() )
	val += mod
	updateYear(input,val)
}
function updateYearInc(input) {
	updateYearMod(input,+1)
}
function updateYearDec(input) {
	updateYearMod(input,-1)
}


function plotContributionZone() {
	var img    = $('#age-flow-plot')
	var width  = $(img).width()
	var height = $(img).height()
	var parent = $(img).parent()
	var loc    = $('#age-flow-plot').position()
	
	$('#contrib-zone')
		.attr({width:width,height:height})
		.css({
			 position:'absolute',
		     top:loc.top+3,
		     left:loc.left+2,
		     height:height+1,
		     width:width
		})
				
	var ctx = $('#contrib-zone')[0].getContext('2d')		
	
	var X = calculations.zones.distRange
	var xFactor = width  / calculations.zones.distRange
	var yFactor = height / calculations.zones.depthRange
	
	ctx.fillStyle   = contribColor

	ctx.beginPath()
	var zone = calculations.zones[0]
	var x = (X-zone[0][0]) * xFactor
	var y = zone[0][1] * yFactor
	ctx.moveTo(x,y)
	
	for (var i=0; i<2; i++) {
		zone = calculations.zones[i]
		for (var p=0; p<zone.length; p++) {
		    // must flip the direction of iteration because 
			// a polygon fill/draw follows the path by order of insertion
			// values have been calculated in the same direction
			// we want to follow one set backward for a proper polygon
			var q = i ? zone.length-p-1 : p
			x = (X-zone[q][0]) * xFactor
			y = zone[q][1] * yFactor
			ctx.lineTo(x,y)
		}
	}

	ctx.fill()
}

function calcContributionZone(Z,X,r,n,minS,maxS,Xw) {
	maxS -= (maxS >= Z) ?0.1 :0
	var depths= [minS,maxS]
	var ages  = [ageForDepth(Z,r,n,minS),ageForDepth(Z,r,n,maxS)]
	var deltas= [yrDeltaForAgeSpan(ages[0]),calculations.yrDelta]
	var zones = {0:[[Xw,minS]],1:[[Xw,maxS]], depthRange:Z, distRange:X}
	calculations.zones = zones
	
	
	for (var i=0; i<2; i++) {
		var Zw    = depths[i]
		var ratio = Zw/(Z-Zw)
		var Xi    = (ratio*X + Xw) / (1+ratio)
		var age   = ages[i] - deltas[i]
		var zone  = zones[i]
		var zi    = Zw
		while (zi > 0) {
			zi = depthForAge(Z,r,n,age)
			var xi = Xi-(zi*(X-Xi))/(Z-zi)
			zone.push([xi,zi])
			age -= deltas[i]
		}
	}
}



//$('#mainbody').css('padding-left','2px')

// browser feature removed in newer jquery
if ($.browser.msie) {
	// render the div that this is not ideal in IE

    var bg = $('<div id="warnMsieBg"></div>')
    $(bg).addClass('warnMsie').appendTo("body")
	
    var dialog = $('<div id="warnMsieMsg"><h2>This page is best viewed in Chrome or FireFox.</h2><br><br></div>')
    $(dialog).addClass('warnMsie').appendTo("body")
    
    $('<input type="button" value="Okay" onclick="hideWarnMsie()">')
    .addClass('warnMsie').appendTo(dialog)
}


$('.plotButton').click(function() {
    if ($('.validation-error').text().length) return
    
    $('.validation-error').css('color',green)
        .html("You may interact with<br>the open circles on the graphs.<br><br>")
        .fadeTo(500,1)
    
    window.setTimeout(function(){
        $('.validation-error').fadeTo(1000,0.01,function(){
            $('.validation-error').html("<br><br><br>").css('color','red')
        })
    }, infoDuration)
})

$(".printablePage").click(function(e){
    e.preventDefault();
    var href = $(".printablePage").attr("href") +"?"
    var sep  = ""
    $('div.ageMixArea input').each( function(e) {
        href += sep
        var id = $(this).attr("id")  
        href += id + "="
        if ( $('#'+id).attr('type')=='checkbox' ) {
            href += $(this).attr('checked')
        } else {
            href += $(this).val()
        }
        sep = "&"
    })
    window.location = href
    return false
})

assignParams()

$('#units').change(function(e){
	$('.units').each(function(index,element){
		$(element).html( $('#units').val() )
	})
})
$("#age-well-plot").bind("plotFinalSeriesChange", function (event, seriesIndex, dataIndex, x, y) {
	y = round(y)

	if (dataIndex === 0) {
		$('#screen-top').val(-y)
	}
	if (dataIndex === 1) {
		$('#screen-bottom').val(-y)
	}
	$($('.screen input')[0]).trigger('change')
});
$('.aquifer input').change( function(){
	$($('.screen input')[0]).trigger('change')
})
$('.screen  input').change( function() {
	validateFields()
	
    doAquiferProfile() // because we need to recalce yrDelta - this could be optimized when we have more time
	doWellProfile()
	//cascade change event
	$($('.poison input')[0]).trigger('change')
})
$('.poison  input').change( function() {
	validateFields()
	doContaminate(calculations.incremental[0].dataRaw)
	placeContaminantLegend()
})

$('#yearSelected').change(function(){
	validateFields() // TODO validate the year
	doDistributionPercent()
	doDistibutionPlot()
})

$("#contaminant-plot").bind("plotSeriesChange", function (event, sidx, didx, x, y) {
    updateYear('#yearSelected', round(x) )
})

// setup year dec/inc arrow events
$(['Left','Right']).each(function(i,direction){
	$(".arrow"+direction).hover(function(e){
			$(e.srcElement||e.target).attr('class', 'arrow arrowHover'+direction)
		},
		function(e){
			$(e.srcElement||e.target).attr('class', 'arrow arrowNormal'+direction)
		}
	).mousedown(function(e){
		$(e.srcElement||e.target).attr('class', 'arrow arrowPress'+direction)
	}).mouseup(function(e){
		$(e.srcElement||e.target).attr('class', 'arrow arrowHover'+direction)
	}).unbind('dblclick').dblclick(function(e){
	    e.stopPropagation();
	    e.stopImmediatePropagation();
	    e.preventDefault();
	    document.getSelection().removeAllRanges();
	    return false;
	})
})

$("#arrowYrDec").click( function(e) {
	updateYearDec('#yearSelected');	
	e.stopPropagation()
	document.getSelection().removeAllRanges();
})
$("#arrowYrInc").click( function(e) {
	updateYearInc('#yearSelected');	
	e.stopPropagation()
	document.getSelection().removeAllRanges();
})

$('#zoomToWellScreen').change(function() {
    //$('#yearSelected').trigger('change')
    doDistibutionPlot()
    var c = calculations
    doPlotPoisonWell(c.Xm,c.Ztop,c.Zbot)
})

setTimeout(function() {
	// init change event for first plot
	$($('.aquifer input')[0]).trigger('change')
	if (!hasSelectedYear) {
		updateYear('#yearSelected')
	}
}, waitForTriggers)



} // tool scope function

function hideWarnMsie() {
    $('.warnMsie').hide()
}

$().ready(function(){
	// this timeout is to prevent conflicts with ajax
	// a stand alone page would not require it
	setTimeout(agemixtool,200)
})
