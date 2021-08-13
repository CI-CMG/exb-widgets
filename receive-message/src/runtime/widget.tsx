/** @jsx jsx */
import { AllWidgetProps, jsx, IMState, React, State } from 'jimu-core';
import { IMConfig } from '../config';

interface ExtraProps{
  myMessage: String
}

export default class Widget extends React.PureComponent<AllWidgetProps<IMConfig> & ExtraProps, State>{
  props: any;

  static mapExtraStateProps = (state: IMState, ownProps: AllWidgetProps<IMConfig>): ExtraProps => {
    let wId: string;
    for (const [key, value] of Object.entries(state.widgetsState)) {
      // console.log(`widget ${key}: ` , value)
      if(value['myMessage']){
        wId = key;
      }
    }
    return {
      myMessage: state.widgetsState[wId]?.myMessage
    }
  }
  

  render() {
    return (
      <div>
        Message received via shared widget state:
      {this.props.myMessage}
      </div>
    )
  }
}

