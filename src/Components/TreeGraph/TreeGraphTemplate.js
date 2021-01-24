import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import _ from "lodash";
import chroma from "chroma-js";
import "./TreeGraph.css"
import dataLoad from "../../data/flare-2.json";


const TreeGraph = () => {

  /// refs ///
  const svgRef = useRef();
  const gRef = useRef();
  const gTree = useRef();
  const gCircles = useRef();
  const gText = useRef();

  /// states ///
  const [data, setData] = useState(null);

  /// constatns ///
  // dimensions 
  const width = 900;
  const height = 900;
  const radius = width / 2


  /// Data load ///
  useEffect(() => {
    setData(dataLoad)
  }, []);

  /// D3 Code ///
  useEffect(() => {
    if (data) {

      

      const tree = d3.cluster().size([2 * Math.PI, radius - 100])
      const root = tree(d3.hierarchy(data).sort((a, b) => d3.ascending(a.data.name, b.data.name)));

      const svg = d3.select(svgRef.current)
      const g = d3.select(gRef.current).attr("transform", `translate(${width/2}, ${height/2})`)

    /////////////////////////////////
    /// The Circular Tree Shape ///
    /////////////////////////////////
    // 1. Group to contain the tree
    const treeGraphG = d3.select(gTree.current)
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 2)
    
    // 2. Tree itself - a collection of paths
    const treeGraph = treeGraphG
      .selectAll("path")
      .data(root.links())
      .join("path")
        .attr("d", d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y))

    /*
    console.log(root.links())
    treeGraph.on("click", function(e, datum){
      console.log(datum)
      const currentElement = d3.select(this)
      currentElement.attr("stroke", "white")
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
        .attr("fill", d => d.children ? "#555" : "#999")
        .attr("r", 3);

      // events on the circles 
      nodeCircles.on("click", function(e, datum) {
        const selectedCircle = d3.select(this)
        selectedCircle.attr("r", 7)
      })

    /////////////////////////////////
    ////// Text on the nodes ////////
    /////////////////////////////////
    // 1. Group to contain all the text elements 
    const labelsG = d3.select(gText.current)
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)

    // 2. Append text element for each label 
    const labels = labelsG
      .selectAll("text")
      .data(root.descendants())
      .join("text")
        .attr("transform", d => `
          rotate(${d.x * 180 / Math.PI - 90}) 
          translate(${d.y},0) 
          rotate(${d.x >= Math.PI ? 180 : 0})
        `)
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
        .text(d => d.data.name)
        .style("fill", "white")


    } 
  }, [data]);


  return (
    <div>
      <h1>Tree</h1>

      <div>
        <svg ref={svgRef} width={width} height={height}>
          <g ref={gRef}>
            <g ref={gTree}></g>
            <g ref={gCircles}></g>
            <g ref={gText}></g>
          </g>
        </svg>
      </div>

    </div>
  )
};

export default TreeGraph;