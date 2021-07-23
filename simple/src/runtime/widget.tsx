/** @jsx jsx */
import { AllWidgetProps,  jsx } from 'jimu-core';
import { useState } from 'react';
import { IMConfig } from '../config';

export default function (props: AllWidgetProps<IMConfig>) {

  return( 
    <div className="widget-demo jimu-widget m-2">
      <p>Simple Widget</p>
      <p>exampleConfigProperty: {props.config.exampleConfigProperty}</p>
    </div>
  )
}
