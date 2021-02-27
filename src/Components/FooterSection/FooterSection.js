import React from "react";
import "./FooterSection.css";

const Footer = () => {
  return (
    <div className="whole-graph-footer">  
      <p className="whole-graph-methodology">Notes on the Data</p>
        <ul className="notes-list">
          <li>
            The reporting period of the data is not the same for all the countries. Some had data for more than 3 years, and some only 1-2; these years were not always the same for all the cities, making an exact comparison between all cities challenging. However, the majority of the data was for the 5-year period 2013-2017. There are 6 cities with 5 or more years of data, 22 cities with 4 or more years, 67 cities with 3 or more and 144 cities with 2 or more. 
          </li>
          <li>
            A few cities, such as Australia, were categorised in more than one region. When that was the case, only the data for one of the regions was taken; it is possible than by doing so some of the data was omitted. 
          </li>
          <li>
            For the visualisation cities with at least 2 records were selected.
          </li>
        </ul>

      <p className="whole-graph-p">made by  
        <span> Dea Bankova </span>
      </p>
      <p>© 2021</p>
    </div>
  )
};

export default Footer;