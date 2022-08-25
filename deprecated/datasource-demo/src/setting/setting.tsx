/** @jsx jsx */
import { React, jsx, DataSourceTypes, Immutable, UseDataSource } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { JimuMapViewSelector,SettingSection,SettingRow } from 'jimu-ui/advanced/setting-components'


export default function Setting (props: AllWidgetSettingProps<{}>) {
  const supportedTypes = Immutable([DataSourceTypes.FeatureLayer])

  const onDataSourceChange = (useDataSources: UseDataSource[]) => {
    props.onSettingChange({
      id: props.id,
      useDataSources: useDataSources
    })
  }
  
  const onDataSourceChange2 = (useDataSources: UseDataSource[]) => {
    props.onSettingChange({
      id: props.id,
      useDataSources: useDataSources
    })
  }
  

  return (
    <div className='widget-setting-demo p-3'>
    <SettingSection
      className="datasource1-selector-section" title="DataSource 1" >
      <SettingRow>
        <DataSourceSelector
          mustUseDataSource
          types={supportedTypes}
          useDataSources={props.useDataSources}
          onChange={onDataSourceChange}
          widgetId={props.id}
          isMultiple={true}
        />
      </SettingRow>
    </SettingSection>

    {/* <SettingSection
      className="datasource2-selector-section" title="DataSource 2" >
      <SettingRow>
        <DataSourceSelector
          mustUseDataSource
          types={supportedTypes}
          useDataSources={props.useDataSources}
          onChange={onDataSourceChange2}
          widgetId={props.id}
        />
      </SettingRow>
    </SettingSection> */}

</div>
  )
  
}