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
import { Label, Radio, defaultMessages as jimuUIMessages } from 'jimu-ui'
import { useState } from 'react';
import { IMConfig } from '../config';

export default function (props: AllWidgetProps<IMConfig>) {
  // console.log('inside datasource-demo...')
  enum DatasetId {
    All = 'All',
    NMNH_IZ = 'NMNH_IZ'
  }
  const [datasetId, setDatasetId] = useState<DatasetId>(DatasetId.All)
  const [dataSources, setDataSources] = useState<DataSource[]>([])


  function onRadioButtonChange(e) {
    const datasetId = e.target.value
    setDatasetId(datasetId)
    console.log('datasetId set to '+datasetId)

    if (! dataSources.length) {
      console.warn('no DataSources defined')
      return
    }

    dataSources.forEach( ds => {
      console.log('update query in data source id ' + ds.id)
      // Update query in data source
      ds.updateQueryParams(getQuery(datasetId), props.id)
    })
  }


  function getQuery(datasetId: DatasetId): SqlQueryParams {
    console.log(getFilter(datasetId))
    return {
      where: getFilter(datasetId)
    }
  }


  function getFilter(datasetId: DatasetId): string {
    if (datasetId && datasetId !== DatasetId.All) {
      return `(DATASETID = '${datasetId}')`
    }
    return '(1=1)'
  }


  // runs once for each DataSource configured
  function onDataSourceCreated(ds: DataSource) {
    console.log('inside onDataSourceCreated...')
    if (datasetId && ds) {
      const dataSource = ds as QueriableDataSource
      console.log('datasource: ', ds.id)

      // keep list of DataSources in state. Note that useState setter is NOT being used
      dataSources.push(dataSource)
      console.log(dataSources.length + ' DataSources configured')

      // initialize the DataSource with current query
      dataSource.updateQueryParams(getQuery(datasetId), props.id)
    } else {
      console.warn('unable to create DataSource', ds.id)
    }
  }


  return( 
    <div className="widget-demo jimu-widget m-2">
      {props.useDataSources?.map((ds) =>
        <DataSourceComponent
        useDataSource={ds}
        widgetId={props.id}
        onDataSourceCreated={onDataSourceCreated}
        />
      )}

      <div>
        <b>{props.intl.formatMessage({ id: 'selectDatasetId', defaultMessage: defaultMessages.selectDatasetId })}</b><br />
        <Label style={{ cursor: 'pointer' }}>
          <Radio
            style={{ cursor: 'pointer' }} value={DatasetId.All} checked={datasetId === DatasetId.All} onChange={onRadioButtonChange}
          /> {props.intl.formatMessage({ id: 'typeAll', defaultMessage: jimuUIMessages.all })}
        </Label>
        {' '}
        <Label style={{ cursor: 'pointer' }}>
          <Radio
            style={{ cursor: 'pointer' }} value={DatasetId.NMNH_IZ} checked={datasetId === DatasetId.NMNH_IZ} onChange={onRadioButtonChange}
          /> {props.intl.formatMessage({ id: 'typeNMNH_IZ', defaultMessage: defaultMessages.typeNMNH_IZ })}
        </Label>
        <p />
      </div>
    </div>
  )
}
