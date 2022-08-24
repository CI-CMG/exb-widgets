/** @jsx jsx */
import { 
  AllWidgetProps, 
  jsx, 
  DataSourceComponent, 
  SqlQueryParams, 
  QueriableDataSource, 
  DataSource,
  IMState 
} from 'jimu-core'
import defaultMessages from './translations/default'
// import { Label, Radio, defaultMessages as jimuUIMessages } from 'jimu-ui'
import { useState } from 'react';
import { IMConfig } from '../config';

interface ExtraProps {
  sqlString: any
}


export default function Widget (props: AllWidgetProps<IMConfig> & ExtraProps) {
  const [dataSource, setDataSource] = useState(null)

  // apply SQL set by Filter widget
  if (dataSource) {
    dataSource.updateQueryParams(getQuery(), props.id)
  }


  function getQuery(): SqlQueryParams {
    if (props.sqlString) {
      return {
        where: props.sqlString
      }
    }
    // TODO use undefined instead?
    return '(1=1)'
  }


  // runs once
  function onDataSourceCreated(ds: DataSource) {
    if (ds) {
      const dataSource = ds as QueriableDataSource
      setDataSource(dataSource)
      dataSource.updateQueryParams(getQuery(), props.id)
    } else {
      console.error('unable to create DataSource')
    }
  }


  // TODO add toggle to enable/disable
  return ( 
    <div className="widget-demo jimu-widget m-2">
      <DataSourceComponent
          useDataSource={props.useDataSources?.[0]}
          widgetId={props.id}
          onDataSourceCreated={onDataSourceCreated}
        />
      {/* {props.sqlString} */}
    </div>
  )
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