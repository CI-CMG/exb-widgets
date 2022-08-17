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
import { TextArea, Button, Icon, Tooltip } from 'jimu-ui'
import { JimuMapView, JimuMapViewComponent } from 'jimu-arcgis'
import Extent from 'esri/geometry/Extent'
import webMercatorUtils from 'esri/geometry/support/webMercatorUtils'
import defaultMessages from './translations/default'
// import { Label, Radio, defaultMessages as jimuUIMessages } from 'jimu-ui'
import { useState, useEffect } from 'react'
import { IMConfig } from '../config'

interface ExtraProps {
  sqlString: any
}

export default function Widget (props: AllWidgetProps<IMConfig> & ExtraProps) {
  const [erddapUrl, setErddapUrl] = useState<string>(null)
  const [mapViewReady, setMapViewReady] = useState<boolean>(false)
  const [extent, setExtent] = useState<Extent>()
  const [isStationary, setIsStationary] = useState(true)
  const [whereClause, setWhereClause] = useState('1=1')
  let stationaryWatch
  let extentWatch
  //TODO get URL from Settings panel
  const CSVfileUrl = 'https://noaa.maps.arcgis.com/home/item.html?id=f465861aecac410980a7c601cfec7850'

  // console.log('rendering erddap-query widget. queryString = ', props.stateProps?.queryString)
  // only called when widget first opened
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (!jmv) {
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
      })
    }

    // this is set to false initially, then once we have the first set of data (and all subsequent) it's set
    // to true, so that we can hide the text until everything is ready:
    setMapViewReady(true)

    // setup Accessor-based watches.  Subscriptions cleaned up via useEffect
    if (!stationaryWatch) {
      stationaryWatch = jmv.view.watch('stationary', stationary => {
        setIsStationary(stationary)
      })
    }
  }

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
    if (props.stateProps?.queryString) {
      return {
        where: props.stateProps.queryString
      }
    } else {
      return { where: '(1=1)' }
    }
  }

  useEffect(() => {
    buildErddapUrl()
  }, [extent, isStationary, props.stateProps?.queryString])

  // runs with each re-render
  useEffect(() => {
    setWhereClause(getQuery().where)
  })

  function buildErddapUrl () {
    if (!isStationary) {
      // view being updated
      console.warn('view being updated')
      return
    }
    if (!extent) {
      console.warn('no extent')
      return
    }
    const stdFields = 'ShallowFlag,DatasetID,CatalogNumber,SampleID,ImageURL,Repository,ScientificName,VernacularNameCategory,TaxonRank,IdentificationQualifier,Locality,latitude,longitude,DepthInMeters,DepthMethod,ObservationDate,SurveyID,Station,EventID,SamplingEquipment,LocationAccuracy,RecordType,DataProvider'
    let url = `${props.config.erddapBaseUrl}.html?${stdFields}&latitude>=${extent.ymin.toFixed(4)}&latitude<=${extent.ymax.toFixed(4)}&longitude>=${extent.xmin.toFixed(4)}&longitude<=${extent.xmax.toFixed(4)}`
    if (props.stateProps?.queryString) {
      // console.log(props.sqlString)
      url += '&' + convertSqlToErddapParams(props.stateProps?.queryString)
    }
    setErddapUrl(url)
  }

  function convertSqlToErddapParams (sql: string) {
    // console.log('inside convertSqlToErddapParams with ', sql)
    // console.log(props.stateProps?.queryString)
    const params = []

    // manipulate SQL string into list of 3-element lists (field, operator, value)
    const clauses = sql
      .replace(/\(+?/g, '') // replace left parens
      .replace(/\)+?/g, '') // replace right parens
      .replace(/LOWER/g, '') // remove the LOWER() function
      .split(/ and /i)
      .map(elem => {
        const t = elem.split(/\s+/)
        // construct 3-element array with field, operator, value. Value may have multiple words which need
        // to be rejoined and replace single quotes with double quotes
        return t.slice(0, 2).concat(t.slice(2).join(' ').replace(/'/g, '"'))
      })
    // console.log(clauses)

    // build key/value pairs for specified parameters
    clauses.filter(elem => elem[0].toLowerCase() === 'vernacularnamecategory').forEach(elem => {
      params.push(`VernacularNameCategory=${elem[2]}`)
    })

    clauses.filter(elem => elem[0].toLowerCase() === 'imageurl').forEach(elem => {
      params.push('ImageURL!="NA"')
    })

    clauses.filter(elem => elem[0].toLowerCase() === 'depthinmeters').forEach(elem => {
      params.push(`DepthInMeters ${elem[1]} ${elem[2]}`)
    })

    clauses.filter(elem => elem[0].toLowerCase() === 'scientificname').forEach(elem => {
      params.push(`ScientificName=${elem[2]}`)
    })

    clauses.filter(elem => elem[0].toLowerCase() === 'observationyear').forEach(elem => {
      params.push(`ObservationYear ${elem[1]} ${elem[2]}`)
    })

    clauses.filter(elem => elem[0].toLowerCase() === 'fishcouncilregion').forEach(elem => {
      params.push(`FishCouncilRegion=${elem[2]}`)
    })

    clauses.filter(elem => elem[0].toLowerCase() === 'ocean').forEach(elem => {
      params.push(`Ocean="${findOceanNameByCode(elem[2])}"`)
    })

    clauses.filter(elem => elem[0].toLowerCase() === 'phylum').forEach(elem => {
      params.push(`Phylum="${elem[2]}"`)
    })

    // Order is a reserved word and renamed in the hosted feature layer
    clauses.filter(elem => elem[0].toLowerCase() === 'order_').forEach(elem => {
      params.push(`Order="${elem[2]}"`)
    })

    clauses.filter(elem => elem[0].toLowerCase() === 'family').forEach(elem => {
      params.push(`Family="${elem[2]}"`)
    })

    clauses.filter(elem => elem[0].toLowerCase() === 'genus').forEach(elem => {
      params.push(`Genus="${elem[2]}"`)
    })

    clauses.filter(elem => elem[0].toLowerCase() === 'class').forEach(elem => {
      params.push(`Class="${elem[2]}"`)
    })



    return params.join('&')
  }

  function findOceanNameByCode (code: string): string {
    const values = {
      0: 'Arctic',
      1: 'Indian',
      2: 'North Atlantic',
      3: 'North Pacific',
      4: 'South Atlantic',
      5: 'South Pacific',
      6: 'Southern'
    }
    return values[code] ? values[code] : ''
  }

  function copyUrlBtn () {
    navigator.clipboard.writeText(erddapUrl).then(() => console.debug('copied to clipboard'))
  }

  // TODO add toggle to enable/disable
  return (
    <div className="widget-demo jimu-widget m-2">
      {
        props.hasOwnProperty('useMapWidgetIds') &&
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
          <Button aria-label="Button" icon onClick={copyUrlBtn} style={{marginLeft:"10px", marginBottom:"30px"}}>
            <Icon icon="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 32 32&quot;><path d=&quot;M18 14h10.667a2 2 0 110 4H18v10.667a2 2 0 11-4 0V18H3.333a2 2 0 110-4H14V3.333a2 2 0 114 0V14z&quot;></path></svg>" />
          </Button>
        </Tooltip>
      </div>
      <div style={{ display:"flex", justifyContent: "center", alignItems: "center" }}>
        <Tooltip placement="top" title="open ERDDAP console to customize output">
          <Button type="primary" tag="a" href={erddapUrl} target="_blank" style={{marginRight: "20px" }}>Customize</Button>
        </Tooltip>
        <Tooltip placement="top" title="Download standard CSV file with current filters applied">
          <Button type="primary" tag="a" href={erddapUrl?.replace('deep_sea_corals.html', 'deep_sea_corals.csvp')} target="_blank" >Download</Button>
        </Tooltip>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Tooltip placement="top" title="Download the entire database in a CSV format">
          <Button type="primary" tag="a" href={CSVfileUrl} target="_blank" style={{ marginTop: "20px" }}>Download Entire Database</Button>
        </Tooltip>
      </div>

      <div style={{ margin: '20px' }}>
        <span>ERDDAP may take a few minutes to respond to your request</span>
      </div>

    </div>
  )
}

// this runs a lot, even when widget is not re-rendered
Widget.mapExtraStateProps = (state: IMState, ownProps: AllWidgetProps<IMConfig>): ExtraProps => {
  let wId: string
  for (const [key, value] of Object.entries(state.widgetsState)) {
    // console.log(`widget ${key}: ` , value)
    if (value['sqlString']) {
      wId = key
    }
  }
  return {
    sqlString: state.widgetsState[wId]?.sqlString
  }
}
