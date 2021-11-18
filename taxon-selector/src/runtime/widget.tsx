/** @jsx jsx */
import { 
  AllWidgetProps, 
  jsx, 
  IMState, 
  DataSourceComponent, 
  SqlQueryParams, 
  QueriableDataSource, 
  DataSource,
  appActions 
} from "jimu-core";
import { useState, useEffect } from 'react';
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { Select, Option, Button, Label, Radio, defaultMessages as jimuUIMessages } from 'jimu-ui';
import * as Extent from "esri/geometry/Extent";
import { IMConfig } from '../config';

interface ExtraProps {
  sqlString: any
}


export default function Widget (props: AllWidgetProps<IMConfig> & ExtraProps) {
  const [dataSource, setDataSource] = useState(null)
  const [view, setView] = useState()
  const [definitionExpression, setDefinitionExpression] = useState()
  const [phylums, setPhylums] = useState(new Map())
  const [orders, setOrders] = useState(new Map())
  const [families, setFamilies] = useState(new Map())
  const [selectedPhylum, setSelectedPhylum] = useState()
  const [selectedOrder, setSelectedOrder] = useState()
  const [selectedFamily, setSelectedFamily] = useState()
  const [selectedGenus, setSelectedGenus] = useState()
  let sqlWatch
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
  }, [selectedPhylum, selectedFamily, selectedOrder, selectedGenus])

  // run once when widget is loaded
  useEffect(() => {
    getTaxonData()

    // one-time cleanup function. remove watches at time componment is destroyed 
    return function cleanup() {
      if (sqlWatch) {
        sqlWatch.remove()
        sqlWatch = null
      }
    }
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
    // console.log('family is now '+e.target.value)
  }


  function genusSelectHandler(e) {
    setSelectedGenus(e.target.value)
  }


  // runs once
  function onDataSourceCreated(ds: DataSource) {
    if (ds) {
      const dataSource = ds as QueriableDataSource
      setDataSource(dataSource)
      console.log(dataSource)
      console.log(dataSource.getLabel(),dataSource.getInfo())

      // dataSource.updateQueryParams(getQuery(), props.id)
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

    // setup watch to report changes in layer's definitionExpression
    if (!sqlWatch) {
      const layerTitle = dataSource.getLabel()
      const layer = jmv.view.map.layers.find(lyr => lyr.title === layerTitle)
      sqlWatch = layer.watch('definitionExpression', (newExpression, oldExpression) => {
        console.log('taxon-selector: definitionExpression changed from '+oldExpression+' to '+newExpression)
        setDefinitionExpression(newExpression)
      });
    }

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