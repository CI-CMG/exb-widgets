/** @jsx jsx */
import { 
  AllWidgetProps, 
  jsx, 
  DataSourceComponent, 
  SqlQueryParams, 
  QueriableDataSource, 
  DataSource 
} from 'jimu-core'
import defaultMessages from './translations/default'
import { Button, defaultMessages as jimuUIMessages } from 'jimu-ui'
import { useState, useEffect } from 'react';
import { IMConfig } from '../config';

export default function (props: AllWidgetProps<IMConfig>) {
  const [totalRecordCount, setTotalRecordCount] = useState(null)
  const [recordCount, setRecordCount] = useState(null)
  const [dataSource, setDataSource] = useState<QueriableDataSource>()
  const [isUpdating, setIsUpdating] = useState(false)
  const updateCount = props.stateProps?.updateCount
  
  // any change in the props should cause widget to re-render and this useEffect to run
  useEffect(() => {
    if (updateCount) {
      updateRecordCount()
    }  
  },[updateCount])


  // should only fire once, when DataSource is loaded
  useEffect(() => {
    updateRecordCount()
    countAllSamples()
  },[dataSource])


  // runs once
  function onDataSourceCreated(ds: DataSource) {
    if (ds) {
      const dataSource = ds as QueriableDataSource
      setDataSource(dataSource)
    } else {
      console.error('unable to create DataSource')
    }
  }

  async function countAllSamples() {
    if (! dataSource) {
      // can't get the Feature Service URL w/o the DataSource
      return
    }
    const searchParams = new URLSearchParams([
      ['where', '1=1'],
      ['returnCountOnly', 'true'],
      ['f', 'json']
    ])
    const response = await fetch(dataSource.url+'/query', {
        method: 'POST',
        body: searchParams
    });
    if (!response.ok) {
        console.warn("Error fetching data from: " + dataSource.url)
        return
    }
    const json = await response.json();
    setTotalRecordCount(json.count)
  }


  function updateRecordCount() {
    if (isUpdating) {
      // console.log('update already in progress, exiting function')
      return
    }
    setIsUpdating(true)
    // these two seem to always have same result
    const queryParams = dataSource?.getCurrentQueryParams()
    // const runtimeQueryParams = dataSource?.getRuntimeQueryParams()
    dataSource?.loadCount(queryParams, {widgetId: props.id}).then((o)=> {
      setRecordCount(o)
      setIsUpdating(false)
    })
  }


  return( 
    <div className="widget-demo jimu-widget m-2">
      <DataSourceComponent
          useDataSource={props.useDataSources?.[0]}
          widgetId={props.id}
          onDataSourceCreated={onDataSourceCreated}
        />
      Filtered records: <span>{(recordCount && !isUpdating)?recordCount.toLocaleString("en-US") : 'updating...'}</span>
      <span>{(!isUpdating && totalRecordCount)? ' out of ' + totalRecordCount.toLocaleString('en-US'): ''}</span> 
      <br/>
    </div>
  )
}
