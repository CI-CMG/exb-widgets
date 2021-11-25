/** @jsx jsx */
import { AllWidgetProps, jsx, DataSourceComponent, SqlQueryParams, QueriableDataSource, DataSource, MessageManager, DataSourceFilterChangeMessage } from "jimu-core"
import { useState, useEffect } from 'react';
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { Select, Option, Button, defaultMessages as jimuUIMessages } from 'jimu-ui';
import { IMConfig } from '../config';


export default function Widget (props: AllWidgetProps<IMConfig>) {
  const [dataSource, setDataSource] = useState(null)
  const [view, setView] = useState(null)
  const [phylums, setPhylums] = useState(new Map())
  const [orders, setOrders] = useState(new Map())
  const [families, setFamilies] = useState(new Map())
  const [selectedPhylum, setSelectedPhylum] = useState()
  const [selectedOrder, setSelectedOrder] = useState()
  const [selectedFamily, setSelectedFamily] = useState()
  const [selectedGenus, setSelectedGenus] = useState()
  const mapServiceUrl = 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DSCRTP/MapServer/0/query?'

  // handle changes to taxon selections. update map and publish new values
  useEffect(() => {
    if (!dataSource || ! view) {
      console.warn("DataSource and/or MapView not yet set. QueryParams cannot updated")
      return
    }

    let selectedTaxon = []
    if (selectedPhylum) { selectedTaxon.push(selectedPhylum) }
    if (selectedFamily) { selectedTaxon.push(selectedFamily) }
    if (selectedOrder) { selectedTaxon.push(selectedOrder) }
    if (selectedGenus) { selectedTaxon.push(selectedGenus) }

    const q = getQuery();
    (dataSource as QueriableDataSource).updateQueryParams(q, props.id)
    sendMessage()
  }, [selectedPhylum, selectedFamily, selectedOrder, selectedGenus])

  // run once when widget is loaded
  useEffect(() => {
    // getTaxonData()
    getTaxonDataFromFeatureService()

    // one-time cleanup function. remove watches at time componment is destroyed 
    // return function cleanup() {
    //   if (sqlWatch) {
    //     sqlWatch.remove()
    //     sqlWatch = null
    //   }
    // }
  },[])


  async function getTaxonData() {
    const startTime = new Date()
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

    const endTime = new Date()
    console.info(`Taxon data loaded from MapService in ${(endTime.getTime()-startTime.getTime())/1000} seconds`)
  }
    


  async function getTaxonDataFromFeatureService() {
    const startTime = new Date()
    const serviceUrl = (props.config.serviceUrl)? props.config.serviceUrl : 'https://services2.arcgis.com/C8EMgrsFcRFL6LrL/ArcGIS/rest/services/Deep_Sea_Coral_Samples/FeatureServer/0/query?'
    const searchParams = new URLSearchParams([
      ['where', '1=1'],
      ['outFields', 'Phylum,Order_,Family,Genus'],
      ['orderByFields', 'Phylum,Order_,Family,Genus'],
      ['groupByFieldsForStatistics', 'Phylum,Order_,Family,Genus'],
      ['returnGeometry', 'false'],
      ['returnDistinctValues', 'true'],
      ['f', 'json']
    ])
    const response = await fetch(serviceUrl, {
        method: 'POST',
        body: searchParams
    });
    if (!response.ok) {
        console.warn("Error fetching Taxon data from: " + serviceUrl)
        return
    }
    const data = await response.json();
    data.features.forEach(it => {
      if(!it.attributes.Phylum) { it.attributes.Phylum = 'NA'}
      if(!it.attributes.Order_) { it.attributes.Order_ = 'NA'}
      if(!it.attributes.Family) { it.attributes.Family = 'NA'}
      if(!it.attributes.Genus) { it.attributes.Genus = 'NA'}
    })

    // lists of Order values for each phylum
    const phylumMap = new Map()
    const phylumList = Array.from(new Set(data.features.map(it => it.attributes.Phylum)))
    phylumList.forEach((phylum) => {
        const orderList = Array.from(new Set(data.features.filter(it => it.attributes.Phylum === phylum).map(it => it.attributes.Order_)))
        phylumMap.set(phylum, orderList)
    })
    setPhylums(phylumMap)

    // lists of Family values for each Order
    const orderMap = new Map()
    const orderList = Array.from(new Set(data.features.map(it => it.attributes.Order_)))
    orderList.forEach((order) => {
        const familyList = Array.from(new Set(data.features.filter(it => it.attributes.Order_ === order).map(it => it.attributes.Family)))
        orderMap.set(order, familyList)
    })
    setOrders(orderMap)

    // lists of Genus values for each Family
    const familyMap = new Map()
    const familyList = Array.from(new Set(data.features.map(it => it.attributes.Family)))
    familyList.forEach((family) => {
        const genusList = Array.from(new Set(data.features.filter(it => it.attributes.Family === family).map(it => it.attributes.Genus)))
        familyMap.set(family, genusList)
    })
    setFamilies(familyMap)
    const endTime = new Date()
    console.info(`Taxon data loaded from FeatureService in ${(endTime.getTime()-startTime.getTime())/1000} seconds`)
  }


  /**
   * construct SQL clause based on taxon selections
   * Note that other filter criteria are managed independently by the Filter widget
   */
  function getQuery(): SqlQueryParams {
    let clauses = []

    // Feature Layer used different column names than map service
    if (selectedPhylum) { clauses.push(`Phylum = '${selectedPhylum}'`) }
    if (selectedFamily) { clauses.push(`Family = '${selectedFamily}'`) }
    // Order is a SQL reserved word
    if (selectedOrder) { clauses.push(`Order_ = '${selectedOrder}'`) }
    if (selectedGenus) { clauses.push(`Genus = '${selectedGenus}'`) }
    
    if (clauses?.length) {
      return({where: clauses.join(' AND ')})
    } else {
      return null
    }    
  }


  function resetButtonHandler(e) {
    if (selectedPhylum) { setSelectedPhylum(null) }
    if (selectedOrder) { setSelectedOrder(null) }
    if (selectedFamily) { setSelectedFamily(null) }
    if (selectedGenus) { setSelectedGenus(null) }
  }


  function phylumSelectHandler(e) {
    setSelectedPhylum(e.target.value)
  }


  function orderSelectHandler(e) {
    setSelectedOrder(e.target.value)
  }


  function familySelectHandler(e) {
    setSelectedFamily(e.target.value)
  }


  function genusSelectHandler(e) {
    setSelectedGenus(e.target.value)
  }


  // runs once
  function onDataSourceCreated(ds: DataSource) {
    if (ds) {
      const dataSource = ds as QueriableDataSource
      setDataSource(dataSource)
    } else {
      console.error('unable to create DataSource')
    }
  }
  

  function parseSql(sqlString:string) {
    if (sqlString === '(1=1)' || !sqlString) {
      return []
    }
    const regex = /(\([^\()]*\))/g;
    const matches = sqlString.match(regex)
    if (! matches.length) {
      // shouldn't ever happen
      console.error(`string ${sqlString} produced no matches`)
      return
    }
    return(matches)
  }


  // runs once
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (! jmv) {
      console.warn('no MapView')
      return
    }
    setView(jmv.view)
  }


  function sendMessage() {
    MessageManager.getInstance().publishMessage(new DataSourceFilterChangeMessage(props.id, dataSource.id));
  }

  
  return (
    <div className="" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <div>
      <DataSourceComponent
          useDataSource={props.useDataSources?.[0]}
          widgetId={props.id}
          onDataSourceCreated={onDataSourceCreated}
        />
      <JimuMapViewComponent 
        useMapWidgetId={props.useMapWidgetIds?.[0]} 
        onActiveViewChange={activeViewChangeHandler}></JimuMapViewComponent>

    </div>
    <Select
        value={selectedPhylum}
        onChange={phylumSelectHandler}
        placeholder="Select a Phylum..."
        style={{padding: '10px', width: 200}}
        disabled={phylums.size < 1}
      >
      {Array.from(phylums.keys()).map(item => <Option value={item}>{item}</Option>)}
    </Select>

    <Select
        value={selectedOrder}
        onChange={orderSelectHandler}
        placeholder="Select an Order..."
        style={{paddingLeft: '10px',  paddingBottom: '10px', width: 200}}
        disabled={!selectedPhylum}
      >
      {selectedPhylum && phylums.get(selectedPhylum)?.map(item => <Option value={item}>{item}</Option>)}
    </Select>

    <Select
        value={selectedFamily}
        onChange={familySelectHandler}
        placeholder="Select a Family..."
        style={{paddingLeft: '10px',  paddingBottom: '10px', width: 200}}
        disabled={!selectedOrder}
      >
      {selectedOrder && orders.get(selectedOrder)?.map(item => <Option value={item}>{item}</Option>)}
    </Select>

    <Select
        value={selectedGenus}
        onChange={genusSelectHandler}
        placeholder="Select a Genus..."
        style={{paddingLeft: '10px', paddingBottom: '10px', width: 200}}
        disabled={!selectedFamily}
      >
      {selectedFamily && families.get(selectedFamily)?.map(item => <Option value={item}>{item}</Option>)}
    </Select>

    <Button style={{margin: '10px'}} onClick={resetButtonHandler}>Reset</Button>
        
    </div>
  );
}