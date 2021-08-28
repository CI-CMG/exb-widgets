/** @jsx jsx */
import { AllWidgetProps, jsx, appActions, MessageManager, StringSelectionChangeMessage } from 'jimu-core';
import {Button} from 'jimu-ui';
import { useState, useEffect } from 'react';
import { IMConfig } from '../config';

export default function (props: AllWidgetProps<IMConfig>) {
  
  function sendMessage() {
    console.log('sending message...')
    console.log(props)
    MessageManager.getInstance().publishMessage(new StringSelectionChangeMessage(props.id, 'Hello World!'));
    props.dispatch(appActions.widgetStatePropChange(props.id, 'myMessage', props.config.exampleConfigProperty));
  }

  return( 
    <div className="widget-demo jimu-widget m-2">
      <p>send-message widget</p>
      <Button onClick={sendMessage}>Send Message</Button>
    </div>
  )
}

