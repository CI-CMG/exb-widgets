/** @jsx jsx */
import { AllWidgetProps,  jsx } from 'jimu-core';
import { IMConfig } from '../config';

export default function (props: AllWidgetProps<IMConfig>) {
  return( 
    <div className="widget-demo jimu-widget m-2">
      <p>Database Version: {props.config.databaseVersion}</p>
    </div>
  )
}

