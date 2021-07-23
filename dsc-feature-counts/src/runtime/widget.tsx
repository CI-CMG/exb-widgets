/** @jsx jsx */
import { AllWidgetProps, jsx } from "jimu-core";
import { useState, useEffect } from 'react';
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import * as Extent from "esri/geometry/Extent";


//TODO used named export
export default function (props: AllWidgetProps<{}>) {
  const [extent, setExtent] = useState()
  // const [view, setView] = useState()
  const [isAnimating, setIsAnimating] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [sampleCount, setSampleCount] = useState()
  const [stats, setStats] = useState([])
  let extentWatch
  let animationWatch
  let interactingWatch
  let navigatingWatch
  const featureServiceUrl = 'https://services2.arcgis.com/C8EMgrsFcRFL6LrL/arcgis/rest/services/Deep Sea Corals Feature Layer/FeatureServer/0/query'


  async function countSamples(extent:Extent) {
    const searchParams = new URLSearchParams([
      ['where', '1=1'],
      ['geometry', JSON.stringify(extent)],
      // ['geometry', '{"spatialReference":{"latestWkid":3857,"wkid":102100},"xmin":-9537248.222581755,"ymin":2411063.266354613,"xmax":-7382335.5211666385,"ymax":3487296.624609608}'],
      ['geometryType', 'esriGeometryEnvelope'],
      ['spatialRel', 'esriSpatialRelIntersects'],
      ['returnGeometry', 'false'],
      ['returnCountOnly', 'true'],
      ['f', 'json']
    ])
    // const url = 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DSCRTP/MapServer/0/query'
    const response = await fetch(featureServiceUrl, {
        method: 'POST',
        body: searchParams
    });
    if (!response.ok) {
        console.warn("Error fetching data from: " + url)
        return
    }
    const json = await response.json();
    // console.debug(json)
    setSampleCount(json.count)
  }


  async function sampleStatistics(extent:Extent, fieldname='VERNACULARNAMECATEGORY') {
  
    const outStatistics = `[{"statisticType":"count","onStatisticField":"${fieldname}","outStatisticFieldName":"Count"}]`
    console.log(outStatistics)

    const searchParams = new URLSearchParams([
      ['where', '1=1'],
      ['geometry', JSON.stringify(extent)],
      // ['geometry', '{"spatialReference":{"latestWkid":3857,"wkid":102100},"xmin":-9537248.222581755,"ymin":2411063.266354613,"xmax":-7382335.5211666385,"ymax":3487296.624609608}'],
      ['geometryType', 'esriGeometryEnvelope'],
      ['spatialRel', 'esriSpatialRelIntersects'],
      ['returnGeometry', 'false'],
      ['groupByFieldsForStatistics', fieldname],
      ['outStatistics', outStatistics],
      ['f', 'json']
    ])
    // const url = 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DSCRTP/MapServer/0/query'
    const response = await fetch(featureServiceUrl, {
        method: 'POST',
        body: searchParams
    });
    if (!response.ok) {
        console.warn("Error fetching data from: " + url)
        return
    }
    const json = await response.json();
    const stats = json.features.map(item => [item.attributes.VERNACULARNAMECATEGORY, item.attributes.Count])
    // sort by count, descending
    stats.sort((a, b) => b[1] - a[1])
    console.debug(stats)
    setStats(stats)
  }


  async function statisticsByTaxon(extent:Extent) {
  
    const outStatistics = `[{"statisticType":"count","onStatisticField":"OBJECTID","outStatisticFieldName":"Count"}]`
    console.log(outStatistics)

    const searchParams = new URLSearchParams([
      ['where', '1=1'],
      ['geometry', JSON.stringify(extent)],
      // ['geometry', '{"spatialReference":{"latestWkid":3857,"wkid":102100},"xmin":-9537248.222581755,"ymin":2411063.266354613,"xmax":-7382335.5211666385,"ymax":3487296.624609608}'],
      ['geometryType', 'esriGeometryEnvelope'],
      ['spatialRel', 'esriSpatialRelIntersects'],
      ['returnGeometry', 'false'],
      ['groupByFieldsForStatistics', "TAXONPHYLUM,TAXONORDER,TAXONFAMILY"],
      ['outStatistics', outStatistics],
      ['f', 'json']
    ])
    console.log(searchParams.toString())
    // const url = 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DSCRTP/MapServer/0/query'
    // hosted feature service
    const url = 'https://services2.arcgis.com/C8EMgrsFcRFL6LrL/arcgis/rest/services/Deep Sea Corals Feature Layer/FeatureServer/0/query'
    const response = await fetch(url, {
        method: 'POST',
        body: searchParams
    });
    if (!response.ok) {
        console.warn("Error fetching data from: " + url)
        return
    }
    const json = await response.json();
    const stats = json.features.map(item => [item.attributes.TAXONPHYLUM, item.attributes.TAXONORDER, item.attributes.TAXONFAMILY, item.attributes.Count])
    // sort by count, descending
    stats.sort((a, b) => b[3] - a[3])
    console.debug(stats)
    setStats(stats)
  }

  // fires only once, when widget initially opened
  useEffect(() => {
    // console.log('inside useEffect for one-time setup...')

    return function cleanup() {
      // console.log('inside one-time cleanup function...')
      // remove at time componment is destroyed 
      if (extentWatch) {
        extentWatch.remove()
        extentWatch = null
      }
      if (interactingWatch) {
        interactingWatch.remove()
        interactingWatch = null
      }
      if (navigatingWatch) {
        navigatingWatch.remove()
        navigatingWatch = null
      }
      if (animationWatch) {
        animationWatch.remove()
        animationWatch = null
      }
    }
  }, [])

  useEffect(() => {
    if (!extent) {
      // console.log('no extent')
      return
    }
    // console.log('extent updated')
    if (isAnimating || isInteracting || isNavigating) {
      // console.log('view being updated, no action taken...')
      return
    }

    //TODO why is this running twice w/ same extent? 
    // console.log('updating statistics...')
    countSamples(extent)
    sampleStatistics(extent)
    // console.log(JSON.stringify(extent))
  }, [extent, isAnimating, isInteracting, isNavigating])


  // only called when widget first opened
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    // console.log('inside activeViewChangeHandler...')
    if (! jmv) {
      console.warn('no mapview')
      return
    }
    // setView(jmv.view)

    if (!extent) {
      // console.log('setting initial extent...')
      setExtent(jmv.view.extent)
    }
    if (!extentWatch) {
      extentWatch = jmv.view.watch('extent', (extent, oldExtent) => {
        // not sure why this happens
        if (extent.equals(oldExtent)) {
          // console.warn('new extent same as old extent, no action taken')
          return
        }
        // warning this fires many times even for single zoom
        // console.log('setting new extent...')
        setExtent(extent)
      });
    };

    // setup Accessor-based watches.  Subscriptions cleaned up via useEffect
    if (!animationWatch) {
      animationWatch = jmv.view.watch("animation", function(response) {
        if (response && response.state === "running") {
          setIsAnimating(true)
        } else{
          setIsAnimating(false)
        }
      });
    }

    if (!interactingWatch) {
      interactingWatch = jmv.view.watch('interacting', interacting => {
        setIsInteracting(interacting)
      });
    };

    if (!navigatingWatch) {
      navigatingWatch = jmv.view.watch('navigating', navigating => {
        setIsNavigating(navigating)
      });
    };
  };


  console.log(stats.length)
  stats.forEach((row) => {
    console.log(row[0], row[1])
  })


  return (
    <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <JimuMapViewComponent 
        useMapWidgetId={props.useMapWidgetIds?.[0]} 
        onActiveViewChange={activeViewChangeHandler}></JimuMapViewComponent>
      <div>Number of Samples: {sampleCount}</div>
      <br/>
      <div style={{overflowY: 'auto', height: '100%'}}>
        <table>
          <thead><th>Name</th><th>Count</th></thead>
          <tbody>
            {stats.map(row => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}