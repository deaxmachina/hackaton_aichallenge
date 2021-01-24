import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import _ from "lodash";
import chroma from "chroma-js";

import "./CityCircles.css"


const CityCircles = ({ 
  data, 
  meanEmissionsTotal, 
  meanEmissionsPerCapitaTotal, 
  city, 
  emissionsType,
  innerRadius,
  outerRadius,
  width,
  height

}) => {

  /// refs ///
  const svgRef = useRef();
  // for the line chart
  const gLineChartRef = useRef();
  const xAxisLineChartRef = useRef();
  const yAxisLineChartRef = useRef();
  // for the circle chart 
  const gCircleChartRef = useRef();
  const gOuterCircleRef = useRef();
  // for the tooltip
  const tooltipRef = useRef();

  /// states ///
  const [selectedEvent, setSelectedEvent] = useState(null);

  /// constatns ///
  // dimensions //
  /*
  // circle 
  const innerRadius = 90;
  const outerRadius = 200;
  // whole SVG
  const width = 430;
  const height = 430;
  */
  // line chart 
  const lineChartWidth = 2*innerRadius
  const lineChartHeight = 1*innerRadius 
  const lineChartMargin = {top:20, right: 0, bottom: 0, left: 0}

  // columns that we will use 
  const yearCol = "Reporting Period"
  const cityCol = "CityName"
  const populationCol = " Population "
  const emissionsPerCapitaCol = "GHG/Capita"
  const emissionsTotalCol = "Total emissions (metric tonnes CO2e)"
  const methodologyCol = "Methodology/Protocol"

  // colours //
  const darkColour = "#0A0A0A" //"#0b090a"
  const lightColour = "#f6f2e7"
  const emissionsColour = "#3e1f47"
  const lineColour = "#006466"


  // if by total emissions 
  // meanEmissionsSelectedCity
  // meanEmissionsTotal

  // if by per capita emissions 
  // meanEmissionsPerCapitaSelectedCity
  // meanEmissionsPerCapitaTotal


  /// D3 Code ///
  useEffect(() => {

  if (data && city) {

    ///// Data Computations ///
    /// Selected City ///
    // extract data for that city 
    let dataForSelectedCity = _.filter(data, element => element[cityCol] == city)
    dataForSelectedCity = _.uniqBy(dataForSelectedCity, element => element[yearCol]) // in case there are repeated cols
    // find the mean of the emissions across all years 
    const meanEmissionsSelectedCity = _.meanBy(dataForSelectedCity, element => element[emissionsTotalCol])
    // find the mean of the emissions per capita across all years 
    const meanEmissionsPerCapitaSelectedCity = _.meanBy(dataForSelectedCity, element => element[emissionsPerCapitaCol])

    // set the mean emissions based on whether we want them to be by total emissions 
    // or per capita 
    let meanEmissionsSelectedCityCurrent; 
    let meanEmissionsTotalCurrent; 
    if (emissionsType == "total emissions") {
      meanEmissionsSelectedCityCurrent = meanEmissionsSelectedCity;
      meanEmissionsTotalCurrent = meanEmissionsTotal
    } else if (emissionsType == "per capita emissions")  {
      meanEmissionsSelectedCityCurrent = meanEmissionsPerCapitaSelectedCity;
      meanEmissionsTotalCurrent = meanEmissionsPerCapitaTotal
    }

    console.log(meanEmissionsTotalCurrent)


    /// Graph space ///
    const svg = d3.select(svgRef.current)

    /////////////////////////////////////////////
    //////////////  FILTERS /////////////////////
    /////////////////////////////////////////////
    //Container for the gradients
    const defs = svg.append("defs")

    /// Gaussian ///
    // the standard deviation defined how blurry it gets 
    const gaussian  = defs
      .append("filter")
      .attr("id", "gaussian-blur")
      .append("feGaussianBlur")
      .attr("stdDeviation", 5); 

    /// Glow ///
    //Code taken from http://stackoverflow.com/questions/9630008/how-can-i-create-a-glow-around-a-rectangle-with-svg
    //Filter for the outside glow
    const glowFilter = defs.append("filter")
      .attr("id","glow")

    // change the std to make it more or less blurry 
    glowFilter.append("feGaussianBlur")
      .attr("class", "blur")
      .attr("stdDeviation", 6)
      .attr("result","coloredBlur");

    const feMerge = glowFilter.append("feMerge")
    feMerge.append("feMergeNode")
      .attr("in","coloredBlur")
    feMerge.append("feMergeNode")
      .attr("in","SourceGraphic")

    /// Static Noise ///
    const staticNoise = defs 
      .append("filter")
      .attr("id", "noise")

    staticNoise.append("feTurbulence")
      .attr("type", "fractalNoise")
      .attr("baseFrequency", 0.9)
      .attr("result", "noisy")

    staticNoise.append("feColorMatrix")
      .attr("type", "saturate")
      .attr("values", 0)

    staticNoise.append("feComposite")
      .attr("operator", "in")
      .attr("in2", "SourceGraphic")
      .attr("result", "monoNoise")

    staticNoise.append("feBlend")
      .attr("in", "SourceGraphic")
      .attr("in2", "monoNoise")
      .attr("mode", "multiply")


		/// Radial Gradients ///
		defs.append("radialGradient")
			.attr("id", "radial-gradient")
			.attr("cx", "50%")	//not really needed, since 50% is the default
			.attr("cy", "50%")	//not really needed, since 50% is the default
			.attr("r", "50%")	//not really needed, since 50% is the default
			.selectAll("stop")
				.data([
						{offset: "0%", color: "#006466" },
						{offset: "60%", color: "#065a60"},
						{offset: "100%", color:  "#212f45"},
					])
			.enter().append("stop")
			.attr("offset", function(d) { return d.offset; })
      .attr("stop-color", function(d) { return d.color; });

  
    /// Area Gradient /// 
    const areaGradient = svg.append("defs")
      .append("linearGradient")
      .attr("id","areaGradient")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    areaGradient.append("stop")
      .attr("offset", "0%")
      //.attr("stop-color", emissionsColour)
      .attr("stop-color", "#4d194d")
      .attr("stop-opacity", 0.6);
    areaGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", darkColour)
      .attr("stop-opacity", 0);
      

    

    /////////////////////////////////////////////
    //////////  Circle Chart  ///////////////////
    /////////////////////////////////////////////
    
    //////////  Chart Container /////////////////
    const gCircleChart = d3.select(gCircleChartRef.current)
      .attr("transform", `translate(${width/2}, ${height/2})`) // center of the graphing space 
    // for any transitions
    const t = d3.transition().duration(1000);

    //////////  Static Circle ///////////////////
    const staticCircle = gCircleChart
      .selectAll(".static-circle")
      .data([0])
      .join("circle")
      .classed("static-circle", true)
        .attr("fill", darkColour)
        //.attr("stroke", "#f5f3f4")
        .attr("stroke", darkColour)
        .attr("stroke-width", 2)
        .attr("r", innerRadius)


    //////////  Outer Circle ////////////////////

    /// Scale for the radius ///
    // the actual version will use the min and max across all cities 
    // to determine the scale 
    const radiusScale = d3.scaleSqrt()
      //.domain([0, meanEmissions])
      //.range([0, outerRadius])
      // from the min emissiosn for any city for any year 
      // to the max of the averages across all years for all cities 
      // note: need to add some const so that smallest city still has a radius 
      // if toal emissions 
      //.domain([d3.min(data, d => d[emissionsTotalCol]) - 1000000, meanEmissionsTotal])
      // if per capita 
      //.domain([d3.min(data, d => d[emissionsPerCapitaCol]), meanEmissionsPerCapitaTotal])
      // if using the selector
      .domain([d3.min(data, d => d[emissionsPerCapitaCol]), meanEmissionsTotalCurrent])
      .range([innerRadius, outerRadius])

  
    // group for the outer circle which contains 
    // two different circles as we need that for the filters
    const outerCircleG = d3.select(gOuterCircleRef.current)
    const arc = d3.arc()

    // Constant circle with just the max possible value 
    const outerCircleBlur = outerCircleG
      .selectAll(".outer-circle-max")
      .data([0])
      .join("circle")
      .classed("outer-circle-max", true)
        .style("fill", "none")
        .attr("stroke", "#1b3a4b")
        .attr("stroke-dasharray", "2,3")
        .attr("stroke-width", 2)
        .attr("filter", "url(#glow)")
        .attr("r", radiusScale(meanEmissionsTotalCurrent))



    /*
    const outerCircleBlur = outerCircleG
        .selectAll(".outer-circle-blur")
        .data([0])
        .join("path")
        .classed("outer-circle-blur", true)
          .style("fill", "url(#radial-gradient)")
          .attr("opacity", 1)
          .attr("filter", "url(#glow)")
          // this is the initial path which we need just for the transition effect
          .attr("d", d => arc({
            innerRadius: innerRadius,
            outerRadius: innerRadius,
            startAngle: 0,
            endAngle: 2*Math.PI 
          }))
          .transition(t)
            .attr("d", d => arc({
              innerRadius: innerRadius,
              // if by total emissions 
              //outerRadius: radiusScale(meanEmissionsSelectedCity),
              // if my emissions per capita 
              outerRadius: radiusScale(meanEmissionsPerCapitaSelectedCity),
              startAngle: 0,
              endAngle: 2*Math.PI 
            }))
      */
      

    const outerCircleNoise = outerCircleG
      .selectAll(".outer-circle-noise")
      .data([0])
      .join("path")
      .classed("outer-circle-noise", true)
        .style("fill", "url(#radial-gradient)")
        .attr("opacity", 1)
        .attr("filter", "url(#noise)")
        // this is the initial path which we need just for the transition effect
        .attr("d", d => arc({
          innerRadius: innerRadius,
          outerRadius: innerRadius,
          startAngle: 0,
          endAngle: 2*Math.PI 
        }))
        .transition(t)
        .attr("d", d => arc({
          innerRadius: innerRadius,
          // if by total emissions 
          //outerRadius: radiusScale(meanEmissionsSelectedCity),
          // if by emissions per capita 
          //outerRadius: radiusScale(meanEmissionsPerCapitaSelectedCity),
          // if using the selector
          outerRadius: radiusScale(meanEmissionsSelectedCityCurrent),
          startAngle: 0,
          endAngle: 2*Math.PI 
        }))

    ////////// Text in the middle /////////////////
    const textInStaticCircle = gCircleChart
      .selectAll(".text-for-avg-emissions-group")
      .data([0])
      .join("g")

    const textInStaticCircleMeanEmissions = textInStaticCircle
      .selectAll(".text-for-avg-emissions")
      .data([0])
      .join("text")
      .classed("text-for-avg-emissions", true)
        .attr("fill", lightColour)
        .text(d3.format(".2s")(meanEmissionsSelectedCity))
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("font-size", "1.5em")
        .attr("transform", `translate(${0}, ${-60})`)

    const textInStaticCircleMeanEmissionsTitle = textInStaticCircle
        .selectAll(".text-for-avg-emissions-title")
        .data([0])
        .join("text")
        .classed("text-for-avg-emissions-title", true)
          .attr("fill", lightColour)
          .text("average emissions / year")
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .attr("font-size", "0.5em")
          .attr("transform", `translate(${0}, ${-40})`)

    /*
    const textInStaticCircleTotalEmissions = textInStaticCircle
      .selectAll(".text-for-total-emissions")
      .data([0])
      .join("text")
      .classed("text-for-avg-emissions", true)
        .attr("fill", lightColour)
        .text(d3.format(".2s")(totalEmissions))
    */



    /////////////////////////////////////////////
    ///////////  Line Chart  ////////////////////
    /////////////////////////////////////////////

    //////////  Chart Container /////////////////
    const gLineChart = d3.select(gLineChartRef.current)
      .attr("transform", `translate(
          ${width/2 - innerRadius}, 
          ${height/2 - innerRadius + innerRadius/2})`
        ) // center of the graphing space 

    /////////////  Scales  //////////////////////  
    // X Scale - years for which we have the data
    const xScaleLineChart = d3.scalePoint()
      .domain(dataForSelectedCity.map(d => d[yearCol]).sort(d3.ascending))
      .range([lineChartMargin.left, lineChartWidth - lineChartMargin.right])

    // Y Axis - emissions total for these years
    const yScaleLineChart = d3.scaleLinear()
      // if only for the selected city
      .domain(d3.extent(dataForSelectedCity, d => d[emissionsTotalCol])).nice()
      //.domain([0, d3.max(dataForSelectedCity, d => d[emissionsTotalCol])]).nice()
      // if for all cities
      //.domain(d3.extent(data, d => d[emissionsTotalCol])).nice()
      .range([lineChartHeight - lineChartMargin.bottom, lineChartMargin.top])

    // Y Axis - emissions total for these years
    // we need this separately for the area chart bit bcause of how the gradient is constructed 
    // we want to be staring at 0 
    const yScaleAreaChart = d3.scaleLinear()
      // if only for the selected city
      .domain([0, d3.max(dataForSelectedCity, d => d[emissionsTotalCol])]).nice()
      // if for all cities
      //.domain(d3.extent(data, d => d[emissionsTotalCol])).nice()
      .range([lineChartHeight - lineChartMargin.bottom, lineChartMargin.top])

    /////////////  Axes   //////////////////////  
    // X Axis 
    const xAxisLineChart = g => g 
        .attr("transform", `translate(${0}, ${lineChartHeight - lineChartMargin.bottom})`)
        .call(d3.axisBottom(xScaleLineChart).tickFormat(d3.format("2")).tickSizeOuter(0))
        .call(g => g.selectAll("text")
          .attr("fill", lightColour)
          .attr("font-size", "0.7em")
        )
        .call(g => g.selectAll("line").remove())
        .call(g => g.select(".domain").remove())
    // Y Axis 
    const yAxisLineChart = g =>g 
        .attr("transform", `translate(${lineChartMargin.left}, ${0})`)
        .call(d3.axisLeft(yScaleLineChart).tickFormat(d3.format(".2s")).ticks(3).tickSizeOuter(0))
        .call(g => g.selectAll("line").remove())
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("text")
          .attr("fill", lightColour)
          .attr("font-size", "0.7em")
        )
        .call(g => g.select(".tick:last-of-type text").clone()
          .attr("x", -5)
          .attr("y", -22)
          .attr("text-anchor", "end")
          //.attr("font-weight", "bold")
          .text("total emissions (m. tonnes)"))

    // Call the axes 
    d3.select(xAxisLineChartRef.current).call(xAxisLineChart)
    d3.select(yAxisLineChartRef.current).call(yAxisLineChart)

    ////////// Line and Area Chart   ///////////////////
    const curve = d3.curveNatural //d3.curveLinear 
    // Line - if using a line chart
    const line = d3.line(d => xScaleLineChart(d[yearCol]), d => yScaleLineChart(d[emissionsTotalCol]))
      .curve(curve);
    // Area - if using area chart
    const area = d3.area()
      .curve(curve)
      .x(d => xScaleLineChart(d[yearCol]))
      .y0(d => yScaleAreaChart(0))
      .y1(d => yScaleLineChart(d[emissionsTotalCol]))

    // Draw the area chart
    const areaChart = gLineChart
        .append("path")
        .datum(dataForSelectedCity.sort((a, b) => a[yearCol] - b[yearCol]))
        .classed("area-chart", true)
        .style("fill", "url(#areaGradient)")
        .attr("d", area)
        .attr("opacity", 0)
        .transition(t)
        .attr("opacity", 1)       
        
    // Draw the line chart
    const lineChart = gLineChart
        .append("path")
        .datum(dataForSelectedCity)
        .classed("line-chart", true)
          .attr("fill", "none")
          .attr("stroke", emissionsColour)
          .attr("stroke-width", 2.5)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("filter", "url(#glow)")
          .attr("d", line)
          .attr("opacity", 0)
          .transition(t)
          .attr("opacity", 1)
          

    // Draw circles for each year
    const circleChart = gLineChart
        .selectAll(".circle-chart")
        .data(dataForSelectedCity)
        .join("circle")
        .classed("circle-chart", true)
        .attr("cx", d => xScaleLineChart(d[yearCol]))
        .attr("cy", d => yScaleLineChart(d[emissionsTotalCol]))
        .attr("fill", lightColour)
        .attr("r", 3) 

    // tooltip events 
    const tooltip = d3.select(tooltipRef.current)
    circleChart
      .on('click', function(e, datum){
        console.log(datum)
        setSelectedEvent(datum)
        tooltip 
          .style("opacity", 1)
          .style('transform', d => `translate(
              ${xScaleLineChart(datum[yearCol]) + outerRadius/2}px,
              ${yScaleLineChart(datum[emissionsTotalCol]) + outerRadius/2}px
              )`
            )
      })
      .on("mouseenter", function(e, datum) {
        d3.select(this).attr("r", 6)
      })
      .on("mouseleave", function(e, datum) {
        d3.select(this).attr("r", 3)
      })

    // to remove the tooltip if we click outside the circle 
    gCircleChart.on("click", function() {
      tooltip.style("opacity", 0) 
    })


  } else {
    console.log("no data")
  }
  }, [data, city]);


  return (
    <div className="city-chart-container">
      <h2 className="city-name">{city}</h2>

      <div className="wrapper">

        <svg ref={svgRef} width={width} height={height}>
          <g ref={gCircleChartRef}>
            <g ref={gOuterCircleRef}></g>
          </g>
          <g ref={gLineChartRef}>
            <g ref={xAxisLineChartRef}></g>
            <g ref={yAxisLineChartRef}></g>
          </g>
        </svg>

        <div className="tooltip" ref={tooltipRef}>
        { selectedEvent ?
           <div>
              <span className="tooltip-text">
                <span style={{'fontWeight': 'bold'}}>year: </span> 
                {selectedEvent['Reporting Period']}
              </span>
              <span className="tooltip-text">
                <span style={{'fontWeight': 'bold'}}>population: </span> 
                {d3.format(".2s")(selectedEvent[" Population "])}
              </span>
              <span className="tooltip-text">
                <span style={{'fontWeight': 'bold'}}>total emissions: </span> 
                {d3.format(".2s")(selectedEvent['Total emissions (metric tonnes CO2e)'])}
              </span>
              <span className="tooltip-text">
                <span style={{'fontWeight': 'bold'}}>GHG/capita: </span>
                {selectedEvent["GHG/Capita"]}
              </span>
              <span className="tooltip-text">
                <span style={{'fontWeight': 'bold'}}>methodology:  </span>
                {selectedEvent["Methodology/Protocol"]}
              </span>
            </div> 
          : null
        }
      </div>

    </div>


    </div>
  )
};

export default CityCircles;