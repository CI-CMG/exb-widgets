/** @jsx jsx */
import { AllWidgetProps, jsx, IMState, SqlQueryParams } from "jimu-core";
import { useState, useEffect } from 'react';
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { Select, Option, Button, Label, Radio, defaultMessages as jimuUIMessages } from 'jimu-ui';
import * as Extent from "esri/geometry/Extent";
import { IMConfig } from '../config';

interface ExtraProps {
  sqlString: any
}


export default function Widget (props: AllWidgetProps<IMConfig> & ExtraProps) {
  const [phylums, setPhylums] = useState(new Map())
  const [orders, setOrders] = useState(new Map())
  const [families, setFamilies] = useState(new Map())
  const [selectedPhylum, setSelectedPhylum] = useState()
  const [selectedOrder, setSelectedOrder] = useState()
  const [selectedFamily, setSelectedFamily] = useState()
  const [selectedGenus, setSelectedGenus] = useState()


  const [whereClause, setWhereClause] = useState('1=1')
  const mapServiceUrl = 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DSCRTP/MapServer/0/query?'

  const [urls, setUrls] = useState([])

  
  // run once when widget is loaded
  useEffect(() => {
    getTaxonData()
  },[])


  async function getTaxonData() {
    const searchParams = new URLSearchParams([
      ['where', '1=1'],
      ['outFields', 'TAXONPHYLUM,TAXONORDER,TAXONFAMILY,TAXONGENUS'],
      ['orderByFields', 'TAXONPHYLUM,TAXONORDER,TAXONFAMILY,TAXONGENUS'],
      ['groupByFieldsForStatistics', 'TAXONPHYLUM,TAXONORDER,TAXONFAMILY,TAXONGENUS'],
      ['returnGeometry', 'false'],
      ['returnDistinctValues', 'true'],
      ['f', 'json']
    ])
    // TAXON are only included in on-prem map service
    const response = await fetch(mapServiceUrl, {
        method: 'POST',
        body: searchParams
    });
    if (!response.ok) {
        console.warn("Error fetching Taxon data from: " + mapServiceUrl)
        return
    }
    const data = await response.json();

    // lists of Order values for each phylum
    const phylumMap = new Map()
    const phylumList = Array.from(new Set(data.features.map(it => it.attributes.TAXONPHYLUM)))
    phylumList.forEach((phylum) => {
        const orderList = Array.from(new Set(data.features.filter(it => it.attributes.TAXONPHYLUM === phylum).map(it => it.attributes.TAXONORDER)))
        phylumMap.set(phylum, orderList)
    })
    setPhylums(phylumMap)

    // lists of Family values for each Order
    const orderMap = new Map()
    const orderList = Array.from(new Set(data.features.map(it => it.attributes.TAXONORDER)))
    orderList.forEach((order) => {
        const familyList = Array.from(new Set(data.features.filter(it => it.attributes.TAXONORDER === order).map(it => it.attributes.TAXONFAMILY)))
        orderMap.set(order, familyList)
    })
    setOrders(orderMap)

    // lists of Genus values for each Family
    const familyMap = new Map()
    const familyList = Array.from(new Set(data.features.map(it => it.attributes.TAXONFAMILY)))
    familyList.forEach((family) => {
        const genusList = Array.from(new Set(data.features.filter(it => it.attributes.TAXONFAMILY === family).map(it => it.attributes.TAXONGENUS)))
        familyMap.set(family, genusList)
    })
    setFamilies(familyMap)

    console.info('Taxon data loaded')
  }
    

  function getQuery(): SqlQueryParams {
    // TODO add any taxon selection to other query
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
    // TODO apply SQL constraint to map view
    console.log(getQuery())
    setWhereClause(getQuery().where)
  })

  // only called when widget first opened
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (! jmv) {
      console.warn('no mapview')
      return
    }
    // setView(jmv.view)
  };


  function resetButtonHandler(e) {
    console.log('reset selects to default value')
    setSelectedPhylum(null)
    setSelectedOrder(null)
    setSelectedFamily(null)
    setSelectedGenus(null)
  }


  function phylumSelectHandler(e) {
    setSelectedPhylum(e.target.value)
    // setting of state value is async so use event value
    console.log('phylum is now '+e.target.value)
  }


  function orderSelectHandler(e) {
    setSelectedOrder(e.target.value)
    console.log('order is now '+e.target.value)

  }

  function familySelectHandler(e) {
    setSelectedFamily(e.target.value)
    console.log('family is now '+e.target.value)
  }

  function genusSelectHandler(e) {
    setSelectedGenus(e.target.value)
    console.log('genus is now '+e.target.value)
  }

  
  return (
    <div className="" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    <Select
        defaultValue={{}}
        value={selectedPhylum}
        onChange={phylumSelectHandler}
        placeholder="Select a Phylum..."
        style={{width: 200}}
        disabled={phylums.size < 1}
      >
      {Array.from(phylums.keys()).map(item => <Option value={item}>{item}</Option>)}
    </Select>

    <Select
        defaultValue={{}}
        value={selectedOrder}
        onChange={orderSelectHandler}
        placeholder="Select an Order..."
        style={{width: 200}}
        disabled={!selectedPhylum}
      >
      {selectedPhylum && phylums.get(selectedPhylum)?.map(item => <Option value={item}>{item}</Option>)}
    </Select>

    <Select
        defaultValue={{}}
        value={selectedFamily}
        onChange={familySelectHandler}
        placeholder="Select a Family..."
        style={{width: 200}}
        disabled={!selectedOrder}
      >
      {selectedOrder && orders.get(selectedOrder)?.map(item => <Option value={item}>{item}</Option>)}
    </Select>

    <Select
        defaultValue={{}}
        value={selectedGenus}
        onChange={genusSelectHandler}
        placeholder="Select a Genus..."
        style={{width: 200}}
        disabled={!selectedFamily}
      >
      {selectedFamily && families.get(selectedFamily)?.map(item => <Option value={item}>{item}</Option>)}
    </Select>

    <Button onClick={resetButtonHandler}>Reset</Button>
        
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