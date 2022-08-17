/** @jsx jsx */
import {
  AllWidgetProps,
  jsx,
  DataSourceComponent,
  QueriableDataSource,
  DataSource
} from 'jimu-core'
import { useState, useEffect } from 'react'
import { IMConfig } from '../config'

export default function (props: AllWidgetProps<IMConfig>) {
  const [totalRecordCount, setTotalRecordCount] = useState(null)
  const [recordCount, setRecordCount] = useState(null)
  const [dataSource, setDataSource] = useState<QueriableDataSource>()
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateQueued, setUpdateQueued] = useState(false)
  const updateNow = props.stateProps?.updateCount
  console.log('re-rendering. updateNow: ', updateNow)

  // any change in the props should cause widget to re-render and this useEffect to run
  useEffect(() => {
    console.log('datasource-record-count: updateNow changed', updateNow)
    if (updateNow && isUpdating) {
      // console.log('datasource-record-count: update in progress, queuing refresh...')
      setUpdateQueued(true)
      return
    }

    if (updateNow) {
      updateRecordCount()
    }
  }, [updateNow])

  // should only fire twice, once when component mounted and once when DataSource is loaded
  useEffect(() => {
    // no need in proceeding w/o valid DataSource
    if (!dataSource) { return }

    if (!isUpdating) {
      updateRecordCount()
    } else {
      // console.warn('datasource-record-count: update already in progress')
    }
  }, [dataSource])

  useEffect(() => {
    if (!isUpdating && updateQueued) {
      console.log('datasource-record-count: no updates in progress, refreshing count...')
      setUpdateQueued(false)
      updateRecordCount()
    }
  }, [isUpdating])

  // runs once
  function onDataSourceCreated (ds: DataSource) {
    if (ds) {
      const qds = ds as QueriableDataSource
      setDataSource(qds)
      countAllSamples(qds)
    } else {
      console.error('datasource-record-count: no DataSource')
    }
  }

  async function countAllSamples (dataSource: DataSource) {
    if (!dataSource) {
      // TODO better to throw Exception?
      console.error('cannot get the Feature Service URL without the DataSource')
      return
    }
    const searchParams = new URLSearchParams([
      ['where', '1=1'],
      ['returnCountOnly', 'true'],
      ['f', 'json']
    ])
    const response = await fetch(dataSource.url + '/query', {
      method: 'POST',
      body: searchParams
    })
    console.log(response)
    if (!response.ok) {
      console.log('failed to count total records from ' + dataSource.url)
      return
    }
    const json = await response.json()
    setTotalRecordCount(json.count)
  }

  async function updateRecordCount () {
    if (isUpdating) {
      console.warn('datasource-record-count: should not be attempting update while another is still running')
    }
    // console.log('datasource-record-count: count status is ', dataSource?.getCountStatus())
    setIsUpdating(true)

    const queryParams = dataSource?.getCurrentQueryParams()
    const count = await dataSource?.loadCount(queryParams, {widgetId: props.id})
    console.log('datasource-record-count: update complete. Count = '+count)
    setIsUpdating(false)
    setRecordCount(count)
  }

  // console.log('recordCount: ', recordCount)
  // console.log('isUpdating: ', isUpdating)
  return (
    <div className="widget-demo jimu-widget m-2">
      <DataSourceComponent
          useDataSource={props.useDataSources?.[0]}
          widgetId={props.id}
          onDataSourceCreated={onDataSourceCreated}
        />
      Filtered records: <span>{(recordCount != null && !isUpdating) ? recordCount.toLocaleString('en-US') : 'updating...'}</span>
      <span>{(!isUpdating && totalRecordCount) ? ' out of ' + totalRecordCount.toLocaleString('en-US') : ''}</span>
      <br/>
    </div>
  )
}
