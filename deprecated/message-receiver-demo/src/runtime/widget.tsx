/** @jsx jsx */
import { React, AllWidgetProps, jsx } from 'jimu-core'
import { IMConfig } from '../config'

export default function (props: AllWidgetProps<IMConfig>) {
  const queryString = props.stateProps?.queryString
  const extentString = props.stateProps?.extentString

  return (
    <div className="widget-demo jimu-widget m-2">
      <h2>Message Receiver Demo Widget</h2>
      <p>{queryString? queryString: 'queryString not set'}</p>
      <p>{extentString? extentString: 'extent not set'}</p>
    </div>
  )
}
