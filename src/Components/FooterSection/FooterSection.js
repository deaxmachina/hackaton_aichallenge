import React from "react";
import "./FooterSection.css";

const Footer = () => {
  return (
    <div className="whole-graph-footer">  
      <p className="whole-graph-methodology">Notes on the data</p>
        <ul className="notes-list">
          <li>
            The reporting period of the data is not the same for all the cities. Some had data for more than 3 years, and some only 1-2; these years were not always the same for all the cities, making an exact comparison between all cities challenging. However, the majority of the data was for the 5-year period 2013-2017. There are 6 cities with 5 or more years of data, 22 cities with 4 or more years, 67 cities with 3 or more and 144 cities with 2 or more. 
          </li>
          <li>
            A few countries, such as Australia, were categorised in more than one region. When that was the case, only the data for one of the regions was taken; it is possible than by doing so some of the data was omitted. 
          </li>
          <li>
            For the visualisation cities with at least 2 records were selected.
          </li>
        </ul>

      <p className="whole-graph-disclaimer">
        Disclaimer! There are bound to be bugs and mistakes in the data for this visualisation. The current version is a very quick hackathon prototype and neither the data cleaning process nor the code have been reviewed. "CO2/carbon emissions" might include other emissions as well. I am not a domain expert. Please view this as a proof of concept.
        <br></br>
        * Best viewed on a laptop/desktop screen.
        <br></br>
        Co2 icon at the top by Jino from NounProject.com
      </p>



      <p className="whole-graph-p">made by <a href='https://twitter.com/DeaBankova'>Dea Bankova</a> in 2021</p>
    </div>
  )
};

export default Footer;