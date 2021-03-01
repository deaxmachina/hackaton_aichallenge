import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import _ from "lodash";
import chroma from "chroma-js";

import "./CircleChart.css"
import dataLoad from "../../data/cities_with_5_records.csv";

const CircleChart = () => {

  /// refs ///
  const svgRef = useRef();
  const gRef = useRef();

  /// states ///
  const [data, setData] = useState(null);

  /// constatns ///
  // dimensions 
  const width = 600;
  const height = 600;
  const staticRadius = 100;
  const innerRadius = 100;
  const outerRadius = 300;

  // columns that we will use 
  const yearCol = "Reporting Period"
  const cityCol = "City"
  const populationCol = " Population "
  const emissionsPerCapitaCol = "GHG/Capita"
  const emissionsTotalCol = "Total emissions (metric tonnes CO2e)"
  const methodologyCol = "Methodology/Protocol"

  // colours //
  const staticCircleColour = "#0b090a"

  /// Data load ///
  useEffect(() => {
    d3.csv(dataLoad, d3.autoType).then(d => {
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
    ///// Data Computations ///
    // find the mean of the emissions across all years 
    const meanEmissions = _.meanBy(data, element => element[emissionsTotalCol])
    console.log(meanEmissions)

    /// Graph space ///
    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)
      .attr("transform", `translate(${outerRadius}, ${outerRadius})`) // center of the circle 

    /////////////////////////////////////////////
    //////////////  FILTERS /////////////////////
    /////////////////////////////////////////////
    //Container for the gradients
    const defs = svg.append("defs")

    //// Glow ///
    //Code taken from http://stackoverflow.com/questions/9630008/how-can-i-create-a-glow-around-a-rectangle-with-svg
    //Filter for the outside glow
    const glowFilter = defs.append("filter")
      .attr("id","glow")

    // change the std to make it more or less blurry 
    glowFilter.append("feGaussianBlur")
      .attr("class", "blur")
      .attr("stdDeviation", 5)
      .attr("result","coloredBlur");

    const feMerge = glowFilter.append("feMerge")
    feMerge.append("feMergeNode")
      .attr("in","coloredBlur")
    feMerge.append("feMergeNode")
      .attr("in","SourceGraphic")

    /// Gaussian ///
    // the standard deviation defined how blurry it gets 
    const gaussian  = defs
      .append("filter")
      .attr("id", "gaussian-blur")
      .append("feGaussianBlur")
      .attr("stdDeviation", 20); 

    /// Static Noise ///
    // Code from: 
    //https://stackoverflow.com/questions/64946883 apply-noise-to-image-with-transparency-by-use-of-svg-filters and 
    // https://codepen.io/chriswrightdesign/pen/aOpGVe/
    const staticNoise = defs 
      .append("filter")
      .attr("id", "noise")

    staticNoise.append("feTurbulence")
      .attr("type", "fractalNoise")
      .attr("baseFrequency", 0.7)
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


    //// Multiple filters ///
    const multipleFilter = defs.append("filter")
      .attr("id","multiple")


		/// Radial Gradients ///
		defs.append("radialGradient")
			.attr("id", "radial-gradient")
			.attr("cx", "50%")	//not really needed, since 50% is the default
			.attr("cy", "50%")	//not really needed, since 50% is the default
			.attr("r", "50%")	//not really needed, since 50% is the default
			.selectAll("stop")
				.data([
						{offset: "0%", color: "#272640"},
						{offset: "30%", color: "#312244"},
						{offset: "60%", color: "#3E1F47"},
						{offset: "100%", color: "#6c236c"}
					])
			.enter().append("stop")
			.attr("offset", function(d) { return d.offset; })
      .attr("stop-color", function(d) { return d.color; });
      
    defs.append("radialGradient")
			.attr("id", "radial-gradient-positive")
			.attr("cx", "50%")	//not really needed, since 50% is the default
			.attr("cy", "50%")	//not really needed, since 50% is the default
			.attr("r", "50%")	//not really needed, since 50% is the default
			.selectAll("stop")
				.data([
						{offset: "0%", color: "#1b3a4b"},
						{offset: "30%", color: "#0B525B"},
						{offset: "60%", color: "#065a60"},
						{offset: "100%", color: "#006466"}
					])
			.enter().append("stop")
			.attr("offset", function(d) { return d.offset; })
			.attr("stop-color", function(d) { return d.color; });

    const t = d3.transition().duration(1000);

    /////////////////////////////////////////////
    //////////  Static Circle ///////////////////
    /////////////////////////////////////////////
    const staticCircle = g
      .selectAll(".static-circle")
      .data([0])
      .join("circle")
      .classed("static-circle", true)
        .attr("r", 0)
        .attr("fill", staticCircleColour)
        .attr("stroke", "#f5f3f4")
        .attr("stroke-width", 8)
        .transition(t)
        .attr("r", staticRadius)

    /////////////////////////////////////////////
    //////////  Outer Circle ////////////////////
    /////////////////////////////////////////////

    /// Scale for the radius ///
    // the actual version will use the min and max across all cities 
    // to determine the scale 
    const radiusScale = d3.scaleSqrt()
      .domain([0, meanEmissions])
      .range([0, outerRadius])

    console.log(radiusScale(meanEmissions))


    const arc = d3.arc()
  
    const outerCircleG = g
      .append("g")

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
            outerRadius: radiusScale(meanEmissions) - 50,
            startAngle: 0,
            endAngle: 2*Math.PI 
          }))        

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
          outerRadius: radiusScale(meanEmissions) - 50,
          startAngle: 0,
          endAngle: 2*Math.PI 
        }))
        

    /////////////////////////////////////////////
    //////////  Inner Circle ////////////////////
    /////////////////////////////////////////////
  } else {
    console.log("no data")
  }

  }, [data]);


  return (
    <div>
      <h1>Circle Chart</h1>

      <div className="wrapper-circlechart">
        <svg ref={svgRef} width={width} height={height}>
          <g ref={gRef}></g>
        </svg>
      </div>

    </div>
  )
};

export default CircleChart;