/** @jsx jsx */
import { React, jsx, DataSourceTypes, Immutable, UseDataSource } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import {JimuMapViewSelector} from 'jimu-ui/advanced/setting-components'


export default function Setting (props: AllWidgetSettingProps<{}>) {
  const supportedTypes = Immutable([DataSourceTypes.FeatureLayer])

  const onDataSourceChange = (useDataSources: UseDataSource[]) => {
    props.onSettingChange({
      id: props.id,
      useDataSources: useDataSources
    })
  }
  

  const onMapSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    });
  }
  
  return (
    <div className='widget-setting-demo p-3'>
      <span>Select DataSource to filter:</span>
      <DataSourceSelector
        mustUseDataSource
        types={supportedTypes}
        useDataSources={props.useDataSources}
        onChange={onDataSourceChange}
        widgetId={props.id}
      />
    <br/>
    <span>Select the Map to watch:</span> 
      <JimuMapViewSelector onSelect={onMapSelected} useMapWidgetIds={props.useMapWidgetIds}/> 
    </div>
  )
  
}