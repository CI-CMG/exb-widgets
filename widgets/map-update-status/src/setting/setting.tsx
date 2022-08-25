import {React} from 'jimu-core';
import {AllWidgetSettingProps} from 'jimu-for-builder';
// import {JimuMapViewSelector} from 'jimu-ui/advanced/setting-components';
import {MapWidgetSelector} from 'jimu-ui/advanced/setting-components';
import { SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { TextInput, NumericInput, Switch } from 'jimu-ui';
import { IMConfig } from "../config";

export default function (props: AllWidgetSettingProps<IMConfig>) {

  const onMapSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    });
  }


  


  return (
    <div className="map-update-status-setting p-2">

      <SettingSection title="Map to watch">
        <SettingRow>
        <MapWidgetSelector onSelect={onMapSelected} useMapWidgetIds={props.useMapWidgetIds}/>
        </SettingRow>
      </SettingSection>
    </div>
  )
}