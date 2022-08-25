/** @jsx jsx */
import { React, jsx, DataSourceTypes, Immutable, UseDataSource } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
// import {JimuMapViewSelector} from 'jimu-ui/advanced/setting-components'
import {MapWidgetSelector} from 'jimu-ui/advanced/setting-components'
import { SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { TextInput} from 'jimu-ui'



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
  

  const onServiceUrlChange = (value:string ) =>{
    props.onSettingChange({
      id: props.id,
      config: props.config.set('pointLayerTitle', value)
    });
  }


  return (
    <div className='widget-setting-demo p-3'>
      <SettingSection title="DataSource to filter">
        <SettingRow>
          <DataSourceSelector
            mustUseDataSource
            types={supportedTypes}
            useDataSources={props.useDataSources}
            onChange={onDataSourceChange}
            widgetId={props.id}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Map to watch">
        <SettingRow>
          <MapWidgetSelector onSelect={onMapSelected} useMapWidgetIds={props.useMapWidgetIds}/> 
        </SettingRow>
      </SettingSection>

      <SettingSection title="FeatureService URL">
        <SettingRow>
          <TextInput type="url" placeholder="service url" htmlSize={28} onAcceptValue={onServiceUrlChange}/> 
        </SettingRow>
      </SettingSection>

    </div>
  )
}