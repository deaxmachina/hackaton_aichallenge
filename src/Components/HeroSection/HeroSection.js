import React from "react";
import "./HeroSection.css";

// name of the hackathon
const hackathonName = "Climate Crisis AI Hackathon"
// link to the hackathon itself 
const hackathonLink = "https://climate-crisis.devpost.com/?ref_content=default&ref_feature=challenge&ref_medium=discover"
// name of the org running the hackathon 
const hackathonOrg = "AI Launch Lab"
// link to the org running the hackathon
const hackathonOrgLink = "https://launchlab.ai/"

// name of the org that set the hackathon challenge 
const nameOfOrg = "The Climate Reality Project Canada"
// name of the challenge description 
const challengeName = " Reducing CO2 in cities challenge"
// link to the challenge description 
const challengeDescriptionLink = "https://drive.google.com/file/d/1mZBAqlsNLVGj1qGAbAthNj2YMgGwkPNh/view"
// description of the dataset - copy pasted from the project description 
const carbonDisclosureProjectLink = "https://www.cdp.net/en/"
const excelSheetWithDataLink = "https://drive.google.com/file/d/16uWl99pHq21mp4m-dWiA0VrqyCDlKPlS/view"
const datasetDescription = " The global data set used for this challenge was assembled by the Carbon Disclosure Project and includes municipal greenhouse gas emissions data submitted to the CDP between 2016 and 2020 and covering yearsranging from 1990-2019. This excel workbook includes both the CDP’s raw data"




const HeroSection = () => {
  return (
    <div id="hero">
      <div className='emissions-img'></div>
      <h1 className="whole-graph-title">CO2 emissions in cities</h1>
      <div className="whole-graph-subtitle">
        <span className="challenge-name">{challengeName}</span> for {nameOfOrg}
        <br></br>
        Project submission as part of 
        <a href={hackathonLink} target="_blank"> {hackathonName} </a> by 
        <a href={hackathonOrgLink} target="_blank"> {hackathonOrg}</a>
      </div>

      <div className="separator"></div>

      <div className="whole-graph-project-description">
        <span className="bold-bit">Dataset description: </span>
        <span className="dataset-description">
          "The global data set used for this challenge was assembled by the 
            <a href={carbonDisclosureProjectLink} target="_blank"> Carbon Disclosure Project </a>
          and includes municipal greenhouse gas emissions data submitted to the CDP between 2016 and 2020 and covering years ranging from 1990-2019. 
            <a href={excelSheetWithDataLink} target="_blank"> This excel workbook  </a>
          includes the CDP’s raw data [...] (used in this challenge)."
        </span>
        <br></br>
        <span className="bold-bit">Full project description: </span> 
        <a href={challengeDescriptionLink} target="_blank"> here </a> 
      </div>

      <div className="separator"></div>

      <div className="whole-graph-instructions">
        <p className="whole-graph-instructions-title">How to read & interact with this viz</p>
        <ul className="whole-graph-instructions-list">
          <li><span>
            Circles of the nodes of the graph have a radius and colour corresponding to the mean CO2 emissions of the city across all years where it appears in the dataset. Bigger = more avg emissions.
          </span></li>
          <br/>
          <li><span>
            Click on each circle to reveal information about the city in a separate visualisation. Note that these are not available for the greyed-out cities due to insufficient data. 
          </span></li>
          <br/>
          <li><span>
            The visualisation for each city contains information about the avg carbon emissions of the city (radius of the surrounding circle), as well as emissions trends over time. Click on each year's point for more information, including methodology.
          </span></li>  
        </ul>
      </div>  



    </div>

  )
}

export default HeroSection;