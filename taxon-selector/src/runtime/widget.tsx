/** @jsx jsx */
import { AllWidgetProps, jsx, DataSourceComponent, SqlQueryParams, QueriableDataSource, DataSource, MessageManager, DataSourceFilterChangeMessage } from "jimu-core"
import React, { useState, useEffect } from 'react'
import { JimuMapView, JimuMapViewComponent } from 'jimu-arcgis'
import { Select, Option, Button, defaultMessages as jimuUIMessages } from 'jimu-ui'
import { IMConfig } from '../config'

export default function Widget (props: AllWidgetProps<IMConfig>) {
  const [dataSource, setDataSource] = useState(null)
  const [view, setView] = useState(null)
  const [phylumList, setPhylumList] = useState<string[]>([])
  const [classList, setClassList] = useState<string[]>([])
  const [orderList, setOrderList] = useState<string[]>([])
  const [familyList, setFamilyList] = useState<string[]>([])
  const [genusList, setGenusList] = useState<string[]>([])
  const [selectedPhylum, setSelectedPhylum] = useState<string|undefined>()
  const [selectedClass, setSelectedClass] = useState<string|undefined>()
  const [selectedOrder, setSelectedOrder] = useState<string|undefined>()
  const [selectedFamily, setSelectedFamily] = useState<string|undefined>()
  const [selectedGenus, setSelectedGenus] = useState<string|undefined>()
  const featureServiceUrl = 'https://services2.arcgis.com/C8EMgrsFcRFL6LrL/ArcGIS/rest/services/DSCRTP_NatDB_FeatureLayer/FeatureServer/0/query?'
  //TODO read from configuration
  // const serviceUrl = (props.config.serviceUrl) ? props.config.serviceUrl : 'https://services2.arcgis.com/C8EMgrsFcRFL6LrL/ArcGIS/rest/services/DSCRTP_NatDB_FeatureLayer/FeatureServer/0/query?'

  // handle changes to taxon selections. update map and publish new values
  useEffect(() => {
    console.log('inside useEffect watching selected taxon...')
    console.log('phylum: ' + selectedPhylum + '; class: ' + selectedClass + '; order: ' + selectedOrder + '; genus: ' + selectedGenus)
    if (!dataSource || !view) {
      console.warn('DataSource and/or MapView not yet set. QueryParams cannot updated')
      return
    }

    const selectedTaxon = []
    if (selectedPhylum) { selectedTaxon.push(selectedPhylum) }
    if (selectedClass) { selectedTaxon.push(selectedClass) }
    if (selectedFamily) { selectedTaxon.push(selectedFamily) }
    if (selectedOrder) { selectedTaxon.push(selectedOrder) }
    if (selectedGenus) { selectedTaxon.push(selectedGenus) }

    const q = getQuery();
    (dataSource as QueriableDataSource).updateQueryParams(q, props.id)
    sendMessage()
  }, [selectedPhylum, selectedClass, selectedFamily, selectedOrder, selectedGenus])

  // run once when widget is loaded
  useEffect(() => {
    // list of phylums does not change
    updatePhylumList()
  }, [])

  async function getDataFromFeatureService (incomingSearchParams: URLSearchParams) {
    //clone incoming
    const searchParams = new URLSearchParams(incomingSearchParams)
    // params shared be every request
    searchParams.set('returnGeometry', 'false')
    searchParams.set('returnDistinctValues', 'true')
    searchParams.set('f', 'json')
    const response = await fetch(featureServiceUrl, {
      method: 'POST',
      body: searchParams
    })
    //TODO better error handling
    if (!response.ok) {
      console.warn('Error fetching Taxon data from: ' + featureServiceUrl)
      return
    }
    return await response.json()
  }

  async function updatePhylumList () {
    const startTime = new Date()
    const searchParams = new URLSearchParams([
      ['where', '1=1'],
      ['outFields', 'Phylum']
    ])
    const data = await getDataFromFeatureService(searchParams)
    const phylums = data.features.map(feature => feature.attributes.Phylum).map(name => name || 'NA')
    setPhylumList(phylums)
    const endTime = new Date()
    console.debug(`Phylum data loaded from FeatureService in ${(endTime.getTime() - startTime.getTime()) / 1000} seconds`)
  }

  async function updateClassList (phylumName: string) {
    const searchParams = new URLSearchParams([
      ['where', `Phylum='${phylumName}'`],
      ['outFields', 'Class']
    ])
    const data = await getDataFromFeatureService(searchParams)
    const classes = data.features.map(feature => feature.attributes.Class).map(name => name || 'NA')
    setClassList(classes)
  }

  // 'Order' is reserved word in SQL so renamed to 'Order_ in FeatureService'
  async function updateOrderList (className: string) {
    const searchParams = new URLSearchParams([
      ['where', `Class='${className}'`],
      ['outFields', 'Order_']
    ])
    const data = await getDataFromFeatureService(searchParams)
    const orders = data.features.map(feature => feature.attributes.Order_).map(name => name || 'NA')
    setOrderList(orders)
  }

  async function updateFamilyList (orderName: string) {
    const searchParams = new URLSearchParams([
      ['where', `Order_='${orderName}'`],
      ['outFields', 'Family']
    ])
    const data = await getDataFromFeatureService(searchParams)
    const families = data.features.map(feature => feature.attributes.Family).map(name => name || 'NA')
    setFamilyList(families)
  }

  async function updateGenusList (familyName: string) {
    const searchParams = new URLSearchParams([
      ['where', `Family='${familyName}'`],
      ['outFields', 'Genus']
    ])
    const data = await getDataFromFeatureService(searchParams)
    const genera = data.features.map(feature => feature.attributes.Genus).map(name => name || 'NA')
    console.log('genus list: ', genera)
    setGenusList(genera)
  }

  /**
   * construct SQL clause based on taxon selections
   * Note that other filter criteria are managed independently by the Filter widget
   */
  function getQuery (): SqlQueryParams {
    const clauses = []

    // Feature Layer used different column names than map service
    if (selectedPhylum) { clauses.push(`Phylum = '${selectedPhylum}'`) }
    if (selectedClass) { clauses.push(`Class = '${selectedClass}'`) }
    if (selectedFamily) { clauses.push(`Family = '${selectedFamily}'`) }
    // Order is a SQL reserved word
    if (selectedOrder) { clauses.push(`Order_ = '${selectedOrder}'`) }
    if (selectedGenus) { clauses.push(`Genus = '${selectedGenus}'`) }

    if (clauses?.length) {
      return ({ where: clauses.join(' AND ') })
    } else {
      return null
    }
  }

  function resetButtonHandler (evt: React.MouseEvent<HTMLButtonElement>) {
    if (selectedPhylum) { setSelectedPhylum(null) }
    if (selectedClass) { setSelectedClass(null) }
    if (selectedOrder) { setSelectedOrder(null) }
    if (selectedFamily) { setSelectedFamily(null) }
    if (selectedGenus) { setSelectedGenus(null) }
  }

  // changing phylum resets all other Select elements in hierarchy
  function phylumSelectHandler (evt: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedPhylum(evt.target.value)
    updateClassList(evt.target.value)

    // reset dependent values
    setSelectedClass(undefined)
    setSelectedOrder(undefined)
    setSelectedFamily(undefined)
    setSelectedGenus(undefined)
    setOrderList([])
    setFamilyList([])
    setGenusList([])
  }

  function classSelectHandler (evt: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedClass(evt.target.value)
    updateOrderList(evt.target.value)

    // reset dependent values
    setSelectedOrder(undefined)
    setSelectedFamily(undefined)
    setSelectedGenus(undefined)
    setFamilyList([])
    setGenusList([])
  }

  function orderSelectHandler (evt: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedOrder(evt.target.value)
    updateFamilyList(evt.target.value)

    // reset dependent values
    setSelectedFamily(undefined)
    setSelectedGenus(undefined)
    setGenusList([])
  }

  function familySelectHandler (evt: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedFamily(evt.target.value)
    updateGenusList(evt.target.value)

    // reset dependent values
    setSelectedGenus(undefined)
  }

  function genusSelectHandler (evt: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedGenus(evt.target.value)
  }

  // runs once
  function onDataSourceCreated (ds: DataSource) {
    if (ds) {
      const dataSource = ds as QueriableDataSource
      setDataSource(dataSource)
    } else {
      console.error('unable to create DataSource')
    }
  }

  // runs once
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (!jmv) {
      console.warn('no MapView')
      return
    }
    setView(jmv.view)
  }

  function sendMessage () {
    MessageManager.getInstance().publishMessage(new DataSourceFilterChangeMessage(props.id, dataSource.id))
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
        style={{ padding: '10px', width: 200 }}
        disabled={!phylumList.length}
      >
        {phylumList?.map(item => <Option value={item}>{item}</Option>)}
      </Select>

      <Select
        value={selectedClass}
        onChange={classSelectHandler}
        placeholder="Select a Class..."
        style={{ padding: '10px', width: 200 }}
        disabled={!selectedPhylum}
      >
        {classList.map(item => <Option value={item}>{item}</Option>)}
      </Select>

      <Select
        value={selectedOrder}
        onChange={orderSelectHandler}
        placeholder="Select an Order..."
        style={{ paddingLeft: '10px', paddingBottom: '10px', width: 200 }}
        disabled={!selectedClass}
      >
        {orderList.map(item => <Option value={item}>{item}</Option>)}
      </Select>

      <Select
        value={selectedFamily}
        onChange={familySelectHandler}
        placeholder="Select a Family..."
        style={{ paddingLeft: '10px', paddingBottom: '10px', width: 200 }}
        disabled={!selectedOrder}
      >
        {familyList.map(item => <Option value={item}>{item}</Option>)}
      </Select>

      <Select
        value={selectedGenus}
        onChange={genusSelectHandler}
        placeholder="Select a Genus..."
        style={{ paddingLeft: '10px', paddingBottom: '10px', width: 200 }}
        disabled={!selectedFamily}
      >
        {genusList.map(item => <Option value={item}>{item}</Option>)}
      </Select>

      <Button style={{ margin: '10px' }} onClick={resetButtonHandler}>Reset</Button>
    </div>
  )
}
