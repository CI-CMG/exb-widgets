/** @jsx jsx */
import { AllWidgetProps, jsx, IMState, SqlQueryParams, DataSourceComponent, DataSource, QueriableDataSource } from "jimu-core";
import { useState, useEffect } from 'react';
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import { Label, Radio, defaultMessages as jimuUIMessages } from 'jimu-ui';
import * as Extent from "esri/geometry/Extent";
import { IMConfig } from '../config';

interface ExtraProps {
  sqlString: any
}


export default function Widget (props: AllWidgetProps<IMConfig> & ExtraProps) {
  const [dataSource, setDataSource] = useState(null)
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

  // runs with each re-render
  // useEffect(() => {
  //   setWhereClause(getQuery().where)
  // })

  useEffect(() => {
    if (!extent) {
      // no need to proceed w/o extent
      return
    }
    if (! isStationary) {
      // view being updated
      return
    }

    if (!view || !dataSource) {
      // need both MapView and DataSource
      return
    }
    const zoom = view.zoom
    console.log('Zoom: ', zoom)
    console.log('Where:', whereClause)

    // const layer = view.map.layers.find(lyr => lyr.title === props.config.layerTitle)
    const layer = view.map.layers.find(lyr => lyr.title === dataSource.getLabel())

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



  // runs once
  function onDataSourceCreated(ds: DataSource) {
    if (ds) {
      const dataSource = ds as QueriableDataSource
      setDataSource(dataSource)
    } else {
      console.error('unable to create DataSource')
    }
  }


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
      <DataSourceComponent
          useDataSource={props.useDataSources?.[0]}
          widgetId={props.id}
          onDataSourceCreated={onDataSourceCreated}
        />
      <div style={{overflowY: 'auto', height: '100%', paddingLeft: '5px'}}>
        {(view && dataSource) ?
          <div>
          <span>Where: {definitionExpression? definitionExpression: 'None'}</span><br/>
          <span>Zoom: {view.zoom}</span>
          </div> : 
          <span>view and datasource must be defined</span>
        }
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