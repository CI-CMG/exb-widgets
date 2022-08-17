/** @jsx jsx */
import { React, jsx, Immutable } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
// import { JimuMapViewSelector,SettingSection,SettingRow } from 'jimu-ui/advanced/setting-components'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { IMConfig } from '../config'
import defaultI18nMessages from './translations/default'

export default function Setting (props: AllWidgetSettingProps<{IMConfig}>) {
  const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    })
  }

  return (
    <div>
    <SettingSection
          className="map-selector-section"
          title={props.intl.formatMessage({
            id: 'mapWidgetLabel',
            defaultMessage: defaultI18nMessages.selectMapWidget
          })}
        >
          <SettingRow>
            <MapWidgetSelector
              onSelect={onMapWidgetSelected}
              useMapWidgetIds={props.useMapWidgetIds}
            />
          </SettingRow>
        </SettingSection>
    </div>
  )
}
