/** @jsx jsx */
import { AllWidgetProps, jsx, IMState, SqlQueryParams } from "jimu-core";
import { useState, useEffect } from 'react';
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { Label, Radio, defaultMessages as jimuUIMessages } from 'jimu-ui';
import * as Extent from "esri/geometry/Extent";
import { IMConfig } from '../config';

interface ExtraProps {
  sqlString: any
}


export default function Widget (props: AllWidgetProps<IMConfig> & ExtraProps) {
  const [extent, setExtent] = useState()
  // const [view, setView] = useState()
  const [whereClause, setWhereClause] = useState('1=1')
  const [isStationary, setIsStationary] = useState(true)
  const [sampleCount, setSampleCount] = useState('')
  const [stats, setStats] = useState([])
  const [summaryField, setSummaryField] = useState('VERNACULARNAMECATEGORY')
  const [isProcessing, setIsProcessing] = useState(true)
  let stationaryWatch
  let extentWatch
  const featureServiceUrl = 'https://services2.arcgis.com/C8EMgrsFcRFL6LrL/arcgis/rest/services/Deep Sea Corals Feature Layer/FeatureServer/0/query'
  const mapServiceUrl = 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DSCRTP/MapServer/0/query?'


  async function countSamples(extent:Extent) {
    const searchParams = new URLSearchParams([
      ['where', whereClause],
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
      ['where', whereClause],
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
    setIsProcessing(false)
  }


  async function statisticsByScientificName(extent:Extent, fieldname='SCIENTIFICNAME') {  
    const outStatistics = `[{"statisticType":"count","onStatisticField":"OBJECTID","outStatisticFieldName":"Count"}]`
    const searchParams = new URLSearchParams([
      ['where', whereClause],
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
    const stats = json.features.map(item => [item.attributes.SCIENTIFICNAME, item.attributes.Count])
    // sort by count, descending
    stats.sort((a, b) => b[1] - a[1])
    setStats(stats)
    setIsProcessing(false)
  }


  async function statisticsByTaxon(extent:Extent) {  
    const outStatistics = `[{"statisticType":"count","onStatisticField":"OBJECTID","outStatisticFieldName":"Count"}]`
    const searchParams = new URLSearchParams([
      ['where', whereClause],
      ['geometry', JSON.stringify(extent)],
      ['geometryType', 'esriGeometryEnvelope'],
      ['spatialRel', 'esriSpatialRelIntersects'],
      ['returnGeometry', 'false'],
      ['groupByFieldsForStatistics', "TAXONPHYLUM,TAXONORDER,TAXONFAMILY"],
      ['outStatistics', outStatistics],
      ['f', 'json']
    ])
    // MapService contains TAXON fields but hosted Feature Layer does not
    const response = await fetch(mapServiceUrl, {
        method: 'POST',
        body: searchParams
    });
    if (!response.ok) {
        console.warn("Error fetching data from: " + mapServiceUrl)
        return
    }
    const json = await response.json();
    const stats = json.features.map(item => [
      [ item.attributes.TAXONPHYLUM, 
        item.attributes.TAXONORDER=='NA'?'':item.attributes.TAXONORDER, 
        item.attributes.TAXONFAMILY=='NA'?'':item.attributes.TAXONFAMILY
      ].join(' '), 
      item.attributes.Count
    ])
    // sort by count, descending
    stats.sort((a, b) => b[1] - a[1])
    setStats(stats)
    setIsProcessing(false)
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


  function getQuery(): SqlQueryParams {
    if (props.sqlString) {
      return {
        where: props.sqlString
      }
    }
    // TODO use undefined instead?
    return {where: '(1=1)'}
  }


  // runs with each re-render
  useEffect(() => {
    setWhereClause(getQuery().where)
  })


  // TODO could separate out total sample count into a separate useEffect 
  // block since it doesn't need to update with radio button change
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
    setIsProcessing(true)

    countSamples(extent)
    if (summaryField == 'VERNACULARNAMECATEGORY') {
      sampleStatistics(extent)
    } else if (summaryField == 'TAXON') {
      statisticsByTaxon(extent)
    } else if (summaryField == 'SCIENTIFICNAME') {
      statisticsByScientificName(extent)
    }
  }, [extent, isStationary, summaryField, whereClause])


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


  function onRadioButtonChange(e) {
    setSummaryField(e.target.value)
  }


  return (
    <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <JimuMapViewComponent 
        useMapWidgetId={props.useMapWidgetIds?.[0]} 
        onActiveViewChange={activeViewChangeHandler}></JimuMapViewComponent>
      <div style={{paddingLeft: '5px'}}>Number of Samples: {sampleCount}</div>
      <br/>
      <div style={{paddingLeft: '5px'}}>
          <Label style={{ cursor: 'pointer' }}>
            <Radio
              style={{ cursor: 'pointer' }} value='VERNACULARNAMECATEGORY' checked={summaryField === 'VERNACULARNAMECATEGORY'} onChange={onRadioButtonChange}
            /> Category
          </Label>
          <Label style={{ cursor: 'pointer', paddingLeft: '20px' }}>
            <Radio
              style={{ cursor: 'pointer' }} value='SCIENTIFICNAME' checked={summaryField === 'SCIENTIFICNAME'} onChange={onRadioButtonChange}
            /> Scientific Name
          </Label>
          <Label style={{ cursor: 'pointer', paddingLeft: '20px' }}>
            <Radio
              style={{ cursor: 'pointer' }} value='TAXON' checked={summaryField === 'TAXON'} onChange={onRadioButtonChange}
            /> Taxon
          </Label>

      </div>
      <div style={{overflowY: 'auto', height: '100%', paddingLeft: '5px'}}>
        <span style={{display: (isProcessing? 'inline': 'none')}}>processing...</span>
        <table style={{visibility: (isProcessing? 'hidden': 'visible')}}>
          <thead><th>Name</th><th>Count</th></thead>
          <tbody>
            {stats.map(row => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// this runs a lot, even when widget is not re-rendered
Widget.mapExtraStateProps = (state: IMState, ownProps: AllWidgetProps<IMConfig>): ExtraProps => {
  let wId: string;
  for (const [key, value] of Object.entries(state.widgetsState)) {
    // console.log(`widget ${key}: ` , value)
    if(value['sqlString']){
      wId = key;
    }
  }
  return {
    sqlString: state.widgetsState[wId]?.sqlString
  }
}