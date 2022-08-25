/** @jsx jsx */
import {React, jsx, ActionSettingProps, ImmutableObject, IMFieldSchema, getAppStore, Immutable, UseDataSource, IMUseDataSource, DataSource} from 'jimu-core';

interface States {}

interface Config {}

export type IMConfig = ImmutableObject<Config>;

class RecordSelectedActionSetting extends React.PureComponent<ActionSettingProps<IMConfig>, States>{

  render(){
    return <div>
        <p>No configurable properties for this widget</p>
    </div>;
  }
}

export default RecordSelectedActionSetting;