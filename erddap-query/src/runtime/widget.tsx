/** @jsx jsx */
import { 
  AllWidgetProps, 
  jsx, 
  DataSourceComponent,
  SqlQueryParams, 
  QueriableDataSource, 
  DataSource,
  IMState 
} from 'jimu-core'
import { TextArea, Button, Icon, Tooltip } from 'jimu-ui';
import { JimuMapView, JimuMapViewComponent } from "jimu-arcgis";
import Extent from "esri/geometry/Extent"
import webMercatorUtils from "esri/geometry/support/webMercatorUtils"
import defaultMessages from './translations/default'
// import { Label, Radio, defaultMessages as jimuUIMessages } from 'jimu-ui'
import { useState, useEffect } from 'react';
import { IMConfig } from '../config';

interface ExtraProps {
  sqlString: any
}


export default function Widget (props: AllWidgetProps<IMConfig> & ExtraProps) {
  const [erddapUrl, setErddapUrl] = useState<string>(null)
  const [mapViewReady, setMapViewReady] = useState<boolean>(false)
  const [extent, setExtent] = useState<Extent>()
  const [isStationary, setIsStationary] = useState(true)
  let stationaryWatch
  let extentWatch

  // only called when widget first opened
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (! jmv) {
      console.warn('no mapview')
      return
    }

    if (!extent) {
      // setting initial extent...
      setExtent(webMercatorUtils.webMercatorToGeographic(jmv.view.extent) as Extent)
    }

    // When the extent moves, update the state with all the updated values.
    if (!extentWatch) {
      extentWatch = jmv.view.watch('extent', (extent, oldExtent) => {
        // not sure why this happens
        if (extent.equals(oldExtent)) {
          // new extent same as old extent, no action taken
          return
        }
        setExtent(webMercatorUtils.webMercatorToGeographic(extent) as Extent)
      });
    }

    // this is set to false initially, then once we have the first set of data (and all subsequent) it's set
    // to true, so that we can hide the text until everything is ready:
    setMapViewReady(true);
    
    // setup Accessor-based watches.  Subscriptions cleaned up via useEffect
    if (!stationaryWatch) {
      stationaryWatch = jmv.view.watch('stationary', stationary => {
        setIsStationary(stationary)
      });
    }

  };


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

  useEffect(() => {
    buildErddapUrl()
  },[extent, isStationary, props.sqlString])
 

  function buildErddapUrl() {
    if (! isStationary) {
      // view being updated
      return
    }
    if (! extent) {
      return
    }
    const stdFields = 'ShallowFlag,DatasetID,CatalogNumber,SampleID,ImageURL,Repository,ScientificName,VernacularNameCategory,TaxonRank,IdentificationQualifier,Locality,latitude,longitude,DepthInMeters,DepthMethod,ObservationDate,SurveyID,Station,EventID,SamplingEquipment,LocationAccuracy,RecordType,DataProvider'
    let url = `${props.config.erddapBaseUrl}.html?${stdFields}&latitude>=${extent.ymin.toFixed(4)}&latitude<=${extent.ymax.toFixed(4)}&longitude>=${extent.xmin.toFixed(4)}&longitude<=${extent.xmax.toFixed(4)}`
    if (props.sqlString) {
      // console.log(props.sqlString)
      url += '&' + convertSqlToErddapParams(props.sqlString)
    }
    setErddapUrl(url)
  }


  function convertSqlToErddapParams(sql:string) {
    const params = []
    const regex = /[()]/g
    const fields = sql.replace(regex, '').split(' AND ').map(s => s.match(/\S+/g))
    let item

    // if ShallowFlag and Depth range specified, ShallowFlag takes precedence
    if (fields.filter(i => i[0] == 'DEPTHINMETERS').length == 3) {
      params.push('ShallowFlag=1')
    } else {
      // WARNING: bug exists if Shallow filter and only 1 depth specified. No 
      // way to tell if min/max depths specified or combination of Shallow and 
      // single depth value
      fields.filter(i => i[0] == 'DEPTHINMETERS').forEach(i => {
        params.push(`DepthInMeters${i[1]}${i[2]}`)
      })
    }

    item = fields.find(i => i[0] == 'VERNACULARNAMECATEGORY')
    if (item) {
      // handle multiple word values, remove single quotes
      params.push(`VernacularNameCategory=${item.slice(2).join(' ').replace(/[']/g, '')}`)
    }

    if (fields.some(i => i[0] == 'IMAGEURL')) {
      params.push(`ImageURL!="NA"`)
    }

    item = fields.find(i => i[0] == 'SCIENTIFICNAME')
    if (item) {
      params.push(`ScientificName=${item.slice(2).join(' ').replace(/[']/g, '')}`)
    }

    fields.filter(i => i[0] == 'OBSERVATIONYEAR').forEach(i => {
      params.push(`ObservationYear${i[1]}${i[2]}`)
    })

    return params.join('&')
  }


  function copyUrlBtn() {
    navigator.clipboard.writeText(erddapUrl).then(() => console.debug('copied to clipboard'))
  }



  // TODO add toggle to enable/disable
  return ( 
    <div className="widget-demo jimu-widget m-2">
      {
        props.hasOwnProperty("useMapWidgetIds") &&
        props.useMapWidgetIds &&
        props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent
            useMapWidgetId={props.useMapWidgetIds?.[0]}
            onActiveViewChange={activeViewChangeHandler}
          />
        )
      }
      <div>
        {/* <TextArea style={{width:"85%"}} readOnly="true" value={erddapUrl} /> */}
        <textarea value={erddapUrl} style={{ width: "85%", height: "250px", overflowY:"scroll" }} readOnly={true}/>
        <Tooltip placement="top" title="Copy URL to clipboard">
          <Button aria-label="Button" icon onClick={copyUrlBtn} style={{marginLeft:"10px", marginBottom:"35px"}}>
            <Icon icon="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 32 32&quot;><path d=&quot;M18 14h10.667a2 2 0 110 4H18v10.667a2 2 0 11-4 0V18H3.333a2 2 0 110-4H14V3.333a2 2 0 114 0V14z&quot;></path></svg>" />
          </Button>
        </Tooltip>
      </div>
      <div style={{display:"flex", justifyContent: "center", alignItems: "center"}}>
        <Tooltip placement="top" title="open ERDDAP console to customize output">
          <Button type="primary" tag="a" href={erddapUrl} target="_blank" style={{marginRight: "20px"}}>Customize</Button>
        </Tooltip>
        <Tooltip placement="top" title="Download standard CSV file with current filters applied">
          <Button type="primary" tag="a" href={erddapUrl?.replace('deep_sea_corals.html', 'deep_sea_corals.csvp')} target="_blank" >Download</Button>
        </Tooltip>
      </div>
      <div style={{margin: '20px'}}>
        <span>ERDDAP may take a few minutes to respond to your request</span>
      </div>

    </div>
  )
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