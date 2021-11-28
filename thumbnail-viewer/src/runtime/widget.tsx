/** @jsx jsx */
import { React, AllWidgetProps, jsx } from 'jimu-core'
import { IMConfig } from '../config'

export default function (props: AllWidgetProps<IMConfig>) {
  console.log('inside thumbnail-viewer widget...')
  console.log('props: ', props)
  console.log(props.stateProps?.imageUrl)
  return (
    <div className="widget-demo jimu-widget m-2">
      <h2>Thumbnail Viewer Widget</h2>
      {(props.stateProps?.imageUrl)? <img src={props.stateProps?.imageUrl}/> : <span>no image available</span>}
      {/* <p>{props.stateProps?.queryString? props.stateProps.queryString: 'queryString not set'}</p> */}
    </div>
  )
}
