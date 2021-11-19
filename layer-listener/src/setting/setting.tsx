import {React, Immutable, DataSourceManager,DataSourceTypes,UseDataSource} from 'jimu-core';
import {AllWidgetSettingProps} from 'jimu-for-builder';
import {JimuMapViewSelector} from 'jimu-ui/advanced/setting-components';
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import {ArcGISDataSourceTypes} from 'jimu-arcgis';
import { TextInput, NumericInput } from 'jimu-ui';
import { IMConfig } from "../config";

export default function (props: AllWidgetSettingProps<{}>) {
  const supportedTypes = Immutable([DataSourceTypes.FeatureLayer])

  const onMapSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    });
  }

  const onDataSourceChange = (useDataSources: UseDataSource[]) => {
    props.onSettingChange({
      id: props.id,
      useDataSources: useDataSources
    })
  }

  const onZoomLevelSelected = (value:number ) =>{
    props.onSettingChange({
      id: props.id,
      config: props.config.set('zoomLevelToggle', value)
    });
  }


  return (
    <div className="sample-use-map-view-setting p-2">
      <div>
        <label>Select the Map to watch:</label> 
        <JimuMapViewSelector onSelect={onMapSelected} useMapWidgetIds={props.useMapWidgetIds}/>
      </div>
      <div>
        <label>Select the Map Layer to watch</label>
        <DataSourceSelector
          mustUseDataSource
          types={supportedTypes}
          useDataSources={props.useDataSources}
          onChange={onDataSourceChange}
          widgetId={props.id}
        />
      </div>
      <div>
        <label>Toggle at Zoom Level:</label>
        <NumericInput min="1" max="14" defaultValue="7" onAcceptValue={onZoomLevelSelected}/>
      </div>
    </div>
  )
}