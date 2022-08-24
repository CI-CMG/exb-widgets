/** @jsx jsx */
import { AllWidgetProps, jsx, IMState, React, State, utils } from 'jimu-core';
import { IMConfig } from '../config';

interface ExtraProps{
  myMessage: String
}

export default function Widget (props: AllWidgetProps<IMConfig> & ExtraProps) {
  console.log('re-rendering...')

  console.log('myMessage: ', props.myMessage)

  return (
      <div>
        Message received via shared widget state:
      {props.myMessage}
      </div>
  )
}


// this runs a lot, even when widget is not re-rendered
Widget.mapExtraStateProps = (state: IMState, ownProps: AllWidgetProps<IMConfig>): ExtraProps => {
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

