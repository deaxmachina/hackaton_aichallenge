import React, { useState, useEffect } from "react";
import "./Complete.css";
import dataLoadCities from "./data/cities_with_2_records.csv"
import dataLoadTree from "./data/data_for_tree_v0.json";
import * as d3 from "d3";
import _ from "lodash";

import TreeAndCity from "./Components/TreeAndCity/TreeAndCity";
import HeroSection from "./Components/HeroSection/HeroSection";
import Footer from "./Components/FooterSection/FooterSection"

const Complete = () => {

  // columns that we will use 
  const yearCol = "Reporting Period"
  const cityCol = "CityName"
  const populationCol = " Population "
  const emissionsPerCapitaCol = "GHG/Capita"
  const emissionsTotalCol = "Total emissions (metric tonnes CO2e)"
  const methodologyCol = "Methodology/Protocol"

  /// states ///
  const [dataCities, setDataCities] = useState(null);
  const [dataTree, setDataTree] = useState(null);
  const [transformedCities, setTransformedCities] = useState(null);
  const [meanEmissionsTotal, setMeanEmissionsTotal] = useState(null);
  const [meanEmissionsPerCapitaTotal, setMeanEmissionsPerCapitaTotal] = useState(null);
  const [cities, setCities] = useState(null);
  const [emissionsType, setEmissionsType] = useState("total emissions") //useState("per capita emissions")

  // Data load ///
  useEffect(() => {
    d3.csv(dataLoadCities, d3.autoType).then(d => {
      
      ///// Data Computations ///
      /// All Data ///
      // max amongst the mean emissions of all the cities   
      const groupedCities = _.groupBy(d, cityCol)
      // transform data into required array of obj format
      const transformedCities = []
      for (const [city, data] of Object.entries(groupedCities)) {
        transformedCities.push({
          city: city,
          meanEmissions: _.meanBy(data, element => element[emissionsTotalCol]),
          meanEmissionsPerCapita: _.meanBy(data, element => element[emissionsPerCapitaCol]),
          data: data
        })
      };

      setTransformedCities(transformedCities)

      const meanEmissionsTotal = d3.max(transformedCities, element => element.meanEmissions)
      setMeanEmissionsTotal(meanEmissionsTotal)

      const meanEmissionsPerCapitaTotal = d3.max(transformedCities, element => element.meanEmissionsPerCapita)
      setMeanEmissionsPerCapitaTotal(meanEmissionsPerCapitaTotal)

      // Extract all cities //
      const cities = _.uniq(_.map(d, cityCol))
      setCities(cities)

      setDataCities(d)

      })

    /// Set the Trees data ///
    setDataTree(dataLoadTree)

  }, []);

  return (
    <div>
      <HeroSection />
      {
        (dataTree) ?
          <TreeAndCity 
            dataTree={dataTree}
            dataCities={dataCities}
            meanEmissionsTotal={meanEmissionsTotal}
            meanEmissionsPerCapitaTotal={meanEmissionsPerCapitaTotal}
            emissionsType={emissionsType}
            cities={cities}
          />
          : null
      }
      <Footer />
    </div>
  )
};

export default Complete;