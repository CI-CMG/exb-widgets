/** @jsx jsx */
import { AllWidgetProps, jsx } from "jimu-core";
import { useState, useEffect } from 'react';
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import * as Extent from "esri/geometry/Extent";


//TODO used named export
export default function (props: AllWidgetProps<{}>) {
  const [extent, setExtent] = useState()
  // const [view, setView] = useState()
  const [isStationary, setIsStationary] = useState(true)
  const [sampleCount, setSampleCount] = useState('')
  const [stats, setStats] = useState([])
  let stationaryWatch
  let extentWatch
  const featureServiceUrl = 'https://services2.arcgis.com/C8EMgrsFcRFL6LrL/arcgis/rest/services/Deep Sea Corals Feature Layer/FeatureServer/0/query'


  async function countSamples(extent:Extent) {
    const searchParams = new URLSearchParams([
      ['where', '1=1'],
      ['geometry', JSON.stringify(extent)],
      ['geometryType', 'esriGeometryEnvelope'],
      ['spatialRel', 'esriSpatialRelIntersects'],
      ['returnGeometry', 'false'],
      ['returnCountOnly', 'true'],
      ['f', 'json']
    ])
    const response = await fetch(featureServiceUrl, {
        method: 'POST',
        body: searchParams
    });
    if (!response.ok) {
        console.warn("Error fetching data from: " + featureServiceUrl)
        return
    }
    const json = await response.json();
    setSampleCount(json.count)
  }


  async function sampleStatistics(extent:Extent, fieldname='VERNACULARNAMECATEGORY') {  
    const outStatistics = `[{"statisticType":"count","onStatisticField":"${fieldname}","outStatisticFieldName":"Count"}]`
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
    const response = await fetch(featureServiceUrl, {
        method: 'POST',
        body: searchParams
    });
    if (!response.ok) {
        console.warn("Error fetching data from: " + featureServiceUrl)
        return
    }
    const json = await response.json();
    const stats = json.features.map(item => [item.attributes.VERNACULARNAMECATEGORY, item.attributes.Count])
    // sort by count, descending
    stats.sort((a, b) => b[1] - a[1])
    setStats(stats)
  }


  async function statisticsByTaxon(extent:Extent) {  
    const outStatistics = `[{"statisticType":"count","onStatisticField":"OBJECTID","outStatisticFieldName":"Count"}]`
    const searchParams = new URLSearchParams([
      ['where', '1=1'],
      ['geometry', JSON.stringify(extent)],
      ['geometryType', 'esriGeometryEnvelope'],
      ['spatialRel', 'esriSpatialRelIntersects'],
      ['returnGeometry', 'false'],
      ['groupByFieldsForStatistics', "TAXONPHYLUM,TAXONORDER,TAXONFAMILY"],
      ['outStatistics', outStatistics],
      ['f', 'json']
    ])
    const response = await fetch(featureServiceUrl, {
        method: 'POST',
        body: searchParams
    });
    if (!response.ok) {
        console.warn("Error fetching data from: " + featureServiceUrl)
        return
    }
    const json = await response.json();
    const stats = json.features.map(item => [item.attributes.TAXONPHYLUM, item.attributes.TAXONORDER, item.attributes.TAXONFAMILY, item.attributes.Count])
    // sort by count, descending
    stats.sort((a, b) => b[3] - a[3])
    setStats(stats)
  }

  // fires only once, when widget initially opened
  useEffect(() => {

    // one-time cleanup function
    return function cleanup() {
      // remove at time componment is destroyed 
      if (extentWatch) {
        extentWatch.remove()
        extentWatch = null
      }
      if (stationaryWatch) {
        stationaryWatch.remove()
        stationaryWatch = null
      }
    }
  }, [])


  useEffect(() => {
    if (!extent) {
      // no need to proceed w/o extent
      return
    }
    if (! isStationary) {
      // view being updated
      return
    }

    // erase previously displayed data while counts are being made
    setSampleCount('updating...')
    setStats([])

    countSamples(extent)
    sampleStatistics(extent)
  }, [extent, isStationary])


  // only called when widget first opened
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (! jmv) {
      console.warn('no mapview')
      return
    }
    // setView(jmv.view)

    if (!extent) {
      // setting initial extent...
      setExtent(jmv.view.extent)
    }
    if (!extentWatch) {
      extentWatch = jmv.view.watch('extent', (extent, oldExtent) => {
        // not sure why this happens
        if (extent.equals(oldExtent)) {
          // new extent same as old extent, no action taken
          return
        }
        setExtent(extent)
      });
    };

    // setup Accessor-based watches.  Subscriptions cleaned up via useEffect
    if (!stationaryWatch) {
      stationaryWatch = jmv.view.watch('stationary', stationary => {
        setIsStationary(stationary)
      });
    }
  };


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