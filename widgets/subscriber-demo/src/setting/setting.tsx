/** @jsx jsx */
import { React, jsx, Immutable, DataSourceTypes, UseDataSource } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
// import {JimuMapViewSelector} from 'jimu-ui/advanced/setting-components'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { TextInput } from 'jimu-ui'
import { IMConfig } from '../config'

export default function Setting (props: AllWidgetSettingProps<IMConfig>) {
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
    })
  }

  // TODO why isn't this saved in configuration?
  const onServiceUrlChange = (value: string) => {
    console.log('inside onServiceUrlChange with ', value)
    props.onSettingChange({
      id: props.id,
      config: props.config.set('featureServiceUrl', value)
    })
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
