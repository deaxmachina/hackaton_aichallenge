import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import _ from "lodash";
import chroma from "chroma-js";
import "./TreeGraph.css"
import dataLoad from "../../data/data_for_tree_v0.json";
import CompleteChart from "../CityCircles/CityCircles";


const TreeGraph = ({
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
  const gRef = useRef();
  const gTree = useRef();
  const gCircles = useRef();
  const gText = useRef();
  const testingRef = useRef();

  /// states ///
  const [dataTree, setDataTree] = useState(null);
  const [makeGraphTransparent, setMakeGraphTransparent] = useState(true)

  /// constatns ///
  // dimensions 
  const widthTree = 1200;
  const heightTree = 1200;
  const radius = widthTree / 2
  const minCountryRadius = 2;
  const maxCountryRadius = 14;
  const minEmissions = 0;
  const maxEmissions = 64000000;
  // colours 
  const darkColour = "#0A0A0A" 
  const lightColour = "#f6f2e7"
  const nodesColour = "#353535"
  const lowEmissiosColour = "#212f45"
  const highEmissionsColour = "#006466"
  // opacity 
  const circlesOpacity = 0.8;



  /// Data load ///
  useEffect(() => {
    setDataTree(dataLoad)
  }, []);

  /// D3 Code ///
  useEffect(() => {
    if (dataTree) {
 
    ////// Transform the data //////
    const tree = d3.cluster().size([2 * Math.PI, radius - 100])
    const root = tree(d3.hierarchy(dataTree))//.sort((a, b) => d3.ascending(a.data.name, b.data.name)));

    /// Graph area ///
    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current).attr("transform", `translate(${widthTree/2}, ${heightTree/2})`)

    /////////////////////////////////
    ////////////// Scales ///////////
    /////////////////////////////////
    /// Scale for the radius ///
    // Based on total emissions - numbers were obtained in python notebook for simplicity
    const radiusScale = d3.scaleSqrt()
      .domain([minEmissions, maxEmissions])
      .range([minCountryRadius, maxCountryRadius])

    // Colour Scale 
    const colorScale = chroma.scale([lowEmissiosColour, highEmissionsColour]
        .map(color => chroma(color).saturate(0.1)))
        .domain([minEmissions, maxEmissions])


    /////////////////////////////////
    /// The Circular Tree Shape ///
    /////////////////////////////////
    // 1. Group to contain the tree
    const treeGraphG = d3.select(gTree.current)
    
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
          : colorScale(d.target.data.emissions_total)
        )
        .attr("stroke-opacity", circlesOpacity)
        .attr("stroke-width", 2)

    // events on the links -- just for testing 
    /*
    treeGraph.on("click", function(e, datum){
      console.log(datum)
      const currentElement = d3.select(this)
      currentElement
      .attr("stroke", "white")
    })
    */

    /////////////////////////////////
    /// Circles for all the nodes ///
    /////////////////////////////////
    const nodeCircles = d3.select(gCircles.current)
      .selectAll("circle")
      .data(root.descendants())
      .join("circle")
        .attr("transform", d => `
          rotate(${d.x * 180 / Math.PI - 90})
          translate(${d.y},0)
        `)
        // radius of cities based on the avg total emissions of the city
        .attr("r", d => d.children ? 3 : radiusScale(d.data.emissions_total))
        // circle fill based on the avg total emissions of the city
        .attr("fill", d => d.children ? nodesColour : colorScale(d.data.emissions_total))
        .attr("fill-opacity", circlesOpacity)
        .attr('stroke', d => d.children ? nodesColour : colorScale(d.data.emissions_total))
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 1)

    // events on the circles 
    nodeCircles.on("mouseenter", function(e, datum) {
      const selectedCircle = d3.select(this)
      // make the circle for this data bigger and fully opaque
      nodeCircles
          .attr("r", d => d == datum? 15 : d.children ? 3 : radiusScale(d.data.emissions_total))
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
        .attr("r", d => d.children ? 3 : radiusScale(d.data.emissions_total))
        .attr("fill-opacity", circlesOpacity)
        .attr("stroke-opacity", 1)
      labels.attr("opacity", 1)
      treeGraph.attr("stroke-opacity", circlesOpacity)
    })

    // On clicking a city node, collect city data to pass on as state 
    // and make graph very transparent
    nodeCircles.on("click", function(e, datum) {
      console.log(datum.data.name)
      if (makeGraphTransparent) {
        g.attr("opacity", 0.05)
        setMakeGraphTransparent(false)
      }
    })
    svg.on("click", function(e, d) {
      if (!makeGraphTransparent) {
        g.attr("opacity", 1)
        setMakeGraphTransparent(true)
      }
    })


    /////////////////////////////////
    ////// Text on the nodes ////////
    /////////////////////////////////
    // 1. Group to contain all the text elements 
    const labelsG = d3.select(gText.current)

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
        //.attr("font-size", d => d.children ? 14 : 10)
        .attr("font-size", 10)
        .attr("font-family", "Fraunces, serif")
        .attr("opacity", 1)
        .attr("pointer-events", "none")
        .attr("pointer", 'default')


    } 
  }, [dataTree, makeGraphTransparent]);


  return (

      <div className="tree-graph-container">
        <svg ref={svgRef} width={widthTree} height={heightTree}>
          <g ref={gRef}>
            <g ref={gTree}></g>
            <g ref={gCircles}></g>
            <g ref={gText}></g>
          </g>
        </svg>

      </div>

  )
};

export default TreeGraph;