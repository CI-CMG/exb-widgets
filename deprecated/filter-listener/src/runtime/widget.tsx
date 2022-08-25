/** @jsx jsx */
import { React, AllWidgetProps, jsx } from 'jimu-core'
import { IMConfig } from '../config'

export default function (props: AllWidgetProps<IMConfig>) {
  console.log('inside Filter Listener widget...')
  console.log('props: ', props)
  return (
    <div className="widget-demo jimu-widget m-2">
      <h2>Filter Listener Widget</h2>
      <p>{props.stateProps?.queryString? props.stateProps.queryString: 'queryString not set'}</p>
    </div>
  )
}
