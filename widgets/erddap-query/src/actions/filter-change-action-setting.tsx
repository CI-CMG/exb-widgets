/** @jsx jsx */
import { React, jsx, ActionSettingProps, ImmutableObject } from 'jimu-core'

interface States {}
interface Config {}

export type IMConfig = ImmutableObject<Config>

class FilterChangeActionSetting extends React.PureComponent<ActionSettingProps<IMConfig>, States> {
  render () {
    return <div>
        <p>No configurable properties for this widget</p>
    </div>
  }
}

export default FilterChangeActionSetting
