import React, { useState, useEffect } from "react";
import "./App.css";
import CityCircles from "./Components/CityCircles/CityCircles";
import TreeGraph from "./Components/TreeGraph/TreeGraph";
import dataLoad from "./data/cities_with_2_records.csv"
import * as d3 from "d3";
import _ from "lodash";

const App = () => {

  // columns that we will use 
  const yearCol = "Reporting Period"
  const cityCol = "CityName"
  const populationCol = " Population "
  const emissionsPerCapitaCol = "GHG/Capita"
  const emissionsTotalCol = "Total emissions (metric tonnes CO2e)"
  const methodologyCol = "Methodology/Protocol"

  /// states ///
  const [data, setData] = useState(null);
  const [transformedCities, setTransformedCities] = useState(null);
  const [meanEmissionsTotal, setMeanEmissionsTotal] = useState(null);
  const [meanEmissionsPerCapitaTotal, setMeanEmissionsPerCapitaTotal] = useState(null);
  const [cities, setCities] = useState(null);
  const [emissionsType, setEmissionsType] = useState("total emissions") //useState("per capita emissions")

  // Data load ///
  useEffect(() => {
    d3.csv(dataLoad, d3.autoType).then(d => {
      
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

      setData(d)

      })

  }, []);

  return (
    <>
      <div className="overall-title-background">
        <h1 className="overall-title">Reducing CO2 Challenge</h1>
      </div>


    {
      (data && meanEmissionsTotal && meanEmissionsPerCapitaTotal && cities) ?
        <TreeGraph 
          data={data}
          meanEmissionsTotal={meanEmissionsTotal}
          meanEmissionsPerCapitaTotal={meanEmissionsPerCapitaTotal}
          city="New York City"
          emissionsType={emissionsType}
          innerRadius={120}
          outerRadius={350}
          width={800}
          height={800}
        />
        : null
    }

      {
        (data && meanEmissionsTotal && meanEmissionsPerCapitaTotal && cities) ?
          <div className="city-chart-container">
              <CityCircles 
                data={data}
                meanEmissionsTotal={meanEmissionsTotal}
                meanEmissionsPerCapitaTotal={meanEmissionsPerCapitaTotal}
                city="New York City"
                emissionsType={emissionsType}
                innerRadius={120}
                outerRadius={350}
                width={800}
                height={800}
              />
          </div>
        : null
      }


      {/*
      {
        (data && meanEmissionsTotal && meanEmissionsPerCapitaTotal && cities) ?
        <div className="whole-chart-container">
          {
            cities.map(city => (
              <CompleteChart 
                data={data}
                meanEmissionsTotal={meanEmissionsTotal}
                meanEmissionsPerCapitaTotal={meanEmissionsPerCapitaTotal}
                city={city}
                emissionsType={emissionsType}
                innerRadius={90}
                outerRadius={200}
                width={450}
                height={450}
              />
            ))
          }
        </div>
        : null
      }
       */}


    </>
  )
};

export default App;