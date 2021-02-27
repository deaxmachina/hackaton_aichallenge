import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import _ from "lodash";
import chroma from "chroma-js";
import "./TreeAndCity.css"


const TreeAndCity = ({
  showAllCities,
  dataTree,
  dataCities, 
  meanEmissionsTotal, 
  cities,
  widthTree,
  heightTree,
  minCountryRadius,
  maxCountryRadius
}) => {

  /// REFS ///
  const svgRef = useRef();
  // Tree //
  const gRefTreeGraph = useRef();
  const gTreeRef = useRef();
  const gCirclesRef = useRef();
  const gTextRef = useRef();
  // City Circles //
  const gRefCityGraph = useRef();
  const gCircleChartRef = useRef();
  const gOuterCircleRef = useRef();
  const gLineChartRef = useRef();
  const xAxisLineChartRef = useRef();
  const yAxisLineChartRef = useRef();
  // Other //
  const defsRef = useRef();
  const tooltipRef = useRef();
  const opacityGRef = useRef();
  const legendRef = useRef();


  /// STATES ///
  // for the tooltip
  const [selectedEvent, setSelectedEvent] = useState(null);
  // for the selected city 
  const [city, setSelectedCity] = useState(null)

  /// CONSTANTS ///
  // dimensions 
  //const widthTree = 900; // 1200
  //const heightTree = 900; // 1200
  const radiusTree = widthTree / 2 
  //const minCountryRadius = 3; // 2
  //const maxCountryRadius = 18; //14 
  const minEmissions = 0;
  const maxEmissions = 64000000;
  const innerRadiusCityCircle = 100;
  const outerRadiusCiryCircle = 250;
  const lineChartWidth = 2*innerRadiusCityCircle
  const lineChartHeight = 1*innerRadiusCityCircle 
  const lineChartMargin = {top:20, right: 0, bottom: 0, left: 0}

  // columns that we will use 
  const yearCol = "Reporting Period"
  const cityCol = "CityName"
  const emissionsPerCapitaCol = "GHG/Capita"
  const emissionsTotalCol = "Total emissions (metric tonnes CO2e)"

  // colours 
  const darkColour = "#0A0A0A" 
  const lightColour = "#f6f2e7"
  const nodesColour = "#353535"
  const lowEmissiosColour = "#212f45"
  const highEmissionsColour = "#006466"
  const midEmissionsColour = "#144552"
  const emissionsColour = "#3e1f47"

  // opacity 
  const treeCirclesOpacity = 0.9;


  /// D3 Code ///
  useEffect(() => {
    if (dataTree && dataCities && cities) {

    const svg = d3.select(svgRef.current)


    /////////////////////////////////////////////
    //////////////  FILTERS /////////////////////
    /////////////////////////////////////////////
    //Container for the gradients
    const defs = d3.select(defsRef.current)
    /// Glow ///
    const glowFilter = defs
      .selectAll("filter").data([0]).join("filter").attr("id","glow")
    glowFilter
      .selectAll("feGaussianBlur").data([0]).join("feGaussianBlur")
        .attr("class", "blur").attr("stdDeviation", 6).attr("result","coloredBlur");
    const feMerge = glowFilter
      .selectAll("feMerge").data([0]).join("feMerge")
    feMerge
      .selectAll("feMergeNode").data([0]).join("feMergeNode").attr("in","coloredBlur")
    feMerge
      .selectAll("feMergeNode").data([0]).join("feMergeNode")
        .attr("in","SourceGraphic")

    /// Static Noise ///
    const staticNoise = defs 
      .append("filter").attr("id", "noise")
    staticNoise.append("feTurbulence")
      .attr("type", "fractalNoise").attr("baseFrequency", 0.9).attr("result", "noisy")
    staticNoise.append("feColorMatrix")
      .attr("type", "saturate").attr("values", 0)
    staticNoise.append("feComposite")
      .attr("operator", "in").attr("in2", "SourceGraphic").attr("result", "monoNoise")
    staticNoise.append("feBlend")
      .attr("in", "SourceGraphic").attr("in2", "monoNoise").attr("mode", "multiply")

		/// Radial Gradients ///
		defs.append("radialGradient")
			.attr("id", "radial-gradient")
			.attr("cx", "50%").attr("cy", "50%").attr("r", "50%")	
			.selectAll("stop")
				.data([
						{offset: "0%", color: lowEmissiosColour},
						{offset: "50%", color: midEmissionsColour},
						{offset: "100%", color:  highEmissionsColour},
					])
			.enter().append("stop")
			.attr("offset", function(d) { return d.offset; })
      .attr("stop-color", function(d) { return d.color; });


    /// Area Gradient /// 
    const areaGradient = defs
      .selectAll("linearGradient").data([0]).join("linearGradient")
        .attr("id","areaGradient")
        .attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    areaGradient
      .selectAll(".stop-1").data([0]).join("stop").classed("stop-1", true)
        .attr("offset", "0%").attr("stop-color", emissionsColour).attr("stop-opacity", 0.6);
    areaGradient
      .selectAll(".stop-2").data([0]).join("stop").classed("stop-2", true)
        .attr("offset", "100%").attr("stop-color", darkColour).attr("stop-opacity", 0);


    ////////////////////////////////////////////////////////////////
    ////////////////                      //////////////////////////
    ///////////////       TREE GRAPH     ///////////////////////////
    //////////////                       ///////////////////////////
    ////////////////////////////////////////////////////////////////
 
    ////// Transform the data //////
    const tree = d3.cluster().size([2 * Math.PI, radiusTree - 120])
    const root = tree(d3.hierarchy(dataTree))

    /// Graph area ///  
    const gTreeGraph = d3.select(gRefTreeGraph.current).attr("transform", `translate(${widthTree/2}, ${heightTree/2})`)

    /////////////////////////////////
    //////////  Scales //////////////
    /////////////////////////////////
    /// Scale for the radius ///
    // Based on total emissions - numbers were obtained in python notebook for simplicity
    const treeRadiusScale = d3.scaleSqrt()
      .domain([minEmissions, maxEmissions])
      .range([minCountryRadius, maxCountryRadius])

    /// Colour scale also for the country circles ///
    // Based on total emissions - numbers were obtained in python notebook for simplicity
    const treeNodesColorScale = chroma.scale([lowEmissiosColour, highEmissionsColour]
        .map(color => chroma(color).saturate(0.1)))
        .domain([minEmissions, maxEmissions])


    /////////////////////////////////
    //// The Circular Tree Shape ////
    /////////////////////////////////
    // 1. Group to contain the tree
    const treeGraphG = d3.select(gTreeRef.current)
    // 2. Tree itself - a collection of paths
    const treeGraph = treeGraphG
      .selectAll("path")
      .data(root.links())
      .join("path")
        .attr("d", d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y))
        .attr("fill", "none")
        // paths are stroked only at the city level, based on the avg total emissions of the city
        .attr("stroke", d => d.target.children 
          ? nodesColour
          : treeNodesColorScale(d.target.data.emissions_total)
        )
        .attr("stroke-opacity", treeCirclesOpacity)
        .attr("stroke-width", 1.3)

    /////////////////////////////////
    /// Circles for all the nodes ///
    /////////////////////////////////
    const nodeCircles = d3.select(gCirclesRef.current)
      .selectAll("circle")
      .data(root.descendants())
      .join("circle")
        .attr("transform", d => `
          rotate(${d.x * 180 / Math.PI - 90})
          translate(${d.y},0)
        `)
        // radius of cities based on the avg total emissions of the city
        .attr("r", d => d.children ? 3 : treeRadiusScale(d.data.emissions_total))
        // circle fill based on the avg total emissions of the city
        .attr("fill", d => d.children ? nodesColour : treeNodesColorScale(d.data.emissions_total))
        .attr("fill-opacity", treeCirclesOpacity)
        .attr('stroke', d => d.children ? nodesColour : treeNodesColorScale(d.data.emissions_total))
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 1)

    /////////////////////////////////
    ////// Text on the nodes ////////
    /////////////////////////////////
    // 1. Group to contain all the text elements 
    const labelsG = d3.select(gTextRef.current)
    // 2. Append text element for each label 
    const labels = labelsG
      .selectAll("text")
      .data(root.descendants())
      .join("text")
        .attr("transform", d => `
          rotate(${d.x * 180 / Math.PI - 90}) 
          translate(${d.y + 10},0) 
          rotate(${d.x >= Math.PI ? 180 : 0})
        `)
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
        .text(d => d.data.name == "missing"? d.data.nameCityRegion : d.data.name)
        .style("fill", lightColour)
        .attr("font-size", 10)
        .attr("font-family", "Fraunces, serif")
        .attr("opacity", d  => d.children ? 1 : cities.includes(d.data.name) ? 1 : 0.6)
        .attr("pointer-events", "none")
        .attr("pointer", 'default')


    ////////////////////////////////////////////////////////////////
    ////////////////                       /////////////////////////
    ///////////////       CITY CIRCLES    //////////////////////////
    //////////////                       ///////////////////////////
    ////////////////////////////////////////////////////////////////   


    /////////////////////////////////////////////
    //////////  Circle Chart  ///////////////////
    /////////////////////////////////////////////
    /// Graph area ///  
    const gCityGraph = d3.select(gRefCityGraph.current)
      .attr("transform", `translate(${widthTree/2}, ${heightTree/2})`)
      .style("opacity", 1)

    /////////////////////////////////////////////
    //////////  Emissions Legend  ////////////////
    /////////////////////////////////////////////
    /*
    const emissionsLegendG = d3.select(legendRef.current)
      .attr("transform", `translate(${widthTree/2}, ${-50})`)

    const emissionsLegendCircle = emissionsLegendG
      .selectAll(".emissionsLegendCircle")  
      .data([0])
      .join("circle")
        .classed("emissionsLegendRect", true)
        .attr("r", 60)
        .style("fill", "url(#radial-gradient)")

    const emissionsLegendTextMost = emissionsLegendG
      .selectAll(".emissionsLegendTextMost")  
      .data([0])
      .join("text")
      .classed("emissionsLegendTextMost", true)
        .style("fill", lightColour)
        .attr("transform", `translate(${65}, ${0})`)
        .attr("font-size", "0.5em")
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(d3.format(".2s")(maxEmissions) + " emissions")

    const emissionsLegendTextLeast = emissionsLegendG
      .selectAll(".emissionsLegendTextLest")  
      .data([0])
      .join("text")
      .classed("emissionsLegendTextLest", true)
        .style("fill", lightColour)
        .attr("transform", `translate(${0}, ${0})`)
        .attr("font-size", "0.5em")
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(minEmissions + " emissions")

      */


    ///////////////////////////////////////////////////////////////////////////////////

    if (city) {

    ///// Data Computations ///
    // extract data for that city 
    let dataForSelectedCity = _.filter(dataCities, element => element[cityCol] == city)
    dataForSelectedCity = _.uniqBy(dataForSelectedCity, element => element[yearCol]) // repreated 
    // find the mean of the emissions across all years for that city 
    const meanEmissionsSelectedCity = _.meanBy(dataForSelectedCity, element => element[emissionsTotalCol])
    
    const gCircleChart = d3.select(gCircleChartRef.current)
    // for any transitions
    const t = d3.transition().duration(1000);

    //////////  Static Circle ///////////////////
    const staticCircle = gCircleChart
      .selectAll(".static-circle")
      .data([0])
      .join("circle")
      .classed("static-circle", true)
        .attr("fill", darkColour)
        .attr("stroke", darkColour)
        .attr("stroke-width", 2)
        .attr("r", innerRadiusCityCircle)

    //////////  Outer Circle ////////////////////
    const outerCircleG = d3.select(gOuterCircleRef.current)
    const arc = d3.arc()
    /// Scale for the radius ///
    const radiusScale = d3.scaleSqrt()
      .domain([0, meanEmissionsTotal])
      .range([innerRadiusCityCircle, outerRadiusCiryCircle])


    // Constant circle with just the max possible value 
    const outerCircleMax = outerCircleG
      .selectAll(".outer-circle-max")
      .data([0])
      .join("circle")
      .classed("outer-circle-max", true)
        .style("fill", darkColour)
        .attr("stroke", "#1b3a4b")
        .attr("stroke-dasharray", "2,3")
        .attr("stroke-width", 1.8)
        .attr("filter", "url(#glow)")
        .attr("r", radiusScale(meanEmissionsTotal))

    // Outer circle with the noise 
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
          innerRadius: innerRadiusCityCircle,
          outerRadius: innerRadiusCityCircle,
          startAngle: 0,
          endAngle: 2*Math.PI 
        }))
        .transition(t)
        .attr("d", d => arc({
          innerRadius: innerRadiusCityCircle,
          // if by total emissions 
          outerRadius: radiusScale(meanEmissionsSelectedCity),
          // if by emissions per capita 
          startAngle: 0,
          endAngle: 2*Math.PI 
        }))

    // Text with the city name in the middle
    const cityNameText = outerCircleG
        .selectAll(".city-name-text")
        .data([city])
        .join("text")
        .classed("city-name-text", true)
          .attr("transform", `translate(${0}, ${-140})`)
          .text(d => d)
          .attr("dy", "0.35em")
          .attr("font-family", "Fraunces, serif")
          .attr("text-anchor", "middle")
          .style("fill", lightColour)
          .attr("font-size", "0em")
          .transition(t)
            .attr("font-size", "1.5em")

    ////////// Text in the middle /////////////////
    const textInStaticCircle = gCircleChart
      .selectAll(".text-for-avg-emissions-group")
      .data([city])
      .join("g")
      .classed("text-for-avg-emissions-group", true)

    const textInStaticCircleMeanEmissions = textInStaticCircle
      .selectAll(".text-for-avg-emissions")
      .data([city])
      .join("text")
      .classed("text-for-avg-emissions", true)
        .attr("fill", lightColour)
        .text(d3.format(".2s")(meanEmissionsSelectedCity))
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${0}, ${-70})`)
        .attr("font-size", "0em")
        .transition(t)
          .attr("font-size", "1.5em")

    const textInStaticCircleMeanEmissionsTitle = textInStaticCircle
        .selectAll(".text-for-avg-emissions-title")
        .data([city])
        .join("text")
        .classed("text-for-avg-emissions-title", true)
          .attr("fill", lightColour)
          .text("avg emissions / year")
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .attr("transform", `translate(${0}, ${-50})`)
          .attr("font-size", "0em")
          .transition(t)
            .attr("font-size", "0.6em")


    /////////////////////////////////////////////
    ///////////  Line Chart  ////////////////////
    /////////////////////////////////////////////

    //////////  Chart Container /////////////////
    const gLineChart = d3.select(gLineChartRef.current)
      .attr("transform", `translate(
          ${-innerRadiusCityCircle}, 
          ${-innerRadiusCityCircle/2})`
        ) // center of the graphing space 

    /////////////  Scales  //////////////////////  
    // X Scale - years for which we have the data
    const xScaleLineChart = d3.scalePoint()
      .domain(dataForSelectedCity.map(d => d[yearCol]).sort(d3.ascending))
      .range([lineChartMargin.left, lineChartWidth - lineChartMargin.right])

    // Y Scale for Line - emissions total for these years
    const yScaleLineChart = d3.scaleLinear()
      .domain(d3.extent(dataForSelectedCity, d => d[emissionsTotalCol])).nice()
      .range([lineChartHeight - lineChartMargin.bottom, lineChartMargin.top])

    // Y Scale for Area - emissions total for these years
    const yScaleAreaChart = d3.scaleLinear()
      .domain([0, d3.max(dataForSelectedCity, d => d[emissionsTotalCol])]).nice()
      .range([lineChartHeight - lineChartMargin.bottom, lineChartMargin.top])

    /////////////  Axes   //////////////////////  
    // X Axis 
    const xAxisLineChart = g => g 
        .attr("transform", `translate(${0}, ${lineChartHeight - lineChartMargin.bottom})`)
        .call(d3.axisBottom(xScaleLineChart).tickFormat(d3.format("2")).tickSizeOuter(0))
        .call(g => g.selectAll("text")
          .attr("fill", lightColour)
          .attr("font-size", "0.9em")
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
          .attr("font-size", "0.9em")
        )
        .call(g => g.select(".tick:last-of-type text").clone()
          .attr("x", -5)
          .attr("y", -22)
          .attr("text-anchor", "end")
          //.attr("font-weight", "bold")
          .text(emissionsTotalCol))

    // Call the axes 
    d3.select(xAxisLineChartRef.current).call(xAxisLineChart)
    d3.select(yAxisLineChartRef.current).call(yAxisLineChart)


    ////////// Line and Area Chart   ///////////////////
    const curve = d3.curveNatural 
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
      //.append("path")
      //.datum(dataForSelectedCity.sort((a, b) => a[yearCol] - b[yearCol]))
      .selectAll(".area-chart")
      .data([dataForSelectedCity.sort((a, b) => a[yearCol] - b[yearCol])])
      .join("path")
      .classed("area-chart", true)
        .style("fill", "url(#areaGradient)")
        .attr("d", area)
        .attr("opacity", 0)
        .transition(t)
          .attr("opacity", 1)  

    // Draw the line chart
    const lineChart = gLineChart
      //.append("path")
      //.datum(dataForSelectedCity)
      .selectAll(".line-chart")
      .data([dataForSelectedCity.sort((a, b) => a[yearCol] - b[yearCol])])
      .join("path")
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
              ${xScaleLineChart(datum[yearCol]) + widthTree/3 }px,
              ${yScaleLineChart(datum[emissionsTotalCol]) + widthTree/3 }px
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
  }
  ///////////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////
    ////////////////                       /////////////////////////
    ///////////////      INTERACTIVITY    //////////////////////////
    //////////////                       ///////////////////////////
    //////////////////////////////////////////////////////////////// 

    // events on the circles 
    nodeCircles.on("mouseenter", function(e, datum) {
      const selectedCircle = d3.select(this)
      // make the circle for this data bigger and fully opaque
      nodeCircles
          .attr("r", d => d == datum? 15 : d.children ? 3 : treeRadiusScale(d.data.emissions_total))
          .attr("fill-opacity", d => d == datum? 1 : 0.2)
          .attr("stroke-opacity", d => d == datum? 1 : 0.1)
      // make the label for the this data fully opaque + the labels for its parents 
      labels.attr("opacity", d => d == datum
      ? 1 : d == datum.parent ? 1 : d == datum.parent.parent ? 1 : 0.1)
      // make the path leading from Country to this city fully opaque
      treeGraph
        .attr("stroke-opacity", d => d.target.data == datum.data 
          ? 1 
          : d.target.data == datum.parent.data ? 1 : 0.1
        )
    })

    nodeCircles.on("mouseleave", function() {
      nodeCircles
        .attr("r", d => d.children ? 3 : treeRadiusScale(d.data.emissions_total))
        .attr("fill-opacity", treeCirclesOpacity)
        .attr("stroke-opacity", 1)
      labels.attr("opacity", d  => d.children ? 1 : cities.includes(d.data.name) ? 1 : 0.6)
      treeGraph.attr("stroke-opacity", treeCirclesOpacity)
    })


    nodeCircles.on("click", function(e, datum) {
      const selectedCity = datum.data.name;
      // only if the selected city is one we have a graph for 
      if (cities.includes(selectedCity)) {
        // set the selected city to be the one corresponding to the node 
        setSelectedCity(datum.data.name)
        // and make tree graph very transparent; 
        // if it's not showing all cities don't make it transparent as it still 
        // looks good even if it's opaque
        showAllCities ? gTreeGraph.attr("opacity", 0.04) : gTreeGraph.attr("opacity", 0.9)
        
        // set the city graph opacity to 1 
        gCityGraph.style("opacity", 1)
      }
    })

    // element to click on to get the full tree opacity again 
    const opacityG = d3.select(opacityGRef.current)
      .attr("transform", `translate(${100}, ${100})`)
      .on("click", function(){ 
        gTreeGraph.attr("opacity", 1) 
        labels.attr("opacity", d  => d.children ? 1 : cities.includes(d.data.name) ? 1 : 0.6)
        gCityGraph.style("opacity", 0)
      })

    } 
  }, [dataTree, dataCities, city, widthTree, heightTree, minCountryRadius, maxCountryRadius, showAllCities]);


  return (

      <div className="tree-and-city-container">
        <svg ref={svgRef} width={widthTree} height={heightTree} overflow="visible">
          <defs ref={defsRef}></defs>
          <g ref={legendRef}></g>

          {/* TREE */}
          <g ref={gRefTreeGraph}>
            <g ref={gTreeRef}></g>
            <g ref={gCirclesRef}></g>
            <g ref={gTextRef}></g>
          </g>

          {/* CIRCLES */}
          <g ref={gRefCityGraph}>
            <g ref={gCircleChartRef}>
              <g ref={gOuterCircleRef}></g>
            </g>
            <g ref={gLineChartRef}>
              <g ref={xAxisLineChartRef}></g>
              <g ref={yAxisLineChartRef}></g>
            </g>
          </g> 

        </svg>

        <div ref={opacityGRef} className="all-cities-button">back to cities</div>

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

  )
};

export default TreeAndCity;