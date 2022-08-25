/** @jsx jsx */
import {React, jsx, ActionSettingProps, ImmutableObject, IMFieldSchema, getAppStore, Immutable, UseDataSource, IMUseDataSource, DataSource} from 'jimu-core';

interface States {}

interface Config {}

export type IMConfig = ImmutableObject<Config>;

class FilterChangeActionSetting extends React.PureComponent<ActionSettingProps<IMConfig>, States>{

//   static defaultProps = {
//     config: Immutable({
//     })
//   }

  /**
   * Returns the init config.
  */
//   getInitConfig = () => {
//     const messageWidgetId = this.props.messageWidgetId;
//     const config = getAppStore().getState().appStateInBuilder.appConfig;
//     const messageWidgetJson = config.widgets[messageWidgetId];

//     return {
//     }
//   }

//   componentDidMount() {
//     const initConfig = this.getInitConfig();
//   }


  render(){
    return <div>
        <p>No configurable properties for this widget</p>
    </div>;
  }
}

export default FilterChangeActionSetting;