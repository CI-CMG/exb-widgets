/** @jsx jsx */
import { AllWidgetProps, jsx, IMState, SqlQueryParams } from "jimu-core";
import { useState, useEffect } from 'react';
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { Label, Radio, defaultMessages as jimuUIMessages } from 'jimu-ui';
import * as Extent from "esri/geometry/Extent";
import { IMConfig } from '../config';

interface ExtraProps {
  sqlString: any
}


export default function Widget (props: AllWidgetProps<IMConfig> & ExtraProps) {
  console.log(props.config)
  const [extent, setExtent] = useState()
  const [view, setView] = useState()
  // useRef instead?
  const [whereClause, setWhereClause] = useState('1=1')
  const [isStationary, setIsStationary] = useState(true)
  const [definitionExpression, setDefinitionExpression] = useState()
  let stationaryWatch
  let extentWatch
  let sqlWatch



  // fires only once, when widget initially opened
  useEffect(() => {

    // one-time cleanup function
    return function cleanup() {
      // remove at time componment is destroyed 
      if (extentWatch) {
        extentWatch.remove()
        extentWatch = null
      }
      if (stationaryWatch) {
        stationaryWatch.remove()
        stationaryWatch = null
      }
    }
  }, [])


  function getQuery(): SqlQueryParams {
    if (props.sqlString) {
      return {
        where: props.sqlString
      }
    }
    // TODO use undefined instead?
    return {where: '(1=1)'}
  }

  // runs with each re-render
  useEffect(() => {
    setWhereClause(getQuery().where)
  })

  useEffect(() => {
    if (!extent) {
      // no need to proceed w/o extent
      return
    }
    if (! isStationary) {
      // view being updated
      return
    }

    const zoom = view.zoom
    console.log('Zoom: ', zoom)
    console.log('Where:', whereClause)

    console.log('layerTitle: ', props.config.layerTitle)
    const layer = view.map.layers.find(lyr => lyr.title === props.config.layerTitle)
    if (whereClause && whereClause != '(1=1)') {
      layer.visible = true
    } else if (definitionExpression && definitionExpression != '(1=1)') {
      layer.visible = true      
    } else if (zoom > 7) {
      layer.visible = true
    } else {
      layer.visible = false
    }
    


  }, [extent, isStationary, whereClause, definitionExpression ])


  useEffect(() => {
    console.log('definitionExpression: ', definitionExpression)
  }, [definitionExpression])


  // only called when widget first loaded
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (! jmv) {
      console.warn('no mapview')
      return
    }
    setView(jmv.view)

    if (!extent) {
      // setting initial extent...
      setExtent(jmv.view.extent)
    }

    // setup Accessor-based watches.  Subscriptions cleaned up via useEffect
    if (!extentWatch) {
      extentWatch = jmv.view.watch('extent', (extent, oldExtent) => {
        // not sure why this happens
        if (extent.equals(oldExtent)) {
          // new extent same as old extent, no action taken
          return
        }
        setExtent(extent)
      });
    };

    if (!stationaryWatch) {
      stationaryWatch = jmv.view.watch('stationary', stationary => {
        setIsStationary(stationary)
      });
    }

    if (!sqlWatch) {
      const layer = jmv.view.map.layers.find(lyr => lyr.title === props.config.layerTitle)
      setDefinitionExpression(layer.definitionExpression)
      sqlWatch = layer.watch('definitionExpression', (newExpression, oldExpression) => {
        console.log('definitionExpression changed from '+oldExpression+' to '+newExpression)
        setDefinitionExpression(newExpression)
      });
    }
  };


  return (
    <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <JimuMapViewComponent 
        useMapWidgetId={props.useMapWidgetIds?.[0]} 
        onActiveViewChange={activeViewChangeHandler}></JimuMapViewComponent>

      <div style={{overflowY: 'auto', height: '100%', paddingLeft: '5px'}}>
        <span>{whereClause}</span>
      </div>
    </div>
  );
}

// this runs a lot, even when widget is not re-rendered
Widget.mapExtraStateProps = (state: IMState, ownProps: AllWidgetProps<IMConfig>): ExtraProps => {
  let wId: string;
  for (const [key, value] of Object.entries(state.widgetsState)) {
    // console.log(`widget ${key}: ` , value)
    if(value['sqlString']){
      wId = key;
    }
  }
  return {
    sqlString: state.widgetsState[wId]?.sqlString
  }
}