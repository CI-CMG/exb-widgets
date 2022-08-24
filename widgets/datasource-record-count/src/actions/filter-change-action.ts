import Extent from 'esri/geometry/Extent'
import {
  AbstractMessageAction,
  MessageType,
  Message,
  getAppStore,
  appActions,
  MessageDescription,
  DataSourceFilterChangeMessage,
  DataSourceManager,
  QueriableDataSource,
  SqlQueryParams
} from 'jimu-core'

export default class FilterAction extends AbstractMessageAction {
  extentString: string|null = null
  queryString: string = '1=1'

  filterMessageDescription (messageDescription: MessageDescription): boolean { return true }

  filterMessage (message: Message): boolean { return true }

  //set action setting uri
  getSettingComponentUri (messageType: MessageType, messageWidgetId?: string): string {
    return 'actions/filter-change-action-setting'
  }

  formatExtentAsString (extent: Extent): string {
    // TODO this is causing problem w/ service worker
    // const geoextent:Extent = webMercatorUtils.webMercatorToGeographic(extent) as Extent
    // return `${geoextent.xmin.toFixed(4)},${geoextent.ymin.toFixed(4)},${geoextent.xmax.toFixed(4)},${geoextent.ymax.toFixed(4)}`
    return `${extent.xmin.toFixed(4)},${extent.ymin.toFixed(4)},${extent.xmax.toFixed(4)},${extent.ymax.toFixed(4)}`
  }

  onExecute (message: Message, actionConfig?: any): Promise<boolean> | boolean {
    switch (message.type) {
      case MessageType.DataSourceFilterChange:
        console.log('datasource-record-count#filter-change-action: got DataSourceFilterChangeMessage', message, actionConfig)
        const ds: QueriableDataSource = DataSourceManager.getInstance().getDataSource((<DataSourceFilterChangeMessage>message).dataSourceId) as QueriableDataSource
        const queryParams: SqlQueryParams = ds.getCurrentQueryParams()

        if (queryParams.where) {
          this.queryString = queryParams.where
        } else {
          this.queryString = '1=1'
        }
        // trigger an update for the widget
        getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'updateCount', this.queryString))
        break

      case MessageType.ExtentChange:
        // console.log('filter-change-action: got ExtentChangeMessage', <ExtentChangeMessage>message, actionConfig)

        // TODO not sure why VSCode doesn't like "message.extent"
        const extentString = this.formatExtentAsString(message['extent'])

        this.extentString = extentString
        //trigger an update for the widget
        console.log('updating property...')
        getAppStore().dispatch(appActions.widgetStatePropChange(this.widgetId, 'updateCount', this.extentString))
        break
    }

    return true
  }
}
