/** @jsx jsx */
import { AllWidgetProps, jsx, IMState } from "jimu-core";
import { useState, useEffect } from 'react';
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { defaultMessages as jimuUIMessages } from 'jimu-ui';
import { IMConfig } from '../config';

interface ExtraProps {
  sqlString: any
}

export default function Widget (props: AllWidgetProps<IMConfig> & ExtraProps) {
  const [view, setView] = useState(null)
  // useRef instead?
  const [isStationary, setIsStationary] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  let stationaryWatch
  let updatingWatch

  // fires only once, when widget initially opened
  useEffect(() => {

    // one-time cleanup function
    return function cleanup() {
      // remove at time componment is destroyed 
      if (stationaryWatch) {
        stationaryWatch.remove()
        stationaryWatch = null
      }
      if (updatingWatch) {
        updatingWatch.remove()
        updatingWatch = null
      }
    }
  }, [])
  
  // only called when widget first loaded
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (! jmv) {
      console.warn('no MapView')
      return
    }

    setView(jmv.view)

    if (!updatingWatch) {
      // TODO not sure why this changes so often
      updatingWatch = jmv.view.watch('updating', (newStatus, oldStatus) => {
        // console.log(`updating changed from ${oldStatus} to ${newStatus}...`)
        setIsUpdating(newStatus)
      })
    
    }

    if (!stationaryWatch) {
      stationaryWatch = jmv.view.watch('stationary', stationary => {
        setIsStationary(stationary)
      });
    }
  };


  return (
    <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <JimuMapViewComponent 
        useMapWidgetId={props.useMapWidgetIds?.[0]} 
        onActiveViewChange={activeViewChangeHandler}></JimuMapViewComponent>
      
      <div style={{overflowY: 'auto', height: '100%', paddingLeft: '5px'}}>
        {(!view)?
           <div>
            <span>MapView must be defined</span>
          </div>: ''
        }        
        {(isUpdating)? <span style={{fontSize:"large", color:"red"}}>map is updating...</span> : ''}
      </div>
    </div>
  );
}