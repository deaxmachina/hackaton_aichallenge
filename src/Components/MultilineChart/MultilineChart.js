import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import _ from "lodash";
import chroma from "chroma-js";

import "./MultilineChart.css"


const MultilineChart = ({ data, meanEmissionsTotal, meanEmissionsPerCapitaTotal, emissionsType, cities, transformedCities }) => {

  /// refs ///
  const svgRef = useRef();
  // for the line chart
  const gLineChartRef = useRef();
  const xAxisLineChartRef = useRef();
  const yAxisLineChartRef = useRef();
  // for the tooltip
  const tooltipRef = useRef();

  /// states ///
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [city, setCity] = useState(null)

  /// constatns ///
  // dimensions //
  // whole SVG
  const width = 1000;
  const height = 700;
  // line chart 
  const lineChartWidth = width
  const lineChartHeight = height 
  const lineChartMargin = {top:20, right: 10, bottom: 60, left: 60}

  // columns that we will use 
  const yearCol = "Reporting Period"
  const cityCol = "City"
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

  if (data) {

    ///// Data Computations ///
    const city = "Tokyo Metropolitan Government"
    /// Selected City ///
    // extract data for that city 
    let dataForSelectedCity = _.filter(data, element => element[cityCol] == city)
    dataForSelectedCity = _.uniqBy(dataForSelectedCity, element => element[yearCol]) // in case there are repeated cols
    // find the mean of the emissions across all years 
    const meanEmissionsSelectedCity = _.meanBy(dataForSelectedCity, element => element[emissionsTotalCol])
    // find the mean of the emissions per capita across all years 
    const meanEmissionsPerCapitaSelectedCity = _.meanBy(dataForSelectedCity, element => element[emissionsPerCapitaCol])
    // find the total emission across all years
    const totalEmissionsSelectedCity = _.sumBy(dataForSelectedCity, element => element[emissionsTotalCol])

    // create new object for all the cities 
    console.log(transformedCities)


    /// Graph space ///
    const svg = d3.select(svgRef.current)

    /////////////////////////////////////////////
    //////////////  FILTERS /////////////////////
    /////////////////////////////////////////////
    //Container for the gradients
    const defs = svg.append("defs")

    /// Glow ///
    //Code taken from http://stackoverflow.com/questions/9630008/how-can-i-create-a-glow-around-a-rectangle-with-svg
    //Filter for the outside glow
    const glowFilter = defs.append("filter")
      .attr("id","glow")

    // change the std to make it more or less blurry 
    glowFilter.append("feGaussianBlur")
      .attr("class", "blur")
      .attr("stdDeviation", 2)
      .attr("result","coloredBlur");

    const feMerge = glowFilter.append("feMerge")
    feMerge.append("feMergeNode")
      .attr("in","coloredBlur")
    feMerge.append("feMergeNode")
      .attr("in","SourceGraphic")

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
      .attr("offset", "50%")
      .attr("stop-color", darkColour)
      .attr("stop-opacity", 0);
      

    
    /////////////////////////////////////////////
    ///////////  Line Chart  ////////////////////
    /////////////////////////////////////////////

    //////////  Chart Container /////////////////
    const gLineChart = d3.select(gLineChartRef.current)
      .attr("transform", `translate(
          ${lineChartMargin.left}, 
          ${lineChartMargin.top})`
        ) // center of the graphing space 

    /////////////  Scales  //////////////////////  
    // X Scale - years for which we have the data
    const xScaleLineChart = d3.scalePoint()
      .domain(data.map(d => d[yearCol]).sort(d3.ascending)) // for all the cities 
      //.domain([2016, 2017, 2018, 2019])
      .range([lineChartMargin.left, lineChartWidth - lineChartMargin.right])

    // Y Axis - emissions total for these years
    const yScaleLineChart = d3.scaleLinear()
      .domain(d3.extent(data, d => d[emissionsPerCapitaCol])).nice()
      //.domain([0, d3.max(data, d => d[emissionsTotalCol])])
      .range([lineChartHeight - lineChartMargin.bottom, lineChartMargin.top])

    // Y Axis - emissions total for these years
    // we need this separately for the area chart bit bcause of how the gradient is constructed 
    // we want to be staring at 0 
    const yScaleAreaChart = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[emissionsPerCapitaCol])]).nice()
      //.domain([0, d3.max(data, d => d[emissionsTotalCol])]).nice()
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
        .call(d3.axisLeft(yScaleLineChart).tickFormat(d3.format(".2s")).tickSizeOuter(0))
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
    const line = d3.line(
      d => xScaleLineChart(d[yearCol]), 
      d => yScaleLineChart(d[emissionsPerCapitaCol])
      //d => yScaleLineChart(d[emissionsTotalCol])
      )
      .curve(curve);
    // Area - if using area chart
    const area = d3.area()
      .curve(curve)
      .x(d => xScaleLineChart(d[yearCol]))
      .y0(d => yScaleAreaChart(0))
      .y1(d => yScaleLineChart(d[emissionsPerCapitaCol]))
      //.y1(d => yScaleLineChart(d[emissionsTotalCol]))

    // Draw the area chart
    /*
    const areaChart = gLineChart
      .selectAll(".area-chart")
      .data(transformedCities)
      .join("path")
      .classed("area-chart", true)
        .style("fill", "url(#areaGradient)")
        .attr("d", d => area(_.uniqBy(d.data, element => element[yearCol]).sort((a, b) => a[yearCol] - b[yearCol])))
        .attr("opacity", 1)  
    */
        
    // Draw the line chart
    const lineChart = gLineChart
        .selectAll(".line-chart")
        .data(transformedCities)
        .join("path")
        .classed("line-chart", true)
          .attr("fill", "none")
          .attr("stroke", emissionsColour)
          .attr("stroke-width", 3)
          .attr("stroke-opacity", 0.8)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("filter", "url(#glow)")
          .attr("d", d => line(_.uniqBy(d.data, element => element[yearCol]).sort((a, b) => a[yearCol] - b[yearCol])))
          .attr("opacity", 1)

    // tooltip events 
    const tooltip = d3.select(tooltipRef.current)

    lineChart
      .on("mouseenter", function(e, datum) {
        lineChart.attr("stroke-opacity", d => d == datum ? 1 : 0.2)
        setCity(datum.city)
        console.log(datum.data[yearCol])
        tooltip 
          .style("opacity", 1)
          .style('transform', d => `translate(
              ${width}px,
              ${yScaleLineChart(datum.data[0][emissionsPerCapitaCol])}px
              )`
            )
      })
      .on("mouseleave", function() {
        lineChart.attr("stroke-opacity", 1)
        tooltip 
        .style("opacity", 0)
        setCity(null)
      })
      .on("click", function(e, datum) {
        console.log(datum)
      })



  } else {
    console.log("no data")
  }
  }, [data]);


  return (
    <div className="city-chart-container">
      <h2 className="city-name"></h2>

      <div className="wrapper">

        <svg ref={svgRef} width={width} height={height}>
          <g ref={gLineChartRef}>
            <g ref={xAxisLineChartRef}></g>
            <g ref={yAxisLineChartRef}></g>
          </g>
        </svg>

        <div className="tooltip-multiline" ref={tooltipRef}>
        { city ?
           <div>
              <span className="tooltip-text">
                {city}
              </span>
            </div> 
          : null
        }
      </div>

    </div>


    </div>
  )
};

export default MultilineChart;