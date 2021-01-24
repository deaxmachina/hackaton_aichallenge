import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import _ from "lodash";
import chroma from "chroma-js";

import "./LineChart.css"
import dataLoad from "../../data/cities_with_5_records.csv";



const LineChart = () => {

  /// refs ///
  const svgRef = useRef();
  const xAxisRef = useRef();
  const yAxisRef = useRef();
  const gRef = useRef();

  /// states ///
  const [data, setData] = useState(null);

  /// constatns ///
  // dimensions 
  const width = 400;
  const height = 250;
  const lineColour = "maroon";
  const textColour = "white";
  const margin = {top: 30, right: 10, bottom: 30, left: 30}

  // columns that we will use 
  const yearCol = "Reporting Period"
  const cityCol = "City"
  const populationCol = " Population "
  const emissionsPerCapitaCol = "GHG/Capita"
  const emissionsTotalCol = "Total emissions (metric tonnes CO2e)"
  const methodologyCol = "Methodology/Protocol"


  /// Data load ///
  useEffect(() => {
    d3.csv(dataLoad, d3.autoType).then(d => {
      console.log(d)
      // 1. select a single city 
      const city = "City of Austin"
      // 2. extract data for that city only and set it as data
      let dataForSelectedCity = _.filter(d, element => element[cityCol] == city)
      dataForSelectedCity = _.unionBy(dataForSelectedCity, element => element[yearCol])
      setData(dataForSelectedCity)
    })
  }, []);

  /// D3 Code ///
  useEffect(() => {
    if (data) {
      console.log(data)
      //////////////
      /// Scales ///
      /////////////
      // X Scale - years for which we have the data
      const x = d3.scalePoint()
        //.domain(d3.extent(data, d => d[yearCol]))
        .domain(data.map(d => d[yearCol]))
        .range([margin.left, width - margin.right])
      // Y Axis - emissions total for these years
      const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d[emissionsTotalCol])).nice()
        .range([height - margin.bottom, margin.top])

      ///////////// 
      /// Axes ///
      /////////////
      // X Axis 
      const xAxis = g => g 
        .attr("transform", `translate(${0}, ${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("2")).tickSizeOuter(0))
        .call(g => g.selectAll("text")
          .attr("fill", "black")
          .attr("font-size", "0.7em")
        )
        .call(g => g.selectAll(".tick").attr("color", "black"))
        .call(g => g.select(".domain").remove())
      // Y Axis 
      const yAxis = g =>g 
        .attr("transform", `translate(${margin.left}, ${0})`)
        .call(d3.axisLeft(y).tickFormat(d3.format(".2s")).ticks(2).tickSizeOuter(0))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("text")
          .attr("fill", "black")
          .attr("font-size", "0.7em")
        )
        .call(g => g.selectAll(".tick").attr("color", "black"))

      // Call the axes 
      d3.select(xAxisRef.current).call(xAxis)
      d3.select(yAxisRef.current).call(yAxis)

      /////////////
      /// Graph ///
      /////////////
      // Select the containers 
      const svg = d3.select(svgRef.current)
      const g = d3.select(gRef.current)

      /// Gradients ///
      const areaGradient = svg.append("defs")
        .append("linearGradient")
        .attr("id","areaGradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");
      areaGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "maroon")
        .attr("stop-opacity", 0.6);
      areaGradient.append("stop")
        .attr("offset", "20%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 0);

      
      const curve = d3.curveNatural //d3.curveLinear 
      // Line - if using a line chart
      const line = d3.line(d => x(d[yearCol]), d => y(d[emissionsTotalCol]))
        .curve(curve);
      // Area - if using area chart
      const area = d3.area()
        .curve(curve)
        .x(d => x(d[yearCol]))
        .y0(d => y(0))
        .y1(d => y(d[emissionsTotalCol]))

      // Draw the area chart
      const areaChart = g
        .append("path")
        .datum(data)
        .classed("area-chart", true)
        .attr("d", area)
        .style("fill", "url(#areaGradient)")

      // Draw the line chart
      const lineChart = g
        .append("path")
        .datum(data)
        .classed("line-chart", true)
          .attr("d", line)
          .attr("fill", "none")
          .attr("stroke", lineColour)
          .attr("stroke-width", 2.5)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")

      // Draw circles for each year
      const circleChart = g
        .selectAll(".circle-chart")
        .data(data)
        .join("circle")
        .classed("circle-chart", true)
        .attr("cx", d => x(d[yearCol]))
        .attr("cy", d => y(d[emissionsTotalCol]))
        .attr("r", 5) 
        .attr("fill", "black")
    
    } 
  }, [data]);


  return (
    <div>
      <h1>Line Chart</h1>

      <div className="wrapper-linechart">
        <svg ref={svgRef} 
          width={width} 
          height={height}
        >
          <g ref={gRef}></g>
          <g ref={xAxisRef}></g>
          <g ref={yAxisRef}></g>
        </svg>
      </div>

    </div>
  )
};


export default LineChart;