/** @jsx jsx */
import {
  React,
  AllWidgetProps,
  jsx,
  QueriableDataSource,
  DataSourceComponent,
  SqlQueryParams,
  MessageManager,
  DataSourceFilterChangeMessage
} from 'jimu-core'
import { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import { IMConfig } from '../config'
// replace w/ reading from external URL
import { SCIENTIFIC_NAMES } from '../../scientific_names'

/**
 * construct SQL clause based on name selection
  * Note that other filter criteria are managed independently by the Filter widget
  */
function getQuery (selectedName): SqlQueryParams {
  if (selectedName) {
    return ({ where: `ScientificName = '${selectedName}'` })
  } else {
    return null
  }
}

export default function (props: AllWidgetProps<IMConfig>) {
  console.log('inside scientific_names_autocomplete with ', props)
  const [names, setNames] = useState(SCIENTIFIC_NAMES)
  const [selectedName, setSelectedName] = useState<string|null>(null)
  const [dataSource, setDataSource] = useState<QueriableDataSource|null>(null)

  // useEffect(() => {
  //   // one time setup
  //   fetch(props.config.menuItemsConfigUrl)
  //     .then(response => response.json())
  //     .then(data => setNames(data))
  // }, [])

  // if (names.length > 0) {
  //   console.log(`${names.length} unique scientific names loaded`)
  // }

  useEffect(() => {
    if (!dataSource) {
      // cannot update queryParams w/o DataSource
      console.log('no DataSource - unable to update')
      return
    }
    console.log(`scientific name set to ${selectedName}`)
    const q = getQuery(selectedName)
    dataSource?.updateQueryParams(q, props.id)
    MessageManager.getInstance().publishMessage(new DataSourceFilterChangeMessage(props.id, dataSource.id))
  }, [selectedName, dataSource, props.id])

  function nameChangeHandler (evt: React.MouseEvent<HTMLButtonElement>, value: string) {
    console.log('setting name to ', value)
    setSelectedName(value)
  }

  // runs once
  function onDataSourceCreated (ds: QueriableDataSource) {
    if (ds) {
      setDataSource(ds)
    } else {
      console.error('unable to create DataSource')
    }
  }

  const filterOptions = createFilterOptions({
    matchFrom: 'start',
    limit: 5
  })

  return (
    <div className="widget-demo jimu-widget m-2">
      <DataSourceComponent
        useDataSource={props.useDataSources?.[0]}
        widgetId={props.id}
        onDataSourceCreated={onDataSourceCreated}
      />
      <Autocomplete
        disablePortal
        id="combo-box-demo"
        filterOptions={filterOptions}
        options={names}
        sx={{ width: 280 }}
        renderInput={(params) => <TextField {...params} label="Scientific Name" />}
        onChange={nameChangeHandler}
        size="small"
      />
    </div>
  )
}
