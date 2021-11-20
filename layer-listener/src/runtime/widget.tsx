/** @jsx jsx */
import { AllWidgetProps, jsx, IMState, SqlQueryParams, QueriableDataSource } from "jimu-core";
import { useState, useEffect } from 'react';
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { defaultMessages as jimuUIMessages } from 'jimu-ui';
import * as Extent from "esri/geometry/Extent";
import { IMConfig } from '../config';

interface ExtraProps {
  sqlString: any
}


export default function Widget (props: AllWidgetProps<IMConfig> & ExtraProps) {
  const [extent, setExtent] = useState()
  const [view, setView] = useState()
  // useRef instead?
  const [isStationary, setIsStationary] = useState(true)
  const [definitionExpression, setDefinitionExpression] = useState()
  const [pointLayer, setPointLayer] = useState(null)
  const [densityLayer, setDensityLayer] = useState(null)
  let stationaryWatch
  let extentWatch
  let sqlWatch
  console.log(props.config)



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
      if (sqlWatch) {
        sqlWatch.remove()
        sqlWatch = null
      }

    }
  }, [])


  function getQuery(): SqlQueryParams {
    if (props.sqlString) {
      return {
        where: props.sqlString
      }
    }
    return null
  }


  useEffect(() => {
    if (!extent) {
      // no need to proceed w/o extent
      return
    }
    if (! isStationary) {
      // view being updated
      return
    }

    if (!view) {
      // needs MapView
      return
    }

    if (!pointLayer) {
      console.error("point layer not found")
      return
    }
    if (!densityLayer) {
      console.error("density layer not found")
      return
    }
    
    if (definitionExpression && definitionExpression != '(1=1)') {
      pointLayer.visible = true
      densityLayer.visible = false
    } else if (view.zoom > props.config.zoomLevelToggle) {
      pointLayer.visible = true
      densityLayer.visible = false
    } else {
      pointLayer.visible = false
      densityLayer.visible = true
    }

  }, [extent, isStationary, definitionExpression ])

  // useEffect(() => {
  //   console.log('definitionExpression: ', definitionExpression)
  // }, [definitionExpression])


  // only called when widget first loaded
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (! jmv) {
      console.warn('no mapview')
      return
    }

    setView(jmv.view)
    console.log(props.config)
    console.log('PointLayer: ',props.config.pointLayerTitle)
    setPointLayer(jmv.view.map.layers.find(lyr => lyr.title === props.config.pointLayerTitle))
    setDensityLayer(jmv.view.map.layers.find(lyr => lyr.title === props.config.densityLayerTitle))

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
      const layer = jmv.view.map.layers.find(lyr => lyr.title === props.config.pointLayerTitle)
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
        {(view) ?
          <div>
          <span>Where: {definitionExpression? definitionExpression: 'None'}</span><br/>
          <span>Zoom: {view.zoom}</span>
          </div> : 
          <span>MapView must be defined</span>
        }
      </div>
    </div>
  );
}