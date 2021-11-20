import {React} from 'jimu-core';
import {AllWidgetSettingProps} from 'jimu-for-builder';
import {JimuMapViewSelector} from 'jimu-ui/advanced/setting-components';
import { SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { TextInput, NumericInput } from 'jimu-ui';
import { IMConfig } from "../config";


export default function (props: AllWidgetSettingProps<{}>) {

  const onMapSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    });
  }


  const onZoomLevelSelected = (value:number ) =>{
    props.onSettingChange({
      id: props.id,
      config: props.config.set('zoomLevelToggle', value)
    });
  }


  const onDensityLayerChange = (value:string ) =>{
    props.onSettingChange({
      id: props.id,
      config: props.config.set('densityLayerTitle', value)
    });
  }
  
  
  const onPointLayerChange = (value:string ) =>{
    props.onSettingChange({
      id: props.id,
      config: props.config.set('pointLayerTitle', value)
    });
  }
  
  
  return (
    <div className="sample-use-map-view-setting p-2">

      <SettingSection title="Map to watch">
        <SettingRow>
        <JimuMapViewSelector onSelect={onMapSelected} useMapWidgetIds={props.useMapWidgetIds}/>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Density layer">
        <SettingRow>
        <TextInput placeholder="layer name" htmlSize={28} onAcceptValue={onDensityLayerChange}/>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Point layer">
        <SettingRow>
        <TextInput placeholder="layer name" htmlSize={28} onAcceptValue={onPointLayerChange}/>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Toggle at Zoom Level">
        <SettingRow>
        <NumericInput min="1" max="14" defaultValue="7" onAcceptValue={onZoomLevelSelected}/>
        </SettingRow>
      </SettingSection>
    </div>
  )
}